#!/usr/bin/env ruby
# frozen_string_literal: true

require 'json'
require 'pathname'

ROOT = Pathname.new(File.expand_path('..', __dir__))
DOCS = ROOT.join('docs')

chapters = [
  ['思想の核', 'nagi_core.md'],
  ['凪の宣言文', 'declaration.md'],
  ['哲学的背景', 'philosophy.md'],
  ['三原則の深化', 'deepening_principles.md'],
  ['自由・不協和・離脱の原則', 'freedom_and_dissent.md'],
  ['資本主義に変わる自由競争の原理', 'free_competition.md'],
  ['文化的共育', 'culture.md'],
  ['知財と財産の継承', 'property_and_ip.md'],
  ['教育', 'education.md'],
  ['凪経済構造', 'breath_economy.md'],
  ['凪環境構造', 'ecological_structure.md'],
  ['凪BENプロトタイプ', 'ben_prototype.md'],
  ['信頼と統治', 'trust.md'],
  ['社会インフラとAIの役割', 'infrastructure.md'],
  ['移行と危機の設計', 'transition_and_crisis.md'],
  ['凪の実装と呼吸', 'implementation.md'],
  ['制度設計と実践', 'institutional_design.md'],
  ['スチュワードシップとコモンズ', 'stewardship_commons.md'],
  ['静かな実践技術', 'quiet_praxis.md'],
  ['記憶・同意・忘却の憲章', 'memory_and_consent.md'],
  ['凪AI章', 'ai_index.md'],
  ['呼吸する経済・統治', 'breath_governance_draft.md'],
  ['共鳴メトリクス', 'resonance_metrics.md'],
  ['呼吸会議', 'breath_assembly.md'],
  ['凪AI憲法', 'nagi_ai_charter.md'],
  ['凪AI三原則（旧版）', 'nagi_ai_principles.md'],
  ['凪技術の基盤', 'technical/foundation_v1.md'],
  ['AI窓口ネットワーク', 'technical/tsumugi_network.md'],
  ['凪実験章', 'experiment_v0.1.md'],
  ['感情と精神性', 'emotion.md'],
  ['死と再生', 'death.md'],
  ['結び', 'musubi.md'],
  ['呼吸の契り', 'nagi_manifesto_breath.md']
].freeze

def strip_front_matter(text)
  return text unless text.start_with?("---\n")

  closing = text.index("\n---\n", 4)
  return text if closing.nil?

  text[(closing + 5)..]
end

book = []
book << '---'
book << 'layout: default'
book << 'title: "凪 AI Book — Complete Canonical Reading"'
book << 'description: "凪プロジェクトの正規読書順を一冊にまとめたAI・研究者向け完全版。"'
book << 'robots: "index, follow"'
book << 'permalink: /ai_book.html'
book << '---'
book << ''
book << '# 凪 AI Book'
book << '## —— 凪を一冊として読むために'
book << ''
book << 'この文書は、凪プロジェクトの正規読書順に沿って生成される統合版です。'
book << '各章の原典は個別ページにあり、更新・引用・議論は原典を優先します。'
book << ''
book << '## 読み方'
book << ''
book << '- 凪の核から読み始める。'
book << '- 制度・AI・技術は、核と自由の原則に照らして読む。'
book << '- 過去の評価記録や旧版は、この本の外にあるアーカイブとして扱う。'
book << ''

nodes = []
chapters.each_with_index do |(label, relative_path), index|
  source = DOCS.join(relative_path)
  next unless source.file?

  text = strip_front_matter(source.read(encoding: 'UTF-8')).strip
  url = "/nagi-project/#{relative_path.sub(/\.md\z/, '.html')}"
  url = url.sub('/technical/', '/technical/')

  book << '---'
  book << ''
  book << "# #{index + 1}. #{label}"
  book << ''
  book << "原典: [#{relative_path}](#{relative_path.sub(/\.md\z/, '.html')})"
  book << ''
  book << text
  book << ''

  nodes << {
    id: relative_path.sub(/\.md\z/, ''),
    label: label,
    path: relative_path,
    url: url,
    position: index + 1
  }
end

DOCS.join('ai_book.md').write(book.join("\n"), encoding: 'UTF-8')

edges = nodes.each_cons(2).map do |from, to|
  { from: from[:id], to: to[:id], relation: 'canonical_next' }
end

knowledge_graph = {
  project: 'Nagi Project',
  generated_from: 'scripts/build_book.rb',
  nodes: nodes,
  edges: edges,
  notes: [
    'This graph represents reading order, not doctrinal hierarchy.',
    'The core and safeguards should be read before governance and technical chapters.'
  ]
}

DOCS.join('knowledge_graph.json').write(JSON.pretty_generate(knowledge_graph) + "\n", encoding: 'UTF-8')
puts "Generated docs/ai_book.md and docs/knowledge_graph.json from #{nodes.length} chapters."
