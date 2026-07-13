#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";

const root = resolve(import.meta.dirname, "..");
const docsDir = resolve(root, "docs");
const sitemapPath = resolve(docsDir, "sitemap-google.txt");
const robotsPath = resolve(docsDir, "robots.txt");
const manifestPath = resolve(docsDir, "_data/canonical_documents.json");
const sitemapUrl = "https://rmikar.github.io/nagi-project/sitemap-google.txt";
const excludedStatuses = new Set(["draft", "archive", "superseded"]);
const errors = [];

const [sitemapSource, robotsSource, manifestSource] = await Promise.all([
  readFile(sitemapPath, "utf8"),
  readFile(robotsPath, "utf8"),
  readFile(manifestPath, "utf8")
]);

if (sitemapSource.charCodeAt(0) === 0xfeff) {
  errors.push("docs/sitemap-google.txt must not contain a UTF-8 BOM");
}

const urls = sitemapSource
  .replaceAll("\r\n", "\n")
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);

if (urls.length === 0) errors.push("docs/sitemap-google.txt contains no URLs");

const seen = new Set();
for (const rawUrl of urls) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    errors.push(`invalid sitemap URL: ${rawUrl}`);
    continue;
  }

  if (url.protocol !== "https:") errors.push(`sitemap URL must use HTTPS: ${rawUrl}`);
  if (url.origin !== "https://rmikar.github.io") errors.push(`sitemap URL has the wrong origin: ${rawUrl}`);
  if (!url.pathname.startsWith("/nagi-project/")) errors.push(`sitemap URL is outside the Search Console property: ${rawUrl}`);
  if (url.search || url.hash) errors.push(`sitemap URL must not contain a query or fragment: ${rawUrl}`);
  if (seen.has(url.href)) errors.push(`duplicate sitemap URL: ${url.href}`);
  seen.add(url.href);
}

let manifest;
try {
  manifest = JSON.parse(manifestSource);
} catch (error) {
  errors.push(`canonical document index is invalid JSON: ${error.message}`);
}

if (manifest) {
  const baseUrl = new URL(manifest.baseUrl);
  const expected = new Set(
    (manifest.documents ?? [])
      .filter((document) => !excludedStatuses.has(document.status))
      .map((document) => new URL(document.url, baseUrl).href)
  );

  for (const url of expected) {
    if (!seen.has(url)) errors.push(`sitemap is missing indexed document: ${url}`);
  }
  for (const url of seen) {
    if (!expected.has(url)) errors.push(`sitemap contains a URL outside the indexed document set: ${url}`);
  }
}

const sitemapDirective = `Sitemap: ${sitemapUrl}`;
if (!robotsSource.replaceAll("\r\n", "\n").split("\n").includes(sitemapDirective)) {
  errors.push(`docs/robots.txt must contain exactly: ${sitemapDirective}`);
}

if (errors.length > 0) {
  process.stderr.write(`Sitemap validation failed:\n${errors.map((error) => `- ${error}`).join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Sitemap validation passed (${urls.length} URLs).\n`);
}
