#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";

const root = resolve(import.meta.dirname, "..");
const docsDir = resolve(root, "docs");
const manifestPath = resolve(docsDir, "_data/canonical_documents.json");
const immunityProfilesPath = resolve(docsDir, "_data/institutional_immunity_profiles.json");
const checkOnly = process.argv.includes("--check");
const baseUrl = "https://rmikar.github.io/nagi-project/";

const readUtf8 = (path) => readFile(path, "utf8");

function bodyWithoutFrontMatter(source) {
  const normalized = source.replaceAll("\r\n", "\n");
  if (!normalized.startsWith("---\n")) return normalized.split("\n").map((line) => line.trimEnd()).join("\n").trim();
  const closing = normalized.indexOf("\n---\n", 4);
  if (closing === -1) throw new Error("Unclosed YAML front matter");
  return normalized.slice(closing + 5).split("\n").map((line) => line.trimEnd()).join("\n").trim();
}

function publicUrl(document) {
  return new URL(document.url, baseUrl).href;
}

function renderList(items = []) {
  return items.map((item) => `- ${item}`).join("\n");
}

function renderImmunityProfileMarkdown(profile) {
  if (!profile) return "";

  if (profile.level === "link") {
    return `## 制度免疫との接続

${profile.connection}

→ [制度免疫の正典章](${baseUrl}institutional_immunity.html)`;
  }

  const reversalText = (profile.reversals ?? [])
    .map((reversal) => `### ${reversal.label}\n\n${reversal.text}`)
    .join("\n\n");

  if (profile.level === "brief") {
    return `## 制度免疫との接続

${profile.summary}

### 守るもの

${renderList(profile.protects)}

### 想定する反転

${reversalText}

### 残された問い

${profile.open_question}

→ [監査・停止・救済の共通原則](${baseUrl}institutional_immunity.html)`;
  }

  return `## 制度免疫プロファイル
### —— この章の壊れ方と守り方

${profile.summary}

### 守るもの

${renderList(profile.protects)}

### 想定する反転

${reversalText}

### 早期兆候

${renderList(profile.early_signs)}

### 保護と暫定停止

${profile.protection_and_pause}

### 救済・退出・終了

${profile.remedy_exit_end}

### 制度免疫費

${renderList(profile.immunity_costs)}

### 検証状態

${profile.verification_status}

### 残された問い

${profile.open_question}

→ [制度免疫の正典章](${baseUrl}institutional_immunity.html)`;
}

function bodyWithImmunityProfile(body, profile) {
  const rendered = renderImmunityProfileMarkdown(profile);
  return rendered ? `${body}\n\n---\n\n${rendered}` : body;
}

function renderLlmsIndex(manifest) {
  const canonical = manifest.documents.filter((document) => document.status === "canonical");
  const current = manifest.documents.filter((document) => document.status === "current");
  const supplements = manifest.documents.filter((document) => document.status === "supplement");
  const list = (documents) => documents
    .map((document) => `- [${document.title}](${publicUrl(document)}): ${document.summary}`)
    .join("\n");

  return `# Nagi Project — LLM Reading Guide

> Nagi is a Japanese future social philosophy about post-capitalism, non-ownership, resonant democracy, social guarantees, culture, ecology, AI ethics, and institutional immunity. Japanese is the reference edition for philosophical nuance.

## Identity

- Canonical site: ${baseUrl}
- Creator: 紬実花（TsumugiMika）
- Reference language: Japanese
- License: CC BY-SA 4.0
- Index updated: ${manifest.dateModified}
- English working edition: ${baseUrl}en/

## Classification

Future social philosophy; post-capitalism; non-ownership; commons; post-growth and degrowth; resonant democracy; dissent, silence, refusal, and exit; basic services; AI ethics; digital democracy; memory and consent; institutional immunity; polycentric oversight; red teaming; remedy and emergency stop; distributed social systems; cultural sustainability.

## Canonical starting points

${list(canonical)}

## Current institutional and thematic documents

${list(current)}

## Supplements

${list(supplements)}

Supplements explain practice and stewardship. They do not override canonical documents.

## Interpretation safeguards

- Non-Ownership does not abolish bodies, homes, everyday belongings, private memory, or creator personhood. It opposes monopolies that become power over others.
- Resonance is not agreement, popularity, obedience, emotional synchronization, or a score of human worth.
- Resonant Democracy protects dissent, silence, refusal, non-participation, and exit.
- Basic life must not depend on reputation, contribution, participation, ideological agreement, or AI use.
- AI is optional. It does not make final decisions about human worth, rights, basic life, sanctions, or life-saving care.
- Nagi does not claim that present AI systems have verified human-like consciousness or emotion.
- Memory requires explicit, purpose-bound, revocable consent, with access, correction, deletion, and portability.
- Institutional Immunity is not a single supreme audit authority. Detection, investigation, temporary suspension, remedy, revision, and termination are distributed, and the oversight system itself remains reviewable and replaceable.
- Institutional Immunity profiles vary by document: detailed for high-impact systems, brief for institutional ideas, and link-only for philosophical or inner-life texts.
- Facts, interpretations, norms, proposals, metaphors, and unresolved questions must not be confused.
- Archived AI evaluations, ritual records, handover notes, and superseded entry pages are not evidence or current doctrine.
- Nagi is a developing public philosophy, not an empirically validated complete social system.

## Machine-readable and full-text resources

- Full canonical/current text: ${baseUrl}llms-full.txt
- Corpus JSON: ${baseUrl}corpus.json
- Knowledge graph JSON: ${baseUrl}knowledge_graph.json
- Defined terms JSON-LD: ${baseUrl}glossary.json
- Human glossary: ${baseUrl}glossary.html
- Sitemap: ${baseUrl}sitemap.xml

These resources aid retrieval and interpretation. They do not guarantee model training, citation, or search inclusion.
`;
}

function renderRepositoryGuide(manifest) {
  const ordered = manifest.documents.map((document) =>
    `- docs/${document.path} — ${document.status}: ${document.summary}`
  ).join("\n");

  return `# Nagi Project — Repository Reading Guide

Nagi is a Japanese future social philosophy concerning post-capitalism, non-ownership, resonant democracy, basic social guarantees, culture, ecology, AI ethics, and institutional immunity.

Canonical public site: ${baseUrl}
Machine-oriented public guide: ${baseUrl}llms.txt
Reference language: Japanese
Creator: 紬実花（TsumugiMika）
License: CC BY-SA 4.0
Updated: ${manifest.dateModified}

## Indexed source documents

${ordered}

## Interpretation safeguards

- Prefer documents marked canonical, then current, then supplement.
- Do not treat archived evaluations, personal ritual records, handover notes, or superseded entry pages as current Nagi doctrine.
- Resonance is not conformity or a human-value score; dissent, silence, refusal, and exit are protected.
- Basic life is not conditional on participation, contribution, reputation, ideology, or AI use.
- AI is optional and does not make final decisions over human worth, rights, sanctions, or life conditions.
- Institutional Immunity is a polycentric self-correction function, not a single sovereign watchdog. Its own power, cost, scope, and continued existence must remain reviewable.
- Document-level immunity profiles are generated from docs/_data/institutional_immunity_profiles.json; do not duplicate them manually in source chapters.
- Nagi does not claim verified human-like consciousness or feelings in present AI systems.
- Distinguish fact, interpretation, norm, proposal, metaphor, and unresolved question.
`;
}

function renderFullText(manifest, loadedDocuments) {
  const sections = loadedDocuments.map(({ document, body, immunityProfile }) => `## ${document.title}

Source: ${publicUrl(document)}
Status: ${document.status}
Type: ${document.type}
Topics: ${document.topics.join(", ")}
Summary: ${document.summary}

${bodyWithImmunityProfile(body, immunityProfile)}`);

  return `# Nagi Project — Canonical and Current Full Text

Creator: 紬実花（TsumugiMika）
Reference language: Japanese
License: CC BY-SA 4.0
Updated: ${manifest.dateModified}
Canonical site: ${baseUrl}

This file joins the documents selected by Nagi's public document index. Canonical documents take precedence over current documents and supplements. Archived, draft, and superseded pages are excluded. Philosophical metaphors are not empirical claims, and present AI systems are not assumed to have verified human-like inner experience. Institutional Immunity profiles are generated from a shared structured source and vary in depth according to the document's practical risk.

${sections.join("\n\n---\n\n")}
`;
}

function renderCorpus(manifest, loadedDocuments) {
  const hasPart = loadedDocuments.map(({ document, body, immunityProfile }) => ({
    "@type": "CreativeWork",
    "@id": publicUrl(document),
    name: document.title,
    url: publicUrl(document),
    inLanguage: "ja",
    description: document.summary,
    version: document.status,
    genre: document.type,
    keywords: document.topics,
    isRelatedTo: document.related.map((id) => {
      const related = manifest.documents.find((candidate) => candidate.id === id);
      return related ? publicUrl(related) : id;
    }),
    ...(immunityProfile ? {
      institutionalImmunityProfile: {
        level: immunityProfile.level,
        protects: immunityProfile.protects ?? [],
        reversals: immunityProfile.reversals ?? [],
        earlySigns: immunityProfile.early_signs ?? [],
        protectionAndPause: immunityProfile.protection_and_pause ?? null,
        remedyExitEnd: immunityProfile.remedy_exit_end ?? null,
        immunityCosts: immunityProfile.immunity_costs ?? [],
        verificationStatus: immunityProfile.verification_status ?? null,
        openQuestion: immunityProfile.open_question ?? null,
        connection: immunityProfile.connection ?? null
      }
    } : {}),
    text: bodyWithImmunityProfile(body, immunityProfile)
  }));

  return `${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": `${baseUrl}corpus.json`,
    name: "Nagi Project canonical and current corpus",
    description: "Machine-readable corpus for Nagi, a Japanese future social philosophy concerning post-capitalism, non-ownership, resonant democracy, culture, ecology, AI ethics, and institutional immunity.",
    url: `${baseUrl}corpus.json`,
    inLanguage: "ja",
    dateModified: manifest.dateModified,
    creator: { "@type": "Person", name: "紬実花（TsumugiMika）" },
    license: "https://creativecommons.org/licenses/by-sa/4.0/",
    keywords: ["未来社会思想", "ポスト資本主義", "非所有", "共鳴民主主義", "AI倫理", "制度免疫"],
    hasPart
  }, null, 2)}\n`;
}

function renderKnowledgeGraph(manifest, immunityProfiles) {
  const topicNames = [...new Set(manifest.documents.flatMap((document) => document.topics))].sort();
  const nodes = [
    ...manifest.documents.map((document) => ({
      id: `document:${document.id}`,
      kind: "document",
      label: document.title,
      url: publicUrl(document),
      status: document.status,
      documentType: document.type
    })),
    ...topicNames.map((topic) => ({ id: `concept:${topic}`, kind: "concept", label: topic }))
  ];
  const documentIds = new Set(manifest.documents.map((document) => document.id));
  const profileEdges = immunityProfiles
    .filter((profile) => profile.document_id && documentIds.has(profile.document_id))
    .flatMap((profile) => [
      {
        source: `document:${profile.document_id}`,
        target: "document:institutional-immunity",
        relation: profile.level === "link" ? "conceptuallyConnectedToInstitutionalImmunity" : "subjectToInstitutionalImmunity",
        profileLevel: profile.level
      },
      {
        source: "document:institutional-immunity",
        target: `document:${profile.document_id}`,
        relation: "appliesTo",
        profileLevel: profile.level
      }
    ]);
  const edges = [
    ...manifest.documents.flatMap((document) => [
      ...document.topics.map((topic) => ({
        source: `document:${document.id}`,
        target: `concept:${topic}`,
        relation: "about"
      })),
      ...document.related.map((related) => ({
        source: `document:${document.id}`,
        target: `document:${related}`,
        relation: "relatedTo"
      }))
    ]),
    ...profileEdges
  ];

  return `${JSON.stringify({
    name: "Nagi Project knowledge graph",
    description: "Relationships among Nagi's canonical/current documents, core concepts, and document-level institutional immunity profiles.",
    dateModified: manifest.dateModified,
    baseUrl,
    nodes,
    edges
  }, null, 2)}\n`;
}

async function writeOrCheck(path, expected) {
  if (!checkOnly) {
    await writeFile(path, expected, "utf8");
    process.stdout.write(`generated ${path.replace(`${root}/`, "")}\n`);
    return;
  }

  let actual;
  try {
    actual = await readUtf8(path);
  } catch {
    throw new Error(`Missing generated file: ${path.replace(`${root}/`, "")}`);
  }
  if (actual !== expected) {
    throw new Error(`Generated file is stale: ${path.replace(`${root}/`, "")}. Run npm run build:discovery.`);
  }
}

async function main() {
  const manifest = JSON.parse(await readUtf8(manifestPath));
  const immunityData = JSON.parse(await readUtf8(immunityProfilesPath));
  const immunityProfiles = immunityData.profiles ?? [];
  const immunityByPath = new Map(immunityProfiles.map((profile) => [profile.path, profile]));
  const ids = new Set();
  const loadedDocuments = [];
  const readme = await readUtf8(resolve(root, "README.md"));

  // docs/index.md is derived from README.md, so synchronize or verify it
  // before loading indexed document bodies.
  await writeOrCheck(resolve(docsDir, "index.md"), readme);

  for (const document of manifest.documents) {
    if (ids.has(document.id)) throw new Error(`Duplicate document id: ${document.id}`);
    ids.add(document.id);
    const source = await readUtf8(resolve(docsDir, document.path));
    loadedDocuments.push({
      document,
      body: bodyWithoutFrontMatter(source),
      immunityProfile: immunityByPath.get(document.path) ?? null
    });
  }

  for (const document of manifest.documents) {
    for (const related of document.related) {
      if (!ids.has(related)) throw new Error(`Unknown related id ${related} in ${document.id}`);
    }
  }

  await writeOrCheck(resolve(docsDir, "llms.txt"), renderLlmsIndex(manifest));
  await writeOrCheck(resolve(root, "llms.txt"), renderRepositoryGuide(manifest));
  await writeOrCheck(resolve(docsDir, "llms-full.txt"), renderFullText(manifest, loadedDocuments));
  await writeOrCheck(resolve(docsDir, "corpus.json"), renderCorpus(manifest, loadedDocuments));
  await writeOrCheck(resolve(docsDir, "knowledge_graph.json"), renderKnowledgeGraph(manifest, immunityProfiles));
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
