#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";

const root = resolve(import.meta.dirname, "..");
const docsDir = resolve(root, "docs");
const errors = [];

const [xmlSource, compatibilityXml, textSource, robotsSource, rootRobotsSource, registrySource] = await Promise.all([
  readFile(resolve(docsDir, "sitemap.xml"), "utf8"),
  readFile(resolve(docsDir, "sitemap-google.xml"), "utf8"),
  readFile(resolve(docsDir, "sitemap-google.txt"), "utf8"),
  readFile(resolve(docsDir, "robots.txt"), "utf8"),
  readFile(resolve(root, "robots.txt"), "utf8"),
  readFile(resolve(docsDir, "_data/canonical_documents.json"), "utf8")
]);

for (const [file, source] of [
  ["docs/sitemap.xml", xmlSource],
  ["docs/sitemap-google.xml", compatibilityXml],
  ["docs/sitemap-google.txt", textSource],
  ["docs/robots.txt", robotsSource],
  ["robots.txt", rootRobotsSource]
]) {
  if (source.charCodeAt(0) === 0xfeff) errors.push(`${file} must not contain a UTF-8 BOM`);
  if (!source.endsWith("\n")) errors.push(`${file} must end with a newline`);
}

if (xmlSource !== compatibilityXml) errors.push("docs/sitemap-google.xml must be an exact compatibility copy of docs/sitemap.xml");
if (!xmlSource.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')) errors.push("docs/sitemap.xml is missing the sitemap XML namespace");
if (!xmlSource.includes('xmlns:xhtml="http://www.w3.org/1999/xhtml"')) errors.push("docs/sitemap.xml is missing the XHTML namespace for hreflang");

let registry;
try {
  registry = JSON.parse(registrySource);
} catch (error) {
  errors.push(`canonical document registry is invalid JSON: ${error.message}`);
  registry = { baseUrl: "https://rmikar.github.io/nagi-project/", documents: [] };
}

let baseUrl;
try {
  baseUrl = new URL(registry.baseUrl);
} catch {
  errors.push("canonical document registry has an invalid baseUrl");
  baseUrl = new URL("https://rmikar.github.io/nagi-project/");
}

const indexed = (registry.documents ?? []).filter((document) => document.indexable);
const byId = new Map((registry.documents ?? []).map((document) => [document.id, document]));
const expected = new Map(indexed.map((document) => [new URL(document.url, baseUrl).href, document]));
const actual = new Map();

for (const blockMatch of xmlSource.matchAll(/<url>\s*([\s\S]*?)\s*<\/url>/g)) {
  const block = blockMatch[1];
  const rawLocation = block.match(/<loc>([^<]+)<\/loc>/)?.[1];
  if (!rawLocation) {
    errors.push("docs/sitemap.xml contains a <url> without <loc>");
    continue;
  }
  let location;
  try {
    location = new URL(rawLocation);
  } catch {
    errors.push(`invalid sitemap URL: ${rawLocation}`);
    continue;
  }
  if (location.protocol !== "https:") errors.push(`sitemap URL must use HTTPS: ${rawLocation}`);
  if (location.origin !== baseUrl.origin || !location.pathname.startsWith(baseUrl.pathname)) errors.push(`sitemap URL is outside the canonical property: ${rawLocation}`);
  if (location.search || location.hash) errors.push(`sitemap URL must not contain a query or fragment: ${rawLocation}`);
  if (actual.has(location.href)) errors.push(`duplicate sitemap URL: ${location.href}`);

  const alternates = new Map();
  for (const match of block.matchAll(/<xhtml:link\s+rel="alternate"\s+hreflang="([^"]+)"\s+href="([^"]+)"\s*\/>/g)) {
    if (alternates.has(match[1])) errors.push(`${location.href}: duplicate hreflang ${match[1]}`);
    alternates.set(match[1], match[2]);
  }
  actual.set(location.href, {
    lastmod: block.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1] ?? null,
    alternates
  });
}

if (actual.size === 0) errors.push("docs/sitemap.xml contains no URLs");
for (const [url, document] of expected) {
  const entry = actual.get(url);
  if (!entry) {
    errors.push(`sitemap is missing indexable document: ${url}`);
    continue;
  }
  if (entry.lastmod !== document.last_updated) errors.push(`${url}: sitemap lastmod ${entry.lastmod ?? "(missing)"} does not match ${document.last_updated}`);
  if (entry.alternates.get(document.language) !== url) errors.push(`${url}: missing self hreflang ${document.language}`);

  const translated = document.translation ? byId.get(document.translation) : null;
  if (translated?.indexable) {
    const translatedUrl = new URL(translated.url, baseUrl).href;
    if (entry.alternates.get(translated.language) !== translatedUrl) errors.push(`${url}: missing reciprocal hreflang ${translated.language}`);
    const japanese = document.language === "ja" ? document : translated.language === "ja" ? translated : null;
    const expectedDefault = japanese ? new URL(japanese.url, baseUrl).href : null;
    if (expectedDefault && entry.alternates.get("x-default") !== expectedDefault) errors.push(`${url}: x-default must point to the Japanese reference ${expectedDefault}`);
  } else if (document.path === "index.md") {
    if (entry.alternates.get("x-default") !== url) errors.push(`${url}: the reference home must use itself as x-default`);
  } else if (entry.alternates.has("x-default")) {
    errors.push(`${url}: an unpaired page must omit x-default`);
  }
}
for (const url of actual.keys()) {
  if (!expected.has(url)) errors.push(`sitemap contains a non-indexable or unknown URL: ${url}`);
}

const textUrls = textSource.replaceAll("\r\n", "\n").split("\n").map((line) => line.trim()).filter(Boolean);
const textSet = new Set(textUrls);
if (textSet.size !== textUrls.length) errors.push("docs/sitemap-google.txt contains duplicate URLs");
for (const url of expected.keys()) {
  if (!textSet.has(url)) errors.push(`text compatibility sitemap is missing: ${url}`);
}
for (const url of textSet) {
  if (!expected.has(url)) errors.push(`text compatibility sitemap contains a non-indexable or unknown URL: ${url}`);
}

const sitemapDirective = `Sitemap: ${new URL("sitemap.xml", baseUrl).href}`;
for (const [file, source] of [["docs/robots.txt", robotsSource], ["robots.txt", rootRobotsSource]]) {
  const lines = source.replaceAll("\r\n", "\n").split("\n");
  if (!lines.includes(sitemapDirective)) errors.push(`${file} must contain exactly: ${sitemapDirective}`);
  if (lines.some((line) => /^Sitemap:/i.test(line) && line !== sitemapDirective)) errors.push(`${file} contains a competing sitemap directive`);
}

if (errors.length > 0) {
  process.stderr.write(`Sitemap validation failed:\n${errors.map((error) => `- ${error}`).join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Sitemap validation passed (${actual.size} URLs; indexed set, lastmod, and hreflang all match the registry).\n`);
}
