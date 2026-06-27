#!/usr/bin/env ruby
# frozen_string_literal: true

require 'yaml'
require 'date'
require 'pathname'

ROOT = Pathname.new(File.expand_path('..', __dir__))
DOCS = ROOT.join('docs')
errors = []

unless DOCS.join('robots.txt').file?
  errors << 'docs/robots.txt is missing.'
end

unless DOCS.join('llms.txt').file?
  errors << 'docs/llms.txt is missing. GitHub Pages is published from docs/.'
end

markdown_files = DOCS.glob('**/*.md') + [ROOT.join('README.md')]

markdown_files.each do |path|
  relative = path.relative_path_from(ROOT).to_s
  content = path.read(encoding: 'UTF-8')

  if content.start_with?("---\n")
    closing = content.index("\n---\n", 4)
    if closing.nil?
      errors << "#{relative}: front matter starts but does not close with ---"
    else
      front_matter = content[4...closing]
      begin
        YAML.safe_load(front_matter, permitted_classes: [Date, Time], aliases: true)
      rescue Psych::Exception => e
        errors << "#{relative}: invalid YAML front matter (#{e.message.lines.first.strip})"
      end
    end
  end

  content.scan(/\[[^\]]+\]\(([^)]+)\)/).flatten.each do |target|
    target = target.split('#', 2).first.split('?', 2).first
    next if target.empty? || target.match?(%r{\A(?:https?:|mailto:|#)})

    candidate = path.dirname.join(target).cleanpath
    exists = candidate.file?

    if !exists && target.end_with?('.html')
      exists = candidate.sub_ext('.md').file?
    end

    errors << "#{relative}: broken relative link -> #{target}" unless exists
  end
end

if errors.empty?
  puts 'Site source validation passed.'
  exit 0
end

warn 'Site source validation failed:'
errors.each { |error| warn "- #{error}" }
exit 1
