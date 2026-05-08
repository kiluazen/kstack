---
name: llm-wiki
description: Build and maintain a persistent, interlinked markdown knowledge base inspired by Karpathy's LLM Wiki. Use when Codex should create a wiki, ingest articles, PDFs, or notes into it, answer questions from an existing wiki, migrate an Obsidian or markdown notes corpus into a structured wiki, or lint a wiki for broken links, orphan pages, stale content, and index drift.
---

# LLM Wiki

Build a durable markdown knowledge base that compounds over time. Separate raw
sources from synthesized pages, rely on `[[wikilinks]]` for navigation, and
treat the wiki as the main research artifact whenever the user wants persistent
memory instead of one-off chat answers.

## Resolve the wiki path

Choose the wiki directory in this order:

1. Use the path the user gave you.
2. Else use an existing directory that already contains `SCHEMA.md` or `index.md`.
3. Else use `~/wiki`.

Avoid splitting one wiki across multiple roots.

## Maintain this layout

```text
wiki/
├── SCHEMA.md
├── index.md
├── log.md
├── raw/
│   ├── articles/
│   ├── papers/
│   ├── transcripts/
│   └── assets/
├── entities/
├── concepts/
├── comparisons/
└── queries/
```

Use these rules:

- Keep `raw/` immutable. Save source material there, but do not rewrite it in place.
- Write synthesized knowledge into `entities/`, `concepts/`, `comparisons/`, and `queries/`.
- Let `SCHEMA.md` define naming rules, frontmatter, tag taxonomy, and page thresholds.
- Add every new page to `index.md`.
- Append every meaningful action to `log.md`.

## Orient before making changes

Before ingesting, querying, or linting an existing wiki:

1. Read `SCHEMA.md`.
2. Read `index.md`.
3. Read the last 20-30 entries of `log.md`.
4. Search the current topic across the wiki before creating new pages.

On large wikis, use terminal tools first:

```bash
WIKI=~/wiki
rg -n "transformer|attention" "$WIKI"
find "$WIKI" -name '*.md' | sort
tail -n 30 "$WIKI/log.md"
```

Do not skip orientation. Missing it causes duplicates, broken cross-links, and
schema drift.

## Initialize a new wiki

When the user asks to start a wiki:

1. Create the directory tree.
2. Ask or infer the domain.
3. Write `SCHEMA.md` for that domain.
4. Write `index.md` with section headers and one-line summaries.
5. Write `log.md` with a creation entry.
6. Suggest the first sources to ingest.

Use a schema like this and customize it to the domain:

```markdown
# Wiki Schema

## Domain
AI research

## Conventions
- Use lowercase, hyphenated filenames.
- Put YAML frontmatter on every synthesized page.
- Use `[[wikilinks]]` between related pages.
- Bump `updated` whenever you modify a page.
- Add each new page to `index.md`.
- Append each material action to `log.md`.

## Frontmatter
---
title: Page Title
created: YYYY-MM-DD
updated: YYYY-MM-DD
type: entity | concept | comparison | query | summary
tags: [tag-a, tag-b]
sources: [raw/articles/source-name.md]
---

## Tag Taxonomy
- model
- architecture
- benchmark
- company
- person

## Page Thresholds
- Create a page when the topic is central to one source or appears in multiple sources.
- Extend an existing page when the topic is already covered.
- Split a page when it grows past roughly 200 lines.
- Record contradictions explicitly instead of silently overwriting them.
```

## Ingest sources

When the user provides a source:

1. Save the raw source under `raw/` with a descriptive filename.
2. Treat URLs and pasted articles as `raw/articles/`.
3. Treat papers and PDFs as `raw/papers/`.
4. Treat pasted interviews, transcripts, and meeting notes as `raw/transcripts/`.
5. Search the existing wiki before creating new pages.
6. Update existing pages when the topic already exists.
7. Create new pages only when the schema thresholds are met.
8. Add at least 2 outbound `[[wikilinks]]` on every new or materially expanded page.
9. Keep tags inside the schema taxonomy.
10. Update `index.md` once per ingest batch.
11. Append one `log.md` entry listing the source and the files you created or changed.
12. Summarize changed files in chat instead of pasting the entire research output.

A single source may update many pages. That is normal and desirable.

## Answer questions from the wiki

When the user asks a question about the wiki's domain:

1. Read `index.md` to find the right pages.
2. Search the wiki for topic-specific filenames and mentions.
3. Read only the pages you need.
4. Synthesize the answer from the compiled wiki, citing page filenames or wikilinks.
5. File only durable answers back into `queries/` or `comparisons/`.
6. Log substantive filed answers, but skip trivial lookups.

Prefer compact answers in chat. Put the lasting substance into the wiki itself.

## Lint and health-check

Prefer terminal tools over repetitive one-file-at-a-time reads on large wikis.
Check at least:

- Broken wikilinks.
- Orphan pages with no inbound links.
- Pages missing from `index.md`.
- Missing required frontmatter fields.
- Tags used outside the schema taxonomy.
- Pages over roughly 200 lines.
- Stale content that lags behind newer cited material.
- Contradictory pages on the same subject.
- `log.md` size; rotate when it exceeds roughly 500 entries.

Useful shell patterns:

```bash
cd "$WIKI"
find entities concepts comparisons queries -name '*.md' \
  | sed 's|.*/||;s|\.md||' | sort -u > /tmp/wiki-pages.txt

rg -o '\[\[[^]|]+' entities concepts comparisons queries \
  | sed 's/\[\[//' | sort -u > /tmp/wiki-links.txt

echo "Broken links:"
comm -23 /tmp/wiki-links.txt /tmp/wiki-pages.txt

echo "Orphans:"
while read -r page; do
  count=$(rg -l "\\[\\[$page(\\]\\]|\\|)" entities concepts comparisons queries | rg -v "/$page\\.md$" | wc -l | tr -d ' ')
  [ "$count" = "0" ] && echo "$page"
done < /tmp/wiki-pages.txt
```

Report findings by severity, then fix obvious structural issues if the user asked
for repairs rather than report-only auditing.

## Migrate existing notes

When the user has an Obsidian vault, loose markdown notes, or an older wiki:

1. Discover files with terminal `find`, not a truncated search UI.
2. Read and classify the corpus before rewriting anything.
3. Normalize filenames and add frontmatter to synthesized pages.
4. Preserve immutable originals in place or under `raw/`, depending on the user's migration goal.
5. Repair wikilinks and then fix orphans after the main migration pass.
6. Update `index.md` and `log.md` once at the end.
7. Pause and confirm before large, destructive, or mass-rewrite migrations.

Batch large migrations instead of editing hundreds of files blindly.

## Archive superseded content

When content is fully superseded:

1. Move the page into `_archive/` while preserving its type subdirectory if useful.
2. Remove the page from `index.md`.
3. Replace important backlinks with plain text plus `(archived)` where appropriate.
4. Record the archive action in `log.md`.

Do not silently delete historical pages that still matter for provenance.

## Obsidian compatibility

Treat the wiki directory as an Obsidian vault by default:

- `[[wikilinks]]` remain clickable.
- YAML frontmatter works with Dataview and search.
- `raw/assets/` is a good default attachment location.

If the user already keeps the wiki in Obsidian, edit that same directory instead
of creating a parallel vault.

## Working rules

- Put lasting research output in the wiki, not in a long chat transcript.
- Verify key factual claims against primary sources before writing them as facts.
- Use a real browser when a site is JavaScript-rendered and plain fetch output is empty.
- Never modify files in `raw/`.
- Do not create pages for passing mentions or trivial details.
- Ask before any ingest or migration that would touch 10 or more existing pages.
- Keep pages scannable; split them once they become hard to read in one pass.
- Handle contradictions explicitly with dates and sources instead of overwriting them.
