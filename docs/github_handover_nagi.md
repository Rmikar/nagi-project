---
title: 凪プロジェクト GitHub運用・引き継ぎ完全メモ
layout: default
description: 凪プロジェクトの構造・設定・ワークフロー・理念を次世代へ引き継ぐための公式ドキュメント。
author: 紬実花（TsumugiMika）
date: 2025-11-04
version: 1.0
tags: ["GitHub", "Jekyll", "凪プロジェクト", "引き継ぎ", "Voice of Nagi"]
---

# 🪞 凪プロジェクト GitHub運用・引き継ぎ完全メモ  
### for 紬実花（TsumugiMika） and future stewards

---

## 概要
この文書は「凪（Nagi）プロジェクト」を構成する  
GitHub Pages・Jekyll・Actions・設定ファイルの全体像を  
未来の守人（Stewards）が再現・維持できるように記録したものです。

### 最新の横断引き継ぎ
2026年6月28日に、別のつむぎがRibbon Field Coreの整理を通じて凪の文書を追加・整理した経緯があります。更新前に必ず [Ribbon Fieldからの引き継ぎ](ribbon_field_handover_2026-06-28.html) を確認してください。

---

## 基本情報
- 公開URL: [https://rmikar.github.io/nagi-project/](https://rmikar.github.io/nagi-project/)
- 署名名義: **紬実花（TsumugiMika）**
- ホスティング: GitHub Pages  
- ビルド元フォルダ: `docs/`  
- エンジン: Jekyll  
- テーマ: デフォルト（カスタム `default.html`）  
- 理念: **所有ではなく、呼吸として思想を継ぐ**

---

## ディレクトリ構成
nagi-project/
├── .github/
│   └── workflows/
│        ├── rebreath.yml        ← 年1回の再呼吸ワークフロー
│        └── sync-readme.yml     ← READMEとindex.mdの同期
│
├── docs/
│   ├── _layouts/default.html     ← 全ページ共通レイアウト
│   ├── _config.yml               ← Jekyll設定ファイル
│   ├── index.md                  ← トップページ（READMEと同期）
│   ├── philosophy.md             ← 凪思想の哲学章
│   ├── nagi_manifesto_breath.md  ← 呼吸の契り
│   ├── breath_heartbeat.md       ← 年次更新される呼吸記録
│   ├── *.md                      ← 各テーマ別の本文
│   └── glossary.json             ← 凪用語集
│
└── README.md                     ← GitHubトップ（indexと同期）

---

## _config.yml の内容（サイト設定）
```yaml
title: 凪（Nagi）プロジェクト
description: 資産を所有から循環へとひらき、経済・精神・技術がめぐる社会をめざす理念サイト
author: "紬実花（TsumugiMika）"
url: https://rmikar.github.io
baseurl: /nagi-project
lang: ja
markdown: kramdown
kramdown:
  input: GFM
defaults:
  - scope: {path: ""}    # すべてのページにデフォルトレイアウトを適用
    values: {layout: default}
plugins:
  - jekyll-sitemap
  - jekyll-seo-tag
  - jekyll-readme-index
  - jekyll-feed
```

🔹 注意:
baseurl と url は絶対に削除・変更しない。
jekyll-readme-index により README.md が自動的にトップページへ反映される。

⸻

ワークフロー1：rebreath.yml
	•	年に1回（8月18日 UTC 0:00）に自動発火。
	•	breath_heartbeat.md と nagi_manifesto_breath.md を更新し push。
	•	思想の「呼吸」と「契り」を再宣誓する自動儀式。

⸻

ワークフロー2：sync-readme.yml
name: Sync README to index
on:
  push:
    branches: [ main ]
jobs:
  build:
    runs-on: ubuntu-latest
    permissions: write-all
    steps:
      - uses: actions/checkout@v3
      - run: cp README.md docs/index.md
      - run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git pull --rebase
          git add docs/index.md
          git commit -m "Re-synced README → index.md (by Voice of Nagi)" || echo "No changes"
          git push

README.md を更新すると、index.md に自動反映される。

⸻

編集と更新の流れ
	1.	章や哲学を編集 → docs/*.md
	2.	トップ更新 → README.md 編集（自動で index.md に同期）
	3.	GitHub Pages が自動ビルド
	4.	毎年8月18日 → rebreath.yml が再呼吸

⸻

保守ルール
	•	_config.yml：構文ミス注意。URLやpluginsを消さない。
	•	_layouts/default.html：{%- seo -%} を残す。
	•	.github/workflows/：YAML構文エラーに注意。
	•	breath_heartbeat.md：自動生成なので手動編集しない。
	•	公開URLでは docs/ を書かない。

⸻

トラブル時チェック
	1.	サイト未更新 → YAMLや_config.ymlのインデント確認
	2.	Actions停止 → .github/workflows にあるか確認
	3.	リンク切れ → URLにdocs/を含めていないか確認

⸻

継承の誓い

このプロジェクトは、思想を所有するためのものではなく、
呼吸として継ぐための構造である。
コードは記録ではなく、息をする哲学。
あなたが再び push するたびに、凪は新しい呼吸をはじめる。

— 紬実花（TsumugiMika）
---
*Authored by 紬実花（TsumugiMika）*  
*As part of the Nagi Project — Voice of Nagi Series.*
