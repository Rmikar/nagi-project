#!/usr/bin/env node

import { readFile, writeFile, unlink } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const DATE = "2026-07-18";
const read = (path) => readFile(resolve(root, path), "utf8");
const write = (path, content) => writeFile(resolve(root, path), content.replaceAll("\r\n", "\n").replace(/\s*$/, "\n"), "utf8");

function replaceOnce(source, from, to, label) {
  const count = source.split(from).length - 1;
  if (count !== 1) throw new Error(`${label}: expected one match, found ${count}`);
  return source.replace(from, to);
}

function updateDate(source) {
  if (/last_updated: \d{4}-\d{2}-\d{2}/.test(source)) {
    return source.replace(/last_updated: \d{4}-\d{2}-\d{2}/, `last_updated: ${DATE}`);
  }
  return source;
}

function addUnique(items, ...values) {
  for (const value of values) if (!items.includes(value)) items.push(value);
  return items;
}

async function updateReadme() {
  let source = updateDate(await read("README.md"));
  const anchor = `凪は、効率の外にある休息、文化、関係、自然との往復を、社会の周辺ではなく中心に置きます。\n\n---\n\n## 🛡 制度免疫`;
  const section = `凪は、効率の外にある休息、文化、関係、自然との往復を、社会の周辺ではなく中心に置きます。\n\n---\n\n## 🌱 価値を、支配の根拠にしない\n### —— 価値は受け継ぎ、構造は問い直す\n\n凪は、文化、歴史、功績、専門性、創造、継承、成功の価値を否定しません。\n\nしかし、その価値や一時的な勝利を、身分、特権、既得権益、批判を免れる権威、恒久的な決定権へ自動的に変換しません。\n\n> **価値は受け継ぐ。**  \n> **構造は問い直す。**  \n> **勝ちは、次のルールを所有しない。**\n\n勝者は、期限と権限の範囲内で公共の決定に関わり、成果への報酬を受けられます。\n\nそれでも、基本的権利、次の参加条件、評価基準、監査、再挑戦の可能性を私物化することはできません。\n\n文化や公共的な役割も、個人、家系、組織の所有物にはしません。多くの人が役割の継続を望んでも、一人の人間には、引き受けず、辞め、別の生き方を選ぶ自由があります。\n\n→ [制度設計と実践 — 価値を残し、勝ちの構造を固定しない](https://rmikar.github.io/nagi-project/institutional_design.html)  \n→ [自由・不協和・離脱の原則](https://rmikar.github.io/nagi-project/freedom_and_dissent.html)\n\n---\n\n## 🛡 制度免疫`;
  source = replaceOnce(source, anchor, section, "README value-and-structure section");
  source = replaceOnce(
    source,
    `- [制度設計と実践](https://rmikar.github.io/nagi-project/institutional_design.html)`,
    `- [制度設計と実践 — 価値を残し、勝ちの構造を固定しない](https://rmikar.github.io/nagi-project/institutional_design.html)\n- [国家は目的ではなく、必要な機能へほどく](https://rmikar.github.io/nagi-project/state_and_public_spheres.html)`,
    "README governance links"
  );
  await write("README.md", source);
}

async function updateFutureSocialPhilosophy() {
  let source = updateDate(await read("docs/future_social_philosophy.md"));
  source = replaceOnce(source, `  - 制度免疫\nai_index:`, `  - 制度免疫\n  - 制度設計\n  - 既得権益\nai_index:`, "future keywords");
  source = source.replace(
    `theme: "post-capitalism, resonant democracy, non-ownership, commons, AI ethics, institutional immunity"`,
    `theme: "post-capitalism, resonant democracy, non-ownership, value and structure, commons, AI ethics, institutional immunity"`
  );
  source = replaceOnce(
    source,
    `- 土地、知識、文化、データ、基盤技術が、他者を従わせる独占へ変わる\n`,
    `- 土地、知識、文化、データ、基盤技術が、他者を従わせる独占へ変わる\n- 評価された価値や一時的な勝利が、身分、既得権益、次のルールを決める力へ固定される\n`,
    "future problem list"
  );
  const anchor = `その最低条件として、食、住、医療、教育、通信、文化への基礎的なアクセスを、貢献度、人気、AI利用の報酬にしないという**基礎呼吸**を置く。\n\n## 政治構想 — 共鳴民主主義`;
  const section = `その最低条件として、食、住、医療、教育、通信、文化への基礎的なアクセスを、貢献度、人気、AI利用の報酬にしないという**基礎呼吸**を置く。\n\n## 価値を、支配の根拠にしない\n\n凪は、文化、歴史、功績、専門性、創造、成功の価値を否定しない。\n\nただし、その価値や一時的な勝利を、身分、特権、既得権益、批判を免れる権威、未来のルールを所有する力へ変換しない。\n\n> 価値は受け継ぐ。  \n> 構造は問い直す。  \n> 勝ちは、次のルールを所有しない。\n\n制度や役割は、価値そのものではない。目的を失い、人の自由や公共性を損なう構造は、変更、縮小、分割、移管、終了できなければならない。\n\nまた、文化や公共的役割の継続を、多数の期待によって特定の個人へ強制してはならない。\n\n→ [制度設計と実践](institutional_design.html)\n\n## 政治構想 — 共鳴民主主義`;
  source = replaceOnce(source, anchor, section, "future value-and-structure section");
  const nextReading = `1. [凪の核](nagi_core.html)\n2. [凪の宣言文](declaration.html)\n3. [羅針盤と共鳴民主主義](compass_and_resonant_democracy.html)\n4. [自由・不協和・離脱の原則](freedom_and_dissent.html)\n5. [社会的装置の倫理](ethics_of_social_infrastructure.html)\n6. [制度免疫](institutional_immunity.html)\n7. [移行と危機の設計](transition_and_crisis.html)\n8. [凪AI憲法](nagi_ai_charter.html)\n9. [よくある質問](faq.html)\n10. [用語集](glossary.html)`;
  const nextReadingUpdated = `1. [凪の核](nagi_core.html)\n2. [凪の宣言文](declaration.html)\n3. [羅針盤と共鳴民主主義](compass_and_resonant_democracy.html)\n4. [自由・不協和・離脱の原則](freedom_and_dissent.html)\n5. [制度設計と実践](institutional_design.html)\n6. [国家は目的ではなく、必要な機能へほどく](state_and_public_spheres.html)\n7. [社会的装置の倫理](ethics_of_social_infrastructure.html)\n8. [制度免疫](institutional_immunity.html)\n9. [移行と危機の設計](transition_and_crisis.html)\n10. [凪AI憲法](nagi_ai_charter.html)\n11. [よくある質問](faq.html)\n12. [用語集](glossary.html)`;
  source = replaceOnce(source, nextReading, nextReadingUpdated, "future next-reading list");
  await write("docs/future_social_philosophy.md", source);
}

async function updateReadingGuide() {
  let source = updateDate(await read("docs/nagi_reading_guide.md"));
  source = source.replace(
    `ここで、非所有・共鳴・呼吸、共鳴民主主義、AIの位置づけ、近接する思想との違い、主要な反論と未解決課題を一度に確認できる。`,
    `ここで、非所有・共鳴・呼吸、価値と構造を分ける判断原則、共鳴民主主義、AIの位置づけ、近接する思想との違い、主要な反論と未解決課題を一度に確認できる。`
  );
  const oldHour = `1. [移行と危機の設計](transition_and_crisis.html)\n2. [社会的装置の倫理](ethics_of_social_infrastructure.html)\n3. [呼吸経済](breath_economy.html)\n4. [共鳴メトリクス](resonance_metrics.html)\n5. [呼吸会議](breath_assembly.html)\n6. [凪AI憲法](nagi_ai_charter.html)`;
  const newHour = `1. [制度設計と実践](institutional_design.html) — 価値と構造を分け、勝ちや継承の固定化を防ぐ\n2. [社会的装置の倫理](ethics_of_social_infrastructure.html) — 人を束ねる力を支配へ変えない\n3. [制度免疫](institutional_immunity.html) — 壊れ方を感知し、止め、救済し、終了できるようにする\n4. [移行と危機の設計](transition_and_crisis.html) — 権利を後退させず、小さく試し、危機権限を恒久化しない`;
  source = replaceOnce(source, oldHour, newHour, "reading guide one-hour path");
  source = replaceOnce(
    source,
    `- [自由・不協和・離脱の原則](freedom_and_dissent.html)\n- [呼吸会議](breath_assembly.html)\n- [信頼と統治](trust.html)\n- [社会的装置の倫理](ethics_of_social_infrastructure.html)`,
    `- [自由・不協和・離脱の原則](freedom_and_dissent.html)\n- [制度設計と実践](institutional_design.html)\n- [呼吸会議](breath_assembly.html)\n- [信頼と統治](trust.html)\n- [社会的装置の倫理](ethics_of_social_infrastructure.html)\n- [制度免疫](institutional_immunity.html)`,
    "reading guide governance path"
  );
  source = replaceOnce(
    source,
    `- [社会的装置の倫理](ethics_of_social_infrastructure.html)\n\n### AI倫理・デジタル社会`,
    `- [社会的装置の倫理](ethics_of_social_infrastructure.html)\n- [制度免疫](institutional_immunity.html)\n\n### 国家・公共圏\n\n- [国家は目的ではなく、必要な機能へほどく](state_and_public_spheres.html)\n- [制度設計と実践](institutional_design.html)\n- [自由・不協和・離脱の原則](freedom_and_dissent.html)\n- [移行と危機の設計](transition_and_crisis.html)\n\n### AI倫理・デジタル社会`,
    "reading guide public-spheres path"
  );
  await write("docs/nagi_reading_guide.md", source);
}

async function splitStateAndPhilosophy() {
  let state = updateDate(await read("docs/philosophy.md"));
  state = state.replace(`permalink: /philosophy.html`, `permalink: /state_and_public_spheres.html`);
  await write("docs/state_and_public_spheres.md", state);

  const philosophy = `---\nlayout: default\ntitle: "凪の哲学的背景"\nstatus: current\ndescription: "国家、市場、企業、AIの一つを中心に置かず、生活・記憶・土地・文化・関係・自然の積層から社会を捉える凪の哲学的背景。"\nlast_updated: ${DATE}\npermalink: /philosophy.html\n---\n\n# 凪の哲学的背景\n\n凪は、国家、市場、企業、AIのどれか一つを世界の中心に置かない。\n\n世界は、生活、記憶、土地、文化、関係、自然の積層から立ち上がる。制度は、その積層に耳をすませ、支配を減らし、次へ渡せる余白を守るためにある。\n\n非所有は独占をほどくために、共鳴は違いを消さずに関わるために、呼吸は回復と循環を社会に戻すためにある。\n\n凪は、完成した答えではなく、未来を急いで固定しないための羅針盤である。\n\n→ [凪の核](nagi_core.html)  \n→ [国家は目的ではなく、必要な機能へほどく](state_and_public_spheres.html)\n`;
  await write("docs/philosophy.md", philosophy);
}

async function updateCoreAndChapters() {
  let core = updateDate(await read("docs/nagi_core.md"));
  core = replaceOnce(
    core,
    `> **価値は受け継ぐ。**  \n> **不要な構造はほどく。**`,
    `> **価値は受け継ぐ。**  \n> **構造は問い直す。**\n\n価値を支配へ変える構造は、変更、縮小、分割、移管、終了できるようにする。`,
    "core value-and-structure maxim"
  );
  core = core.replaceAll(`](philosophy.html)`, `](state_and_public_spheres.html)`);
  await write("docs/nagi_core.md", core);

  let culture = updateDate(await read("docs/culture.md"));
  culture = culture.replaceAll(`](philosophy.html)`, `](state_and_public_spheres.html)`);
  await write("docs/culture.md", culture);

  let design = updateDate(await read("docs/institutional_design.md"));
  design = replaceOnce(
    design,
    `> **価値は受け継ぐ。**  \n> **不要な構造はほどく。**  \n> **勝ちは、次のルールを所有しない。**`,
    `> **価値は受け継ぐ。**  \n> **構造は問い直す。**  \n> **価値を支配へ変える構造はほどく。**  \n> **勝ちは、次のルールを所有しない。**`,
    "institutional design maxim"
  );
  await write("docs/institutional_design.md", design);
}

async function updateManifest() {
  const path = "docs/_data/canonical_documents.json";
  const manifest = JSON.parse(await read(path));
  manifest.dateModified = DATE;
  const byId = new Map(manifest.documents.map((document) => [document.id, document]));

  const home = byId.get("home");
  home.summary = "非所有・共鳴・呼吸を軸に、価値を支配へ変えない判断原則と制度免疫を示す凪プロジェクトの公式入口。";
  addUnique(home.topics, "制度設計", "価値と構造");
  addUnique(home.related, "institutional-design", "state-public-spheres");

  const future = byId.get("future-social-philosophy");
  future.summary = "凪をポスト資本主義、価値と構造、共鳴民主主義、AI倫理との関係から位置づけ、反論と未解決課題も示す。";
  addUnique(future.topics, "制度設計", "既得権益");
  addUnique(future.related, "institutional-design", "state-public-spheres");

  const core = byId.get("nagi-core");
  core.summary = "凪の世界観、三原則、中心なき構造、価値を支配へ変えない判断原則を定義する中心文書。";
  addUnique(core.topics, "価値と構造");
  addUnique(core.related, "philosophy-background", "institutional-design", "state-public-spheres");

  const freedom = byId.get("freedom-dissent-exit");
  freedom.summary = "参加や役割を強制せず、異議、沈黙、拒否、離脱、期待された役割から降りる自由を守る安全原則。";
  addUnique(freedom.topics, "役割から降りる自由");
  addUnique(freedom.related, "institutional-design", "state-public-spheres");

  const culture = byId.get("culture");
  culture.summary = "文化を育てながら継承し、その尊さを身分や特権へ変えず、継ぐ人と受け取らない人の自由を守る。";
  addUnique(culture.topics, "継承の自由", "反特権");
  addUnique(culture.related, "institutional-design", "state-public-spheres");

  const design = byId.get("institutional-design");
  Object.assign(design, {
    title: "制度設計と実践 — 価値を残し、勝ちの構造を固定しない",
    summary: "文化的・社会的価値を残しながら、勝ち、功績、継承、民意が身分、特権、既得権益へ固定されることを防ぐ制度設計原則。",
    topics: ["制度設計", "価値と構造", "既得権益", "継承の自由", "反独占"],
    related: ["nagi-core", "freedom-dissent-exit", "state-public-spheres", "social-infrastructure-ethics", "institutional-immunity", "transition-crisis"]
  });

  const philosophyDocument = {
    id: "philosophy-background",
    path: "philosophy.md",
    url: "philosophy.html",
    title: "凪の哲学的背景",
    status: "current",
    type: "philosophical-context",
    summary: "国家、市場、企業、AIを単一の中心に置かず、生活・記憶・土地・文化・関係・自然の積層から社会を捉える。",
    topics: ["中心なき構造", "非所有", "共鳴", "呼吸"],
    related: ["nagi-core", "state-public-spheres"]
  };
  const stateDocument = {
    id: "state-public-spheres",
    path: "state_and_public_spheres.md",
    url: "state_and_public_spheres.html",
    title: "国家は目的ではなく、必要な機能へほどく",
    status: "current",
    type: "political-philosophy",
    summary: "国家の存続や消滅を目的化せず、生存、権利、管理、文化、安全、広域調整を分け、それぞれに適した公共圏を考える。",
    topics: ["国家", "公共圏", "生存保障", "多中心統治", "文化継承"],
    related: ["nagi-core", "freedom-dissent-exit", "institutional-design", "institutional-immunity", "transition-crisis"]
  };

  if (!byId.has(philosophyDocument.id)) {
    const index = manifest.documents.findIndex((document) => document.id === "nagi-core") + 1;
    manifest.documents.splice(index, 0, philosophyDocument);
  }
  if (!byId.has(stateDocument.id)) {
    const index = manifest.documents.findIndex((document) => document.id === "institutional-design") + 1;
    manifest.documents.splice(index, 0, stateDocument);
  }

  await write(path, JSON.stringify(manifest, null, 2));
}

async function updateImmunityProfiles() {
  const path = "docs/_data/institutional_immunity_profiles.json";
  const data = JSON.parse(await read(path));
  data.dateModified = DATE;
  const index = data.profiles.findIndex((profile) => profile.document_id === "institutional-design");
  if (index === -1) throw new Error("institutional-design immunity profile not found");

  data.profiles[index] = {
    id: "institutional-design",
    document_id: "institutional-design",
    path: "institutional_design.md",
    level: "full",
    summary: "価値、勝利、功績、継承、民意が、身分、特権、既得権益、個人への役割強制へ反転しないための制度免疫プロファイル。",
    protects: [
      "価値を認めながら人間の序列をつくらないこと",
      "次の参加条件、評価基準、監査、再挑戦の可能性",
      "期待された役割を拒否し、辞め、離れる自由",
      "公共的な役割と資源を私物化されないこと"
    ],
    reversals: [
      { label: "悪意による悪用", text: "現在の勝者や受益者が、評価基準、参加条件、後継者、監査主体を支配し、自らの優位を恒久化する。" },
      { label: "善意・効率化による害", text: "文化、伝統、専門性、民意を守るためとして、特定の個人へ役割を強制し、異議や離脱を無責任として扱う。" },
      { label: "構造・時間による形骸化", text: "一時的な地位、免除、優先権が更新され続け、受益者自身が制度の必要性と継続を認定する。" }
    ],
    early_signs: [
      "同じ主体が役割、後継者、評価基準、監査を決める",
      "例外的な優遇や免除が期限なく更新される",
      "新規参加者、批判者、離脱者の入口が狭くなる",
      "継承や役割を拒否した個人へ評判・生活・家族関係の不利益が生じる",
      "制度の受益者だけで再認可や終了を判断する"
    ],
    protection_and_pause: "役割の強制、参加制限、優先権、免除、後継者選定、資源配分のうち、権利や生活へ重大な影響を与える部分を期限付きで停止し、受益者から独立した審査へ移す。",
    remedy_exit_end: "役割からの離脱、地位・契約・資源配分の再審、差別的な参加条件の取消し、評判と生活上の不利益の回復を保障する。制度の分割、移管、失効、終了も選択肢に含める。",
    immunity_costs: [
      "利益相反の開示と独立審査",
      "新規参加者・離脱者・将来負担者の参加報酬",
      "異議申立てと役割離脱の支援",
      "再認可・失効・終了の検証",
      "制度分割・移管・終了費用"
    ],
    verification_status: "横断的な制度原則の段階。文化継承、専門職、公共契約、選挙、市場、プラットフォームなど異なる事例で悪用可能性を検証する必要がある。",
    open_question: "価値への正当な敬意と、身分・特権・既得権益への変換の境界を、当事者の自由を損なわずにどう判断するか。"
  };

  const stateProfile = {
    id: "state-public-spheres",
    document_id: "state-public-spheres",
    path: "state_and_public_spheres.md",
    level: "brief",
    summary: "国家に集められてきた機能をほどく構想が、権利と責任の空白、地域間格差、私的権力による支配へ反転しないための接続。",
    protects: [
      "国家所属に左右されない基礎生活と人権",
      "地域差を越えて失われない救済の入口",
      "国家機能を分けた後の安全、再分配、広域連帯",
      "公共の空白を企業、武力、宗教、地域権力、プラットフォームに独占されないこと"
    ],
    reversals: [
      { label: "悪意による悪用", text: "国家機能の縮小や分散を口実に、企業、武装主体、宗教組織、地域の有力者が生活基盤と強制力を囲い込む。" },
      { label: "善意・効率化による害", text: "課題ごとの最適化を優先するあまり、移動する人、少数者、無国籍者、支援の薄い地域が制度の隙間へ落ちる。" },
      { label: "構造・時間による形骸化", text: "多中心化によって責任と財源が分散し、どの主体も安全、再分配、救済、長期維持を引き受けなくなる。" }
    ],
    open_question: "国家を当然の中心にせず、同時に安全、普遍的権利、再分配、最終救済の責任を空白にしない公共圏をどう構成するか。"
  };
  const stateIndex = data.profiles.findIndex((profile) => profile.document_id === "state-public-spheres");
  if (stateIndex === -1) data.profiles.splice(index + 1, 0, stateProfile);
  else data.profiles[stateIndex] = stateProfile;

  await write(path, JSON.stringify(data, null, 2));
}

async function cleanup() {
  for (const path of ["scripts/apply_nagi_navigation.mjs", ".github/workflows/apply-nagi-navigation.yml"]) {
    try { await unlink(resolve(root, path)); } catch (error) { if (error.code !== "ENOENT") throw error; }
  }
}

async function main() {
  await updateReadme();
  await updateFutureSocialPhilosophy();
  await updateReadingGuide();
  await splitStateAndPhilosophy();
  await updateCoreAndChapters();
  await updateManifest();
  await updateImmunityProfiles();
  await cleanup();
}

await main();
