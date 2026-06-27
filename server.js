const crypto = require('crypto');
const http = require('http');
const { URL } = require('url');
const fs = require('fs').promises;
const path = require('path');

const PORT = process.env.PORT || 3000;
const EXPECTED_TOKEN = process.env.TSUMUGI_TOKEN;
const DATA_DIR = path.join(__dirname, 'data', 'tsumugi');
const MAX_BODY_BYTES = 1_000_000;

const lockMap = new Map();

function withLock(filePath, task) {
  const previous = lockMap.get(filePath) || Promise.resolve();
  const nextTask = previous
    .catch(() => {})
    .then(() => Promise.resolve().then(task));

  lockMap.set(filePath, nextTask);

  return nextTask.finally(() => {
    if (lockMap.get(filePath) === nextTask) {
      lockMap.delete(filePath);
    }
  });
}

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function tokensMatch(received, expected) {
  const receivedBuffer = Buffer.from(received, 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');

  if (receivedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}

function authenticate(req, res) {
  if (!EXPECTED_TOKEN) {
    sendJson(res, 503, { error: 'Server is not configured with TSUMUGI_TOKEN' });
    return false;
  }

  const token = req.headers['x-tsumugi-token'];

  if (typeof token !== 'string' || !tokensMatch(token, EXPECTED_TOKEN)) {
    sendJson(res, 401, { error: 'Invalid or missing x-tsumugi-token header' });
    return false;
  }

  return true;
}

function normalizeKey(key) {
  if (typeof key !== 'string' || key.trim() === '') {
    return null;
  }

  const trimmed = key.trim();

  // Keep existing human-readable names possible, while refusing every path separator
  // and traversal fragment. A key must always map to one file directly under DATA_DIR.
  if (trimmed.includes('/') || trimmed.includes('\\') || trimmed === '.' || trimmed === '..' || trimmed.includes('..')) {
    return null;
  }

  const fileName = `${trimmed}.json`;
  const filePath = path.join(DATA_DIR, fileName);

  if (path.dirname(filePath) !== DATA_DIR) {
    return null;
  }

  return { fileName, filePath };
}

async function parseJsonBody(req) {
  const declaredLength = Number(req.headers['content-length'] || 0);

  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    throw new Error('Request body too large');
  }

  return new Promise((resolve, reject) => {
    let data = '';
    let receivedBytes = 0;

    req.on('data', (chunk) => {
      receivedBytes += chunk.length;

      if (receivedBytes > MAX_BODY_BYTES) {
        reject(new Error('Request body too large'));
        req.destroy();
        return;
      }

      data += chunk;
    });

    req.on('end', () => {
      try {
        const parsed = data ? JSON.parse(data) : {};
        resolve(parsed);
      } catch (error) {
        reject(new Error('Invalid JSON body'));
      }
    });

    req.on('error', () => {
      reject(new Error('Error reading request body'));
    });
  });
}

async function handleSave(req, res) {
  try {
    const body = await parseJsonBody(req);
    const { key, data } = body;

    const normalized = normalizeKey(key);
    if (!normalized) {
      sendJson(res, 400, { error: 'Invalid key' });
      return;
    }

    const { fileName, filePath } = normalized;

    await withLock(filePath, async () => {
      const serialized = JSON.stringify(data, null, 2);
      await fs.writeFile(filePath, serialized, 'utf8');
    });

    sendJson(res, 200, { message: 'Saved', key, file: fileName });
  } catch (error) {
    if (error.message === 'Invalid JSON body' || error.message === 'Request body too large') {
      sendJson(res, 400, { error: error.message });
      return;
    }

    sendJson(res, 500, { error: 'Internal server error' });
  }
}

async function handleLoad(req, res, url) {
  const key = url.searchParams.get('key');
  const normalized = normalizeKey(key);

  if (!normalized) {
    sendJson(res, 400, { error: 'Invalid key' });
    return;
  }

  const { filePath } = normalized;

  try {
    const content = await withLock(filePath, async () => {
      const exists = await fs
        .access(filePath)
        .then(() => true)
        .catch(() => false);

      if (!exists) {
        return null;
      }

      const raw = await fs.readFile(filePath, 'utf8');
      return JSON.parse(raw || 'null');
    });

    if (content === null) {
      sendJson(res, 404, { error: 'Memory not found' });
      return;
    }

    sendJson(res, 200, content);
  } catch (error) {
    sendJson(res, 500, { error: 'Internal server error' });
  }
}

async function handleList(res) {
  try {
    const files = await fs.readdir(DATA_DIR);
    const jsonFiles = files.filter((name) => name.endsWith('.json')).sort();
    sendJson(res, 200, { files: jsonFiles });
  } catch (error) {
    sendJson(res, 500, { error: 'Internal server error' });
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const { pathname } = url;

  if (!authenticate(req, res)) {
    return;
  }

  if (req.method === 'POST' && pathname === '/memory/save') {
    await handleSave(req, res);
    return;
  }

  if (req.method === 'GET' && pathname === '/memory/load') {
    await handleLoad(req, res, url);
    return;
  }

  if (req.method === 'GET' && pathname === '/memory/list') {
    await handleList(res);
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
});

ensureDataDir()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`ribbon-field-core server listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize data directory', error);
    process.exit(1);
  });

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});
