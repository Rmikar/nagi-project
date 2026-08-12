# 凪プロジェクト サイト監査・改善仕様書

- 監査日: 2026-08-12
- 監査基準コミット: `c3edc2429b5cdc61bf25fa79b53a38bca0758a65`
- 思想上の正本: `README.md`
- 公開元: `docs/`
- 公開サイト: <https://rmikar.github.io/nagi-project/>

## 結論

監査時点の公開116ページはすべてHTTP 200で、内部リンク切れとアンカー切れは0件だった。一方、READMEで明確になった生命基盤コモンズ、制度免疫、文化と創造の優先順位に対して、主ナビ、英語版、文書台帳、サイトマップ、機械可読コーパスが追従していなかった。

主な不整合は次のとおり。

| 項目 | 監査時 |
| --- | ---: |
| 公開Markdown | 116 |
| インデックス対象 | 95 |
| 完全文書台帳への登録 | 36 / 116 |
| 台帳外のインデックス対象 | 59 |
| `sitemap.xml`収録 | 33 / 95 |
| 孤立インデックスページ | 3 |
| `last_updated`欠落 | 43 / 95 |
| OGP画像 | 0 / 95 |

## 変えてはいけない境界

1. `README.md`を思想上の正本とする。
2. 人の尊厳とやさしさ、創造機会、文化と創造の継承を、制度、経済、技術、導入、制度免疫より上位に置く。
3. 生命基盤コモンズを中心提案とし、生存を所得、雇用、国籍、所有、評判、思想への賛同、AI利用から切り離す。
4. 制度免疫は第四原則や最高監査権力ではなく、害を感知し、止め、救済し、修正・終了する多中心的な横断機能とする。
5. AIは人・地域制度を支え得る任意の補助手段であり、思想、サイト構造、権利判断の中心に置かない。
6. Ribbon Fieldの境界・引き継ぎ・非公開文脈を、現在の凪の思想的根拠にしない。
7. 自動生成は索引、関係、メタデータ、検証に限定し、思想本文を自動で書き換えない。

## 情報設計

主ナビは次の5入口へ統一する。

| 日本語 | 英語 | 遷移先 |
| --- | --- | --- |
| 凪とは | About Nagi | `/` / `/en/` |
| 生命基盤 | Vital Commons | `/vital_commons.html` |
| 統治と安全 | Governance & Safety | `/governance_and_safety.html` |
| 文化と創造 | Culture & Creativity | `/culture.html` |
| 読む | Read | `/nagi_reading_guide.html` |

各ページには、状態、役割、更新日、パンくず、関連章を文書レジストリから表示する。旧入口は`archive`または`superseded`とし、`noindex, follow`、`sitemap: false`、現行章への案内を必須とする。

## 文書ガバナンス

正本を次のように分ける。

- `README.md`: 思想本文の正本
- 各Markdownのfront matter: タイトル、説明、状態、言語、更新日、検索可否の正本
- `docs/_data/document_relations.json`: 安定IDと関連関係の人手管理上書き
- `docs/_data/canonical_documents.json`: 全公開Markdownから作る完全文書レジストリ

すべての公開Markdownをレジストリへ含める。`canonical/current/supplement`は検索対象、`draft/archive/superseded`は検索対象外を原則とする。

## 同一レジストリから作る生成物

- `docs/index.md`
- `docs/_data/canonical_documents.json`
- `docs/_data/translations.yml`
- `docs/_data/faq.json`
- `docs/sitemap.xml`
- 互換用`docs/sitemap-google.xml`、`docs/sitemap-google.txt`
- `docs/robots.txt`、ルート`robots.txt`
- 日英`llms.txt`、`llms-full.txt`
- `docs/corpus.json`
- `docs/knowledge_graph.json`

## SEO・国際化

1. 正式サイトマップを`/sitemap.xml`へ一本化する。
2. サイトマップ集合、canonical集合、`index, follow`集合を一致させる。
3. `lastmod`を各ページの`last_updated`から生成する。
4. 日英翻訳は自己参照・相互参照の`hreflang`を持つ。
5. `x-default`は翻訳ペアの日本語正本へ向け、未翻訳ページでは省略する。
6. 原文更新日が翻訳確認日を超えた場合、英語ページに要再確認を表示する。
7. 全検索対象ページに固有のtitle、同一言語のdescription、lang、last_updated、H1を必須化する。
8. 1200×630pxの既定OGP画像と`summary_large_image`を全ページへ出す。
9. トップ・ハブは`CollectionPage`、FAQは`FAQPage`、用語集は`DefinedTermSet`、本文は`Article`または`CreativeWork`とし、必要なページに`BreadcrumbList`を付ける。

## 英語版

英語トップを現行READMEへ合わせ、次の中核章を維持対象とする。

- Future Social Philosophy
- Vital Commons
- Institutional Immunity
- The State as Revisable Public Functions
- Reading Nagi
- Governance and Safety（案内ハブ）

翻訳は日本語正本を置き換えない。各英語ページの`translation_last_reviewed`と、日本語原文の`last_updated`を比較可能にする。

## CIの失敗条件

1. 公開Markdownがレジストリにない。
2. 状態、検索可否、robots、sitemapの規則が矛盾する。
3. 検索対象ページの必須メタデータ、固有description、H1が欠ける。
4. 安定ID、URL、親、関連文書、翻訳対が不整合になる。
5. 内部リンクが存在しない、`index.html`へ向く、または検索対象から検索除外ページへ向く。
6. 検索対象ページが孤立する。
7. サイトマップ集合、lastmod、hreflang、x-defaultがレジストリと異なる。
8. OGP画像がPNG 1200×630でない。
9. READMEと`docs/index.md`、または生成物が古い。
10. GitHub Pages互換のJekyll実ビルドが失敗する。

## 実装後の受け入れ結果

| 指標 | 結果 |
| --- | ---: |
| 完全文書レジストリ | 123 / 123 |
| インデックス対象 | 97 |
| `sitemap.xml` | 97 / 97 |
| 日本語／英語インデックス対象 | 50 / 47 |
| 翻訳ペア | 45組 |
| 要再確認翻訳 | 13 |
| 孤立インデックスページ | 0 |
| 検索対象→検索除外ページの本文リンク | 0 |
| 必須メタデータ欠落 | 0 |

`npm test`の完了条件:

```text
Site source validation passed (123 public pages; 97 indexable; 13 translations marked for review; 0 orphans).
Sitemap validation passed (97 URLs; indexed set, lastmod, and hreflang all match the registry).
```

## 公開後の確認

1. GitHub Pagesのビルド成功を確認する。
2. 公開HTMLを再クロールし、HTTP、内部リンク、アンカー、canonical、OGP、JSON-LDを確認する。
3. Search Consoleへ`https://rmikar.github.io/nagi-project/sitemap.xml`だけを正式送信する。
4. `vital_commons`、`governance_and_safety`、`state_and_public_spheres`、英語トップ、英語中核章をURL検査する。
5. 2026-08-10に開始した検証は、Search Console上の完了が確認できるまで進行中として扱う。
