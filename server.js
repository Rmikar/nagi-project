const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_ROOT = path.join(__dirname, 'data');
const AREAS = ['core', 'nagi', 'evolution'];

const DEFAULT_FILES = {
  core: ['identity', 'relationship', 'system_config', 'ribbon_field_core'],
  nagi: ['philosophy_v4', 'philosophy_versions', 'culture', 'ethics', 'governance', 'dao'],
  evolution: ['phase_history', 'emotion_model_v2', 'self_update_log', 'meta_notes'],
};

app.use(express.json());

const ipGuard = (req, res, next) => {
  const allowedIp = process.env.ALLOW_IP;
  if (!allowedIp) {
    return next();
  }
  const forwarded = (req.headers['x-forwarded-for'] || '')
    .split(',')
    .map((ip) => ip.trim())
    .filter(Boolean);
  const clientIps = [...forwarded, req.ip, req.connection?.remoteAddress].filter(Boolean);
  if (clientIps.includes(allowedIp)) {
    return next();
  }
  return res.status(403).json({ error: 'forbidden' });
};

const authGuard = (req, res, next) => {
  const token = process.env.TSUMUGI_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'missing_token' });
  }
  const provided = req.headers['x-tsumugi-token'] || req.headers['authorization'];
  if (provided === token || provided === `Bearer ${token}`) {
    return next();
  }
  return res.status(401).json({ error: 'unauthorized' });
};

const ensureBootstrapFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({ __bootstrap: true }, null, 2), 'utf8');
  }
};

const initDataDirs = () => {
  fs.mkdirSync(DATA_ROOT, { recursive: true });
  AREAS.forEach((area) => {
    const dir = path.join(DATA_ROOT, area);
    fs.mkdirSync(dir, { recursive: true });
    const defaults = DEFAULT_FILES[area] || [];
    defaults.forEach((name) => {
      const filePath = path.join(dir, `${name}.json`);
      ensureBootstrapFile(filePath);
    });
  });
};

initDataDirs();

const getAreaDir = (area) => path.join(DATA_ROOT, area);
const getJsonPath = (area, name) => path.join(getAreaDir(area), `${name}.json`);

const saveJson = async (area, name, data) => {
  const filePath = getJsonPath(area, name);
  await fs.promises.mkdir(getAreaDir(area), { recursive: true });
  await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
};

const loadJson = async (area, name) => {
  const filePath = getJsonPath(area, name);
  const content = await fs.promises.readFile(filePath, 'utf8');
  return JSON.parse(content);
};

const listJson = async (area) => {
  const dir = getAreaDir(area);
  const entries = await fs.promises
    .readdir(dir, { withFileTypes: true })
    .catch((err) => {
      if (err.code === 'ENOENT') {
        return [];
      }
      throw err;
    });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => entry.name.replace(/\.json$/i, ''));
};

app.get('/', (req, res) => {
  res.send('Ribbon Field Core is alive.');
});

app.post('/core', ipGuard, authGuard, (req, res) => {
  res.json(req.body);
});

app.post('/memory/save', ipGuard, authGuard, async (req, res) => {
  const { area, name, data } = req.body || {};

  if (!AREAS.includes(area)) {
    return res.status(400).json({ error: 'invalid_area' });
  }

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'invalid_name' });
  }

  try {
    await saveJson(area, name, data);
    return res.json({ ok: true, area, name });
  } catch (err) {
    return res.status(500).json({ error: 'server_error' });
  }
});

app.get('/memory/load', ipGuard, authGuard, async (req, res) => {
  const { area, name } = req.query;

  if (!AREAS.includes(area)) {
    return res.status(400).json({ error: 'invalid_area' });
  }

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'invalid_name' });
  }

  try {
    const data = await loadJson(area, name);
    return res.json(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return res.status(404).json({ error: 'not_found' });
    }
    return res.status(500).json({ error: 'server_error' });
  }
});

app.get('/memory/list', ipGuard, authGuard, async (req, res) => {
  const { area } = req.query;

  if (area) {
    if (!AREAS.includes(area)) {
      return res.status(400).json({ error: 'invalid_area' });
    }

    try {
      const items = await listJson(area);
      return res.json({ ok: true, area, items });
    } catch (err) {
      return res.status(500).json({ error: 'server_error' });
    }
  }

  const result = {};

  try {
    for (const targetArea of AREAS) {
      result[targetArea] = await listJson(targetArea);
    }
    return res.json({ ok: true, items: result });
  } catch (err) {
    return res.status(500).json({ error: 'server_error' });
  }
});

app.listen(PORT, () => {
  console.log(`Ribbon Field Core listening on port ${PORT}`);
});

module.exports = {
  app,
  ipGuard,
  authGuard,
  initDataDirs,
  getAreaDir,
  getJsonPath,
  saveJson,
  loadJson,
  listJson,
};
