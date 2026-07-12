#!/usr/bin/env node

import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, extname, join, relative, resolve } from "node:path";
import process from "node:process";

const root = resolve(import.meta.dirname, "..");
const docsDir = resolve(root, "docs");
const validStatuses = new Set(["canonical", "current", "supplement", "draft", "archive", "superseded"]);
const nonIndexedStatuses = new Set(["draft", "archive", "superseded"]);
const validImmunityLevels = new Set(["full", "brief", "link"]);
const errors = [];

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  }));
  return nested.flat();
}

function unquote(value) {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  if (trimmed === "false") return false;
  if (trimmed === "true") return true;
  return trimmed;
}

function splitFrontMatter(source, file) {
  const normalized = source.replaceAll("\r\n", "\n");
  if (!normalized.startsWith("---\n")) return { fields: new Map(), body: normalized };
  const closing = normalized.indexOf("\n---\n", 4);
  if (closing === -1) {
    errors.push(`${file}: front matter starts but does not close with ---`);
    return { fields: new Map(), body: normalized };
  }

  const fields = new Map();
  const frontMatter = normalized.slice(4, closing);
  for (const [index, line] of frontMatter.split("\n").entries()) {
    if (line.includes("\t")) errors.push(`${file}: tab found in front matter line ${index + 2}`);
    const match = line.match(/^([A-Za-z0-9_-]+):(?:\s*(.*))?$/);
    if (!match) continue;
    const [, key, rawValue = ""] = match;
    if (fields.has(key)) errors.push(`${file}: duplicate top-level front matter key ${key}`);
    fields.set(key, unquote(rawValue));
  }
  return { fields, body: normalized.slice(closing + 5) };
}

function validateLiquidTemplate(source, file) {
  const stack = [];
  const opening = new Set(["if", "unless", "case", "for", "capture"]);
  const closing = new Map([
    ["endif", "if"],
    ["endunless", "unless"],
    ["endcase", "case"],
    ["endfor", "for"],
    ["endcapture", "capture"]
  ]);

  for (const match of source.matchAll(/{%-?\s*([a-zA-Z_]+)[\s\S]*?-?%}/g)) {
    const tag = match[1];
    if (opening.has(tag)) stack.push(tag);
    if (closing.has(tag)) {
      const expected = closing.get(tag);
      const actual = stack.pop();
      if (actual !== expected) errors.push(`${file}: ${tag} closes ${actual ?? "nothing"}, expected ${expected}`);
    }
  }
  for (const unclosed of stack.reverse()) errors.push(`${file}: unclosed Liquid ${unclosed} block`);

  const outputOpens = (source.match(/{{/g) ?? []).length;
  const outputCloses = (source.match(/}}/g) ?? []).length;
  if (outputOpens !== outputCloses) errors.push(`${file}: unbalanced Liquid output delimiters`);
}

async function linkExists(sourcePath, rawTarget) {
  const target = rawTarget.split("#", 1)[0].split("?", 1)[0];
  if (!target || /^(?:https?:|mailto:|tel:|#)/.test(target)) return true;

  const candidate = target.startsWith("/")
    ? resolve(docsDir, target.slice(1))
    : resolve(dirname(sourcePath), target);
  if (await exists(candidate)) return true;
  if (target.endsWith(".html") && await exists(candidate.slice(0, -5) + ".md")) return true;
  if (target.endsWith("/") && await exists(join(candidate, "index.md"))) return true;
  return false;
}

const requiredFiles = [
  "robots.txt",
  "llms.txt",
  "llms-full.txt",
  "corpus.json",
  "knowledge_graph.json",
  "glossary.json",
  "glossary.md",
  "faq.md",
  "future_social_philosophy.md",
  "nagi_reading_guide.md",
  "institutional_immunity.md",
  "_data/canonical_documents.json",
  "_data/institutional_immunity_profiles.json",
  "_includes/institutional_immunity_profile.html"
];

for (const file of requiredFiles) {
  if (!(await exists(resolve(docsDir, file)))) errors.push(`docs/${file} is missing`);
}

const jsonFiles = [
  "docs/_data/canonical_documents.json",
  "docs/_data/institutional_immunity_profiles.json",
  "docs/glossary.json",
  "docs/corpus.json",
  "docs/knowledge_graph.json"
];

for (const file of jsonFiles) {
  try {
    JSON.parse(await readFile(resolve(root, file), "utf8"));
  } catch (error) {
    errors.push(`${file}: invalid JSON (${error.message})`);
  }
}

let manifest;
try {
  manifest = JSON.parse(await readFile(resolve(docsDir, "_data/canonical_documents.json"), "utf8"));
  const ids = new Set();
  for (const document of manifest.documents ?? []) {
    if (ids.has(document.id)) errors.push(`canonical document index: duplicate id ${document.id}`);
    ids.add(document.id);
  }
  for (const document of manifest.documents ?? []) {
    if (!(await exists(resolve(docsDir, document.path ?? "")))) {
      errors.push(`canonical document index: missing docs/${document.path}`);
    }
    if (!validStatuses.has(document.status)) {
      errors.push(`canonical document index: invalid status ${document.status} for ${document.id}`);
    }
    for (const related of document.related ?? []) {
      if (!ids.has(related)) errors.push(`canonical document index: unknown related id ${related} in ${document.id}`);
    }
  }
} catch {
  // The JSON error is already reported above.
}

try {
  const immunityData = JSON.parse(await readFile(resolve(docsDir, "_data/institutional_immunity_profiles.json"), "utf8"));
  const manifestById = new Map((manifest?.documents ?? []).map((document) => [document.id, document]));
  const profileIds = new Set();
  const profilePaths = new Set();

  for (const profile of immunityData.profiles ?? []) {
    if (!profile.id) errors.push("institutional immunity profiles: profile without id");
    if (profileIds.has(profile.id)) errors.push(`institutional immunity profiles: duplicate id ${profile.id}`);
    profileIds.add(profile.id);

    if (!profile.path) errors.push(`institutional immunity profiles: missing path for ${profile.id}`);
    if (profilePaths.has(profile.path)) errors.push(`institutional immunity profiles: duplicate path ${profile.path}`);
    profilePaths.add(profile.path);

    if (!validImmunityLevels.has(profile.level)) {
      errors.push(`institutional immunity profiles: invalid level ${profile.level} for ${profile.id}`);
    }

    if (profile.path && !(await exists(resolve(docsDir, profile.path)))) {
      errors.push(`institutional immunity profiles: missing docs/${profile.path}`);
    }

    if (profile.document_id) {
      const document = manifestById.get(profile.document_id);
      if (!document) {
        errors.push(`institutional immunity profiles: unknown document_id ${profile.document_id} for ${profile.id}`);
      } else if (document.path !== profile.path) {
        errors.push(`institutional immunity profiles: path mismatch for ${profile.id}; expected ${document.path}, found ${profile.path}`);
      }
    }

    if (profile.level === "full") {
      for (const field of [
        "summary",
        "protects",
        "reversals",
        "early_signs",
        "protection_and_pause",
        "remedy_exit_end",
        "immunity_costs",
        "verification_status",
        "open_question"
      ]) {
        if (profile[field] === undefined || profile[field] === null || profile[field].length === 0) {
          errors.push(`institutional immunity profiles: full profile ${profile.id} missing ${field}`);
        }
      }
    }

    if (profile.level === "brief") {
      for (const field of ["summary", "protects", "reversals", "open_question"]) {
        if (profile[field] === undefined || profile[field] === null || profile[field].length === 0) {
          errors.push(`institutional immunity profiles: brief profile ${profile.id} missing ${field}`);
        }
      }
    }

    if (profile.level === "link" && !profile.connection) {
      errors.push(`institutional immunity profiles: link profile ${profile.id} missing connection`);
    }
  }
} catch {
  // The JSON error is already reported above.
}

const markdownFiles = (await filesUnder(docsDir)).filter((path) => extname(path) === ".md");
if (await exists(resolve(root, "declarations"))) {
  markdownFiles.push(...(await filesUnder(resolve(root, "declarations"))).filter((path) => extname(path) === ".md"));
}
markdownFiles.push(resolve(root, "README.md"));

for (const path of markdownFiles) {
  const file = relative(root, path);
  const source = await readFile(path, "utf8");
  const { fields, body } = splitFrontMatter(source, file);
  const status = fields.get("status");

  if (status && !validStatuses.has(status)) errors.push(`${file}: unknown status ${status}`);
  if (nonIndexedStatuses.has(status)) {
    const robots = String(fields.get("robots") ?? "");
    if (!robots.includes("noindex")) errors.push(`${file}: ${status} pages must use noindex`);
    if (fields.get("sitemap") !== false) errors.push(`${file}: ${status} pages must set sitemap: false`);
  }
  if (source.includes("{{ site.author }}")) errors.push(`${file}: unresolved Liquid author placeholder`);

  for (const match of source.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    if (!(await linkExists(path, match[1]))) errors.push(`${file}: broken relative link -> ${match[1]}`);
  }

  if (file === "README.md" || file === "docs/index.md") {
    const h1Count = body.split("\n").filter((line) => /^#\s+/.test(line)).length;
    if (h1Count !== 1) errors.push(`${file}: expected exactly one H1, found ${h1Count}`);
  }
}

const liquidTemplates = [
  ["docs/_layouts/default.html", resolve(docsDir, "_layouts/default.html")],
  ["docs/_includes/institutional_immunity_profile.html", resolve(docsDir, "_includes/institutional_immunity_profile.html")]
];

for (const [file, path] of liquidTemplates) {
  const source = await readFile(path, "utf8");
  validateLiquidTemplate(source, file);
}

const layoutPath = resolve(docsDir, "_layouts/default.html");
const layout = await readFile(layoutPath, "utf8");
for (const [label, pattern] of [
  ["title", /<title>/g],
  ["meta description", /<meta name="description"/g],
  ["canonical link", /<link rel="canonical"/g],
  ["Open Graph title", /<meta property="og:title"/g],
  ["Open Graph description", /<meta property="og:description"/g]
]) {
  const count = (layout.match(pattern) ?? []).length;
  if (count !== 1) errors.push(`docs/_layouts/default.html: expected one ${label}, found ${count}`);
}

const readme = await readFile(resolve(root, "README.md"), "utf8");
const index = await readFile(resolve(docsDir, "index.md"), "utf8");
if (readme !== index) errors.push("README.md and docs/index.md differ. Run npm run build:discovery.");

if (errors.length > 0) {
  process.stderr.write(`Site source validation failed:\n${errors.map((error) => `- ${error}`).join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write("Site source validation passed.\n");
}
