#!/usr/bin/env node

import { readFile, readdir, stat } from "node:fs/promises";
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
  const trimmed = String(value ?? "").trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  if (trimmed === "false") return false;
  if (trimmed === "true") return true;
  if (trimmed === "null") return null;
  return trimmed;
}

function splitFrontMatter(source, file) {
  const normalized = source.replaceAll("\r\n", "\n");
  if (!normalized.startsWith("---\n")) {
    errors.push(`${file}: missing YAML front matter`);
    return { fields: new Map(), front: "", body: normalized };
  }
  const closing = normalized.indexOf("\n---\n", 4);
  if (closing === -1) {
    errors.push(`${file}: front matter starts but does not close with ---`);
    return { fields: new Map(), front: "", body: normalized };
  }

  const fields = new Map();
  const front = normalized.slice(4, closing);
  for (const [index, line] of front.split("\n").entries()) {
    if (line.includes("\t")) errors.push(`${file}: tab found in front matter line ${index + 2}`);
    const match = line.match(/^([A-Za-z0-9_-]+):(?:\s*(.*))?$/);
    if (!match) continue;
    const [, key, rawValue = ""] = match;
    if (fields.has(key)) errors.push(`${file}: duplicate top-level front matter key ${key}`);
    fields.set(key, unquote(rawValue));
  }
  return { fields, front, body: normalized.slice(closing + 5) };
}

function nestedScalar(front, parent, key) {
  const block = front.match(new RegExp(`^${parent}:\\s*\\n((?: {2,}.*(?:\\n|$))*)`, "m"))?.[1] ?? "";
  const match = block.match(new RegExp(`^ {2}${key}:\\s*(.*)$`, "m"));
  return match ? unquote(match[1]) : null;
}

function publicPath(path, fields) {
  const permalink = fields.get("permalink");
  if (permalink) return String(permalink).startsWith("/") ? String(permalink) : `/${permalink}`;
  if (path === "index.md") return "/";
  if (path.endsWith("/index.md")) return `/${path.slice(0, -8)}/`;
  return `/${path.slice(0, -3)}.html`;
}

function isIndexable(fields, front) {
  const status = String(fields.get("status") ?? "current");
  const robots = String(fields.get("robots") ?? nestedScalar(front, "meta", "robots") ?? "index, follow").toLowerCase();
  return !nonIndexedStatuses.has(status) && !robots.includes("noindex") && fields.get("sitemap") !== false;
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

  if ((source.match(/{{/g) ?? []).length !== (source.match(/}}/g) ?? []).length) {
    errors.push(`${file}: unbalanced Liquid output delimiters`);
  }
}

function cleanTarget(rawTarget) {
  return String(rawTarget).trim().replace(/^<|>$/g, "").split(/\s+["']/)[0];
}

async function linkExists(sourcePath, rawTarget) {
  const cleaned = cleanTarget(rawTarget);
  const target = cleaned.split("#", 1)[0].split("?", 1)[0];
  if (!target || /^(?:https?:|mailto:|tel:|data:)/.test(target)) return true;

  const candidate = target.startsWith("/")
    ? resolve(docsDir, target.slice(1))
    : resolve(dirname(sourcePath), target);
  if (await exists(candidate)) return true;
  if (target.endsWith(".html") && await exists(candidate.slice(0, -5) + ".md")) return true;
  if (target.endsWith("/") && await exists(join(candidate, "index.md"))) return true;
  return false;
}

function resolveRegistryTarget(sourceDocument, rawTarget, byAbsoluteUrl, baseUrl) {
  const cleaned = cleanTarget(rawTarget);
  if (!cleaned || /^(?:mailto:|tel:|data:|#)/.test(cleaned)) return null;
  let target;
  try {
    target = new URL(cleaned, new URL(sourceDocument.url, baseUrl));
  } catch {
    return null;
  }
  if (target.origin !== baseUrl.origin || !target.pathname.startsWith(baseUrl.pathname)) return null;
  target.hash = "";
  target.search = "";
  if (target.pathname.endsWith(".md")) target.pathname = `${target.pathname.slice(0, -3)}.html`;
  return byAbsoluteUrl.get(target.href) ?? null;
}

const requiredFiles = [
  "robots.txt",
  "sitemap.xml",
  "sitemap-google.xml",
  "sitemap-google.txt",
  "llms.txt",
  "llms-full.txt",
  "en/llms.txt",
  "en/llms-full.txt",
  "corpus.json",
  "knowledge_graph.json",
  "glossary.json",
  "glossary.md",
  "faq.md",
  "future_social_philosophy.md",
  "vital_commons.md",
  "population_and_power.md",
  "governance_and_safety.md",
  "institutional_immunity.md",
  "state_and_public_spheres.md",
  "nagi_os.md",
  "nagi_reading_guide.md",
  "en/future_social_philosophy.md",
  "en/vital_commons.md",
  "en/governance_and_safety.md",
  "en/institutional_immunity.md",
  "en/state_and_public_spheres.md",
  "en/nagi_os.md",
  "en/nagi_reading_guide.md",
  "_data/canonical_documents.json",
  "_data/document_relations.json",
  "_data/translations.yml",
  "_data/faq.json",
  "_data/institutional_immunity_profiles.json",
  "_includes/institutional_immunity_profile.html",
  "_layouts/default.html",
  "assets/og/nagi-default.svg",
  "assets/og/nagi-default.png"
];

for (const file of requiredFiles) {
  if (!(await exists(resolve(docsDir, file)))) errors.push(`docs/${file} is missing`);
}
if (!(await exists(resolve(root, "llms.txt")))) errors.push("llms.txt is missing");

const parsedJson = new Map();
for (const file of [
  "docs/_data/canonical_documents.json",
  "docs/_data/document_relations.json",
  "docs/_data/faq.json",
  "docs/_data/institutional_immunity_profiles.json",
  "docs/glossary.json",
  "docs/corpus.json",
  "docs/knowledge_graph.json"
]) {
  try {
    parsedJson.set(file, JSON.parse(await readFile(resolve(root, file), "utf8")));
  } catch (error) {
    errors.push(`${file}: invalid JSON (${error.message})`);
  }
}

const markdownPaths = (await filesUnder(docsDir))
  .filter((path) => extname(path) === ".md")
  .sort();
const sourceByPath = new Map();
for (const path of markdownPaths) {
  const documentPath = relative(docsDir, path).replaceAll("\\", "/");
  const file = `docs/${documentPath}`;
  const source = await readFile(path, "utf8");
  const parsed = splitFrontMatter(source, file);
  sourceByPath.set(documentPath, { path, source, ...parsed, indexable: isIndexable(parsed.fields, parsed.front) });
}

const registry = parsedJson.get("docs/_data/canonical_documents.json");
const registryDocuments = registry?.documents ?? [];
const registryById = new Map();
const registryByPath = new Map();
const registryUrls = new Set();
let baseUrl;
try {
  baseUrl = new URL(registry?.baseUrl ?? "");
} catch {
  errors.push("canonical document registry: invalid baseUrl");
  baseUrl = new URL("https://nagi-project.com/");
}
const byAbsoluteUrl = new Map();

for (const document of registryDocuments) {
  if (!document.id) errors.push(`canonical document registry: docs/${document.path} has no id`);
  if (registryById.has(document.id)) errors.push(`canonical document registry: duplicate id ${document.id}`);
  registryById.set(document.id, document);
  if (registryByPath.has(document.path)) errors.push(`canonical document registry: duplicate path ${document.path}`);
  registryByPath.set(document.path, document);
  const absoluteUrl = new URL(document.url, baseUrl).href;
  if (registryUrls.has(absoluteUrl)) errors.push(`canonical document registry: duplicate URL ${absoluteUrl}`);
  registryUrls.add(absoluteUrl);
  byAbsoluteUrl.set(absoluteUrl, document);
}

const sourcePaths = new Set(sourceByPath.keys());
const registeredPaths = new Set(registryByPath.keys());
for (const path of sourcePaths) {
  if (!registeredPaths.has(path)) errors.push(`canonical document registry: missing docs/${path}`);
}
for (const path of registeredPaths) {
  if (!sourcePaths.has(path)) errors.push(`canonical document registry: unknown source docs/${path}`);
}

const titleKeys = new Map();
const descriptionKeys = new Map();
for (const [path, parsed] of sourceByPath) {
  const file = `docs/${path}`;
  const status = String(parsed.fields.get("status") ?? "");
  const title = String(parsed.fields.get("title") ?? "").trim();
  const seoTitle = String(parsed.fields.get("seo_title") ?? title).trim();
  const description = String(parsed.fields.get("description") ?? "").trim();
  const explicitLanguage = String(parsed.fields.get("lang") ?? parsed.fields.get("language") ?? "").trim();
  const language = explicitLanguage || (path.startsWith("en/") ? "en" : "ja");
  const lastUpdated = String(parsed.fields.get("last_updated") ?? "").trim();
  const robots = String(parsed.fields.get("robots") ?? nestedScalar(parsed.front, "meta", "robots") ?? "");
  const registered = registryByPath.get(path);

  if (!validStatuses.has(status)) errors.push(`${file}: invalid or missing status ${status || "(empty)"}`);
  if (nonIndexedStatuses.has(status)) {
    if (!robots.toLowerCase().includes("noindex")) errors.push(`${file}: ${status} pages must use noindex`);
    if (parsed.fields.get("sitemap") !== false) errors.push(`${file}: ${status} pages must set sitemap: false`);
  } else if (!parsed.indexable) {
    errors.push(`${file}: canonical/current/supplement pages must be indexable; use archive, superseded, or draft for excluded history`);
  }

  if (parsed.indexable) {
    if (!title) errors.push(`${file}: indexable page is missing title`);
    if (!seoTitle) errors.push(`${file}: indexable page is missing an SEO title`);
    if (!description) errors.push(`${file}: indexable page is missing description`);
    if (!new Set(["ja", "en"]).has(explicitLanguage)) errors.push(`${file}: indexable page must set lang: ja or lang: en`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(lastUpdated)) errors.push(`${file}: indexable page must set last_updated: YYYY-MM-DD`);
    if (language === "en" && description.length > 200) errors.push(`${file}: English meta description exceeds 200 characters (${description.length})`);
    if (language === "ja" && description.length > 160) errors.push(`${file}: Japanese meta description exceeds 160 characters (${description.length})`);
    const h1Count = parsed.body.split("\n").filter((line) => /^#\s+/.test(line)).length;
    if (h1Count !== 1) errors.push(`${file}: expected exactly one H1, found ${h1Count}`);

    for (const prohibited of [
      "複数の公共AIが維持・生産・分配",
      "AIが生命基盤を担う",
      "AIが維持し、人は所有せず",
      "AIは、人を管理せずに生命基盤を管理",
      "基礎食料はAIが支え",
      "AI may operate Vital Commons",
      "AI manages equipment and circulation, not people",
      "Maintenance by multiple distributed public-interest AI systems, people"
    ]) {
      if (parsed.source.includes(prohibited)) {
        errors.push(`${file}: AI is described as the responsible center of Vital Commons (${prohibited}); people and local institutions must remain responsible and AI optional`);
      }
    }

    const titleSuffix = language === "en" ? " | Nagi Project" : "｜凪プロジェクト";
    if (seoTitle.endsWith(titleSuffix)) errors.push(`${file}: seo_title must omit the site-wide suffix ${titleSuffix}`);
    const renderedTitle = path === "index.md" ? seoTitle : `${seoTitle}${titleSuffix}`;
    const titleKey = `${language}\0${renderedTitle}`;
    const descriptionKey = `${language}\0${description}`;
    if (titleKeys.has(titleKey)) errors.push(`${file}: duplicate SEO title also used by docs/${titleKeys.get(titleKey)}`);
    else titleKeys.set(titleKey, path);
    if (descriptionKeys.has(descriptionKey)) errors.push(`${file}: duplicate meta description also used by docs/${descriptionKeys.get(descriptionKey)}`);
    else descriptionKeys.set(descriptionKey, path);
  }

  if (parsed.source.includes("{{ site.author }}")) errors.push(`${file}: unresolved Liquid author placeholder`);
  if (!registered) continue;
  const expectedUrl = publicPath(path, parsed.fields).replace(/^\//, "");
  if (registered.url !== expectedUrl) errors.push(`${file}: registry URL mismatch (${registered.url} != ${expectedUrl})`);
  if (registered.status !== status) errors.push(`${file}: registry status mismatch`);
  if (registered.language !== language) errors.push(`${file}: registry language mismatch`);
  if (Boolean(registered.indexable) !== parsed.indexable) errors.push(`${file}: registry indexable flag mismatch`);
  if (parsed.indexable && String(registered.last_updated) !== lastUpdated) errors.push(`${file}: registry last_updated mismatch`);
  if (parsed.indexable && (!registered.role || !registered.type || !registered.summary)) errors.push(`${file}: registry is missing role, type, or summary`);
}

for (const document of registryDocuments) {
  if (!validStatuses.has(document.status)) errors.push(`canonical document registry: invalid status ${document.status} for ${document.id}`);
  for (const relation of [document.parent, ...(document.related ?? []), document.translation].filter(Boolean)) {
    if (!registryById.has(relation)) errors.push(`canonical document registry: unknown relation ${relation} in ${document.id}`);
  }
  if (document.parent) {
    const parent = registryById.get(document.parent);
    if (document.indexable && !parent?.indexable) errors.push(`canonical document registry: indexed ${document.id} has non-indexed parent ${document.parent}`);
    if (parent && parent.language !== document.language) errors.push(`canonical document registry: ${document.id} and parent ${document.parent} use different languages`);
  }
  if (document.translation) {
    const translated = registryById.get(document.translation);
    if (translated?.translation !== document.id) errors.push(`canonical document registry: translation pair is not reciprocal for ${document.id}`);
    if (translated?.language === document.language) errors.push(`canonical document registry: translation pair uses one language for ${document.id}`);
  }
  if (document.language === "en" && document.translation_of && document.indexable) {
    const source = registryById.get(document.translation_of);
    if (!source || source.language !== "ja") errors.push(`canonical document registry: invalid Japanese source for ${document.id}`);
    if (!document.translation_last_reviewed) errors.push(`canonical document registry: English translation ${document.id} has no review date`);
    if (source && document.source_last_updated !== source.last_updated) errors.push(`canonical document registry: source date mismatch for ${document.id}`);
    const expectedReviewFlag = Boolean(source?.last_updated && document.translation_last_reviewed && String(source.last_updated) > String(document.translation_last_reviewed));
    if (Boolean(document.translation_needs_review) !== expectedReviewFlag) errors.push(`canonical document registry: stale-translation flag mismatch for ${document.id}`);
  }
}

const relations = parsedJson.get("docs/_data/document_relations.json");
for (const override of relations?.documents ?? []) {
  if (!sourceByPath.has(override.path)) errors.push(`document relationship overrides: missing docs/${override.path}`);
  if (override.id && registryByPath.get(override.path)?.id !== override.id) errors.push(`document relationship overrides: id not preserved for docs/${override.path}`);
}

const immunityData = parsedJson.get("docs/_data/institutional_immunity_profiles.json");
const profileIds = new Set();
const profilePaths = new Set();
for (const profile of immunityData?.profiles ?? []) {
  if (!profile.id || profileIds.has(profile.id)) errors.push(`institutional immunity profiles: missing or duplicate id ${profile.id ?? "(empty)"}`);
  profileIds.add(profile.id);
  if (!profile.path || profilePaths.has(profile.path)) errors.push(`institutional immunity profiles: missing or duplicate path ${profile.path ?? "(empty)"}`);
  profilePaths.add(profile.path);
  if (!validImmunityLevels.has(profile.level)) errors.push(`institutional immunity profiles: invalid level ${profile.level} for ${profile.id}`);
  if (profile.path && !sourceByPath.has(profile.path)) errors.push(`institutional immunity profiles: missing docs/${profile.path}`);
  if (profile.document_id && registryById.get(profile.document_id)?.path !== profile.path) errors.push(`institutional immunity profiles: document mismatch for ${profile.id}`);
  const required = profile.level === "full"
    ? ["summary", "protects", "reversals", "early_signs", "protection_and_pause", "remedy_exit_end", "immunity_costs", "verification_status", "open_question"]
    : profile.level === "brief"
      ? ["summary", "protects", "reversals", "open_question"]
      : ["connection"];
  for (const field of required) {
    if (profile[field] === undefined || profile[field] === null || profile[field].length === 0) errors.push(`institutional immunity profiles: ${profile.id} is missing ${field}`);
  }
}

const incoming = new Map(registryDocuments.filter((document) => document.indexable).map((document) => [document.id, new Set()]));
for (const document of registryDocuments.filter((item) => item.indexable)) {
  const parsed = sourceByPath.get(document.path);
  for (const match of parsed.source.matchAll(/!?\[([^\]]*)\]\(([^)]+)\)/g)) {
    const [, label, rawTarget] = match;
    if (!(await linkExists(parsed.path, rawTarget))) errors.push(`docs/${document.path}: broken relative link -> ${rawTarget}`);
    const clean = cleanTarget(rawTarget).split("#", 1)[0].split("?", 1)[0];
    if (/(?:^|\/)index\.html$/.test(clean)) errors.push(`docs/${document.path}: use the canonical directory URL instead of ${clean}`);
    const target = resolveRegistryTarget(document, rawTarget, byAbsoluteUrl, baseUrl);
    if (!target) continue;
    if (target.indexable) incoming.get(target.id)?.add(document.id);
    if (document.indexable && !target.indexable) {
      errors.push(`docs/${document.path}: indexed page links to excluded ${target.status} page docs/${target.path} (${label})`);
    }
  }

  const globalPaths = document.language === "en"
    ? ["en/index.md", "en/vital_commons.md", "en/governance_and_safety.md", "en/culture.md", "en/nagi_reading_guide.md"]
    : ["index.md", "vital_commons.md", "governance_and_safety.md", "culture.md", "nagi_reading_guide.md"];
  for (const targetPath of globalPaths) {
    const target = registryByPath.get(targetPath);
    if (target?.indexable && target.id !== document.id) incoming.get(target.id)?.add(document.id);
  }
  for (const relatedId of document.related ?? []) {
    const target = registryById.get(relatedId);
    if (target?.indexable && target.language === document.language && target.id !== document.id) incoming.get(target.id)?.add(document.id);
  }
  if (document.translation) {
    const target = registryById.get(document.translation);
    if (target?.indexable) incoming.get(target.id)?.add(document.id);
  }
}

for (const document of registryDocuments.filter((item) => item.indexable && !["home", "en-home"].includes(item.id))) {
  if ((incoming.get(document.id)?.size ?? 0) === 0) errors.push(`docs/${document.path}: indexable orphan page has no incoming internal link`);
}

const faqData = parsedJson.get("docs/_data/faq.json")?.items ?? [];
const faqHeadings = sourceByPath.get("faq.md")?.body.match(/^##\s+.+$/gm) ?? [];
if (faqData.length !== faqHeadings.length || faqData.some((item) => !item.question || !item.answer)) {
  errors.push(`docs/_data/faq.json: expected ${faqHeadings.length} complete FAQ entries, found ${faqData.length}`);
}

const glossaryData = parsedJson.get("docs/glossary.json");
const glossaryUpdated = String(sourceByPath.get("glossary.md")?.fields.get("last_updated") ?? "");
if (String(glossaryData?.dateModified ?? "") !== glossaryUpdated) {
  errors.push(`docs/glossary.json: dateModified must match docs/glossary.md last_updated (${glossaryUpdated})`);
}

try {
  const png = await readFile(resolve(docsDir, "assets/og/nagi-default.png"));
  if (png.subarray(1, 4).toString("ascii") !== "PNG") errors.push("docs/assets/og/nagi-default.png: invalid PNG signature");
  if (png.readUInt32BE(16) !== 1200 || png.readUInt32BE(20) !== 630) errors.push("docs/assets/og/nagi-default.png: expected 1200×630 pixels");
} catch {
  // Missing file is reported above.
}

const liquidTemplates = [
  ["docs/_layouts/default.html", resolve(docsDir, "_layouts/default.html")],
  ["docs/_includes/institutional_immunity_profile.html", resolve(docsDir, "_includes/institutional_immunity_profile.html")]
];
for (const [file, path] of liquidTemplates) validateLiquidTemplate(await readFile(path, "utf8"), file);

const layout = await readFile(resolve(docsDir, "_layouts/default.html"), "utf8");
for (const [label, pattern, expected = 1] of [
  ["title", /<title>/g],
  ["meta description", /<meta name="description"/g],
  ["canonical link", /<link rel="canonical"/g],
  ["Open Graph title", /<meta property="og:title"/g],
  ["Open Graph description", /<meta property="og:description"/g],
  ["Open Graph image", /<meta property="og:image" content=/g],
  ["Twitter card", /<meta name="twitter:card" content="summary_large_image"/g]
]) {
  const count = (layout.match(pattern) ?? []).length;
  if (count !== expected) errors.push(`docs/_layouts/default.html: expected one ${label}, found ${count}`);
}
for (const requiredSnippet of [
  "assign resolved_title",
  "｜凪プロジェクト",
  " | Nagi Project",
  "<title>{{ resolved_title | escape }}</title>",
  "<meta property=\"og:title\" content=\"{{ resolved_title | escape }}\">",
  "<meta name=\"twitter:title\" content=\"{{ resolved_title | escape }}\">",
  "凪とは",
  "生命基盤",
  "統治と安全",
  "文化と創造",
  "About Nagi",
  "Vital Commons",
  "Governance &amp; Safety",
  "site.data.faq.items",
  "BreadcrumbList",
  "DefinedTermSet",
  "translation_needs_review",
  "nagi-default.png"
]) {
  if (!layout.includes(requiredSnippet)) errors.push(`docs/_layouts/default.html: missing required structure ${requiredSnippet}`);
}

const readme = await readFile(resolve(root, "README.md"), "utf8");
const index = await readFile(resolve(docsDir, "index.md"), "utf8");
if (readme !== index) errors.push("README.md and docs/index.md differ. Run npm run build:discovery.");

if (errors.length > 0) {
  process.stderr.write(`Site source validation failed:\n${errors.map((error) => `- ${error}`).join("\n")}\n`);
  process.exitCode = 1;
} else {
  const indexed = registryDocuments.filter((document) => document.indexable).length;
  const stale = registryDocuments.filter((document) => document.translation_needs_review).length;
  process.stdout.write(`Site source validation passed (${registryDocuments.length} public pages; ${indexed} indexable; ${stale} translations marked for review; 0 orphans).\n`);
}
