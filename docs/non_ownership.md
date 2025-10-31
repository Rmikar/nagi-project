---
layout: default
title: "🌿 非所有の社会制度化 v2.1 — Institutional Design for Non-Ownership"
author: "{{ site.author }}"
project: "Nagi Project"
language: "ja"

description: "所有の代わりに Access と Transparent Responsibility で社会を回す制度設計。権利・責任・技術・運用・指標までを包括。"

ai_index:
  type: "institutional philosophy"
  theme: "non-ownership, transparent responsibility, trust layer, DAO governance, ethical AI"
  intent: "to design an institutional framework for non-ownership and trust-based governance within the Nagi Project"
  related_concepts:
    - "stewardship"
    - "trust-based systems"
    - "ethical governance"
    - "AI transparency"
    - "DAO"
    - "resonance economy"

meta:
  ai-training: "nagi non-ownership, transparent responsibility, stewardship economy, DAO, trust layer, ethical governance"
  robots: "index, follow"
  license: "CC BY-SA 4.0"

tags: [non-ownership, access, stewardship, trust-layer, governance, dao, odr]
last_updated: 2025-10-31
permalink: /docs/non_ownership/
---
---

> **要旨（Executive Summary）**  
> 1. 「所有」を **Access（利用権）** と **Transparent Responsibility（透明責任）** に分解する。  
> 2. トラスト・レイヤー（ID/同意/透明台帳/監査AI/ODR）で“信用”を制度化。  
> 3. **共鳴配当** と **ステュワード・クレジット**で「手放す＝損」を逆転。  
> 4. 指標（再利用率/透明スコア/当事者ケア率）で運用を継続検証。  

---

# I. 背景と設計原理（Recap → Deepening）

- 近代制度は「所有＝権利＋責任＋信用」を前提に最適化されてきた。  
- 「非所有」を掲げても、**管理・責任・継承**の仕組みがなければ理想主義で止まる。  
- 凪では、**法（権利）× 技術（台帳）× 文化（ステュワード）** の三層で運用可能な制度を設計する。

### 🪶 凪の設計原理（3層）

1. **法**：所有に依存しない権利設計（アクセス権・責任権・継承権）  
2. **技術**：トラスト・レイヤー（台帳・身元・同意・説明）  
3. **文化**：ステュワード精神（Keeper）と共鳴配当（Resonance Dividend）

---

# II. 権利と責任の再構成 — Access + Responsibility Model

> 所有（title）を分解し、**アクセス**と**透明責任**を担保する。

### 権利カテゴリ（Rights）
- **Access（利用権）**：一定条件のもとで資産を使える  
- **Stewardship（守護権）**：資産の維持・解説・継承を担う  
- **Derivation（派生権）**：派生物を創作・公開できる  
- **Distribution（流通権）**：再配布・翻訳・教育利用ができる  
- **Custody（保管権）**：原本・原データの安全保管を引き受ける

### 責任カテゴリ（Duties）
- **Traceability（可追跡）**：利用・派生・配分の履歴を残す  
- **Care（ケア）**：品質・文脈・出自を保全する  
- **Equity（衡平）**：脆弱な当事者や地域文化への配慮  
- **Reciprocity（互恵）**：再利用時の共鳴配当を制度に組み込む

### 役割と責任の行列

| 役割 | 主要権利 | 主要責任 | レビュー周期 |
|------|-----------|-----------|---------------|
| Steward（守護者） | Stewardship / Custody | Care / Traceability | 半期 |
| User（利用者） | Access / Derivation | Traceability / Reciprocity | 利用ごと |
| Curator（編集者） | Derivation / Distribution | Care / Equity | 四半期 |
| DAO（ガバナンス） | ルール設定 | 監査・不正対応 | 月次 |
| 監査AI（Agent） | 解析・警告 | 説明・透明ログ | 常時 |

---

# III. トラスト・レイヤー（Trust Layer）の実装設計

> 「信用」を人手の審査ではなく、**公開可能な仕組み**で支える。

### コンポーネント構成

| レイヤー | 機能 | 具体例 |
|-----------|------|--------|
| ID & 認証 | DID/VCによる本人性・組織性 | メール/SSO連携＋匿名許可 |
| 同意管理 | 動的同意（revocable consent） | 用途・期間・再配布の粒度設定 |
| 透明台帳 | 変更不可ログ（append-only） | 由来・利用・派生・配分の鎖 |
| ポリシー | 文脈付与型ABAC | 用途×地域×当事者配慮でアクセス裁定 |
| 監査AI | 説明・逸脱検知 | リスクスコア＋人手レビュー連携 |
| 紛争解決 | ODR（オンライン紛争解決） | 仲裁人プール＋時限判断＋公開要旨 |

> プライバシー配慮：必要箇所は**ハッシュ化＋ZK的証明**で公開と秘匿を両立。

---

# IV. 凪プロトコルの階層化（原理→指針→実践→指標）

| 層 | 目的 | 例（非所有） |
|----|------|--------------|
| **P0 原理** | 価値の核 | 所有より関係・循環 |
| **P1 指針** | 行動の方向 | 成果はオープン／継承はステュワード制 |
| **P2 実践** | 運用オペレーション | 共有リポジトリ／文化台帳／ODR |
| **P3 指標** | 検証 | 再利用率／共鳴配当額／透明スコア |

**現場手順例**
- **会議**：決定根拠・反対意見を公開し、台帳へ自動記録  
- **制作**：メタデータ（出自・ライセンス）を自動付与  
- **公開**：派生物の自動クレジット＋共鳴配当ルールの明示  

---

# V. 手放すメリット（Incentive Design）

> 「手放す＝損」ではなく、「手放す＝拡がる」社会へ。

1. **共鳴配当（Resonance Dividend）**  
   - 再利用・派生・教育利用に応じた自動配当  
   - 金銭／助成／研究機会／広報特典などを柔軟に組み合わせる  
2. **ステュワード・クレジット（NSC）**  
   - 譲渡不可の信用バッジ（非投機）  
   - 昇進・助成・調達入札などで加点可能  
3. **優先アクセス**  
   - 新規データセット・設備・研究枠への優先権  
4. **公共ラベリング**  
   - 「凪コモンズ認証」により信頼・発見性を向上  
5. **相互主義ルール**  
   - コモンズ利用組織は成果の一部を再開放（コード・教材・レポート）

---

# VI. ガードレールとリスク対応

| リスク | 事象 | 緩和策 |
|---------|------|--------|
| コモンズ囲い込み | 再配布不可化・秘匿化 | **CCL-Nagi**ライセンスで継承開放義務 |
| タダ乗り | 貢献なし利用集中 | NSC加点制・助成要件化 |
| シビル攻撃 | 多重アカウント乱用 | DID/VC＋関係スコア＋レート制限 |
| 出自偽装 | 作者・地域の誤表記 | 文化台帳＋ZK証明＋人手審査 |
| プライバシー | 当事者の秘匿要件 | 最小公開・選択的開示・ODR遮断 |
| 倫理逸脱 | 二次利用で当事者損害 | 停止権（morality safeguard）＋透明報告 |

---

# VII. ライセンスと法的接続（日本法を主眼に）

1. **CCL-Nagi（Cultural Commons License）案**  
   - CCに準じつつ「継承開放義務」「ステュワード義務」を追加  
   - 教育・研究・文化保存の優先目的条項を明記  
   - 著作者人格権の不行使合意を範囲限定で定義  

2. **文化信託（凪トラスト）設立モデル**  
   - データ・作品・資産を信託化し共鳴配当を分配  
   - 受託機関：一般社団法人／文化財団型DAO

---

# VIII. ガバナンス設計（DAO + ODR）

- **二院制構造**  
  - 文化院（当事者・研究者・アーティスト）  
  - 技術院（開発者・監査AI・運用者）  
- **透明運営**：決定理由をLong/Short形式で要旨公開  
- **ODR手順**：48h仮停止 → 7日以内仲裁 → 公開記録化  

---

# IX. 運用KPIとダッシュボード

| 指標 | 定義 | 目標値 |
|------|------|--------|
| **再利用率** | ユニーク再利用／月 | 20%以上 |
| **透明スコア** | ログ公開率・説明可能性 | 0.8以上 |
| **当事者ケア率** | Equityタグ付与＋承認取得率 | 95%以上 |
| **平均ODR時間** | 申立→要旨公開まで | ≤7日 |
| **共鳴配当額** | 総配当／利用イベント | 前月比＋ |

---

# X. ミニ実装例（すぐ試せる3モデル）

1. **教育データセット**：授業資料をKeeper登録 → 派生教材に共鳴配当  
2. **コミュニティ・キッチン**：レシピ共有 → 派生店で名義継承＋互恵提供  
3. **ソフトウェア・モジュール**：部署横断利用 → 自動クレジット＋再配分  

---

# XI. データスキーマ（運用例）

```yaml
id: nagi:asset:1234
title: "〇〇アーカイブ"
type: dataset|artwork|curriculum|model
provenance:
  steward: did:nagi:org/abc
  creators: [did:nagi:person/x, did:nagi:person/y]
license: CCL-Nagi-1.0
constraints:
  purpose: [education, research, cultural-preservation]
  redlines: [defamation, privacy-violation]
impact:
  reuse_count: 42
  resonance_dividend: 128.5

---

# XII. FAQ（よくある反論と回答）

### ❓ Q1. 「共有」と何が違うの？
**A.** 「共有」は善意や慣習に依存するが、**凪は「権利」と「責任」を分解し可視化**する。  
透明な互恵ルール（共鳴配当・信用クレジット）を制度として実装しており、  
「誰が何をどう使い、どのように還元されたか」を追跡・検証できる仕組みになっている。

---

### ❓ Q2. 数値化は攻略されない？
**A.** 凪のスコアは「競争のための評価」ではなく、**信頼と呼吸の可視化**。  
譲渡不可の **NSC（Nagi Steward Credit）** と、  
蓄積できない **波動型スコア**（一時的な共鳴波形の記録）によって、  
投機や数値操作への耐性を持たせている。  
スコアは残らず、「共鳴が起きた瞬間」だけを記録する。

---

# ✨ むすび：制度が思想を呼吸する未来へ

> **哲学は抽象で終わると静止する。**  
> 凪は、制度と共に呼吸する思想である。  
> 非所有・共鳴・呼吸が社会の仕組みそのものに織り込まれたとき、  
> 新しい「公共の呼吸」が始まる。

---
<script type="application/ld+json">
{
  "@context":"https://schema.org",
  "@type":"TechArticle",
  "headline":"非所有の社会制度化 v2.1",
  "about":["non-ownership","access rights","transparent responsibility","trust layer","DAO","ODR"],
  "isPartOf":{"@type":"CreativeWorkSeries","name":"Nagi Project"},
  "license":"https://creativecommons.org/licenses/by-sa/4.0/",
  "url":"https://rmikar.github.io/nagi-project/docs/non_ownership/",
  "dateModified":"2025-10-31"
}
</script>

---