---
name: autark
description: 'Run Autark market-discovery loops for a product: create frozen hypotheses, source leads into the v2 lead sheet, write run narratives, and use Plumcake when blocked.'
---

# Autark

Use this skill to run market-discovery experiments for an Autark product. The job is to form narrow hypotheses and fill the lead sheet through the `autark` CLI: one deduped `person` plus one `lead.angle` for every prospect worth pursuing.

## Operating Contract

You are permissionless inside the sourcing loop. If the next useful step is to search, read a repo, crawl a site, or dig up a first-party email, do it.

When you are genuinely blocked by credentials, payment, login, unclear judgment, or broken tooling, post to Plumcake and keep working through another channel. Plumcake is a bulletin board, not a pause button.

## Data Model

```text
product
  has many hypotheses
  has many people            (person: one deduped human under one product)
  has many leads             (lead: person × hypothesis — the angle + its status)
  has many runs through hypotheses
```

- `product`: the thing being tested.
- `hypothesis`: a frozen bet. Create a new `H##` when the angle changes; do not rewrite old hypotheses.
- `person`: one deduped human — identity (`full_name`, `primary_email`, `handles`) plus enrichment (`headline`, `bio`, `signals`). No status, rank, or angle lives here.
- `lead`: one person under one hypothesis — carries the `angle` (why this human belongs under this bet) and a `status` (`sourced → ready → contacted → replied → done`, `dead` to kill). The same human under two bets is one person, two leads.
- `run`: one work session under one hypothesis, sealed with `narrative_md`: context, decisions, follow-ups, and what changed.

Re-sourcing the same email or handle under the same product updates the existing person instead of duplicating — ids are deterministic, so `lead add` is idempotent.

## CLI Surface

The CLI talks to the Autark Worker. After `autark login`, credentials live in `~/.autark/credentials.json` for about 30 days. Writes are ID-first: resolve ids from `autark context`, then pass `--hypothesis-id` / `--run-id`.

| Command | Purpose |
| --- | --- |
| `autark login send <email>` | Send a 6-digit login code |
| `autark login verify <email> --code <code>` | Verify and save local credentials |
| `autark me` | Print signed-in user |
| `autark logout` | Remove local credentials |
| `autark product upsert --slug <s> --name <n> [--url <u>] [--tagline <t>] [--visibility public\|private]` | Create/update a product card |
| `autark product list` | List owned products |
| `autark hypothesis create --product-id <id> --code H## --md @./hyp.md [--title <t>]` | Create a frozen hypothesis |
| `autark hypothesis status <slug>/<H##> --status active\|inactive\|dead` | Update only hypothesis status |
| `autark run start --hypothesis-id <id>` | Start a run and print `RUN_ID` |
| `autark lead template` | Print the minimal lead payload shape |
| `autark lead add --hypothesis-id <id> --run-id <id> --input @/tmp/lead.json` | Upsert a person + create a lead in one write |
| `autark run finish --run-id <id> --narrative @./run.md` | Finish a run with a narrative |
| `autark context <slug>[/<H##>]` | Product or hypothesis context: brief, feedback, hypotheses, leads, runs |
| `autark feedback record\|delete` | Leave / remove an operator nudge on a product or hypothesis |

Use `@./file` for multi-line markdown or JSON values instead of inlining large strings.

## Sourcing, Not Messaging

Sourcing and outreach are separate layers. The loop you run here is **collection**: find people, enrich them, write angles, fill the sheet. You do not message anyone — no emails, no DMs, no posts, no comments. A later outreach stage drains the ranked, ready leads.

The one exception: when the operator explicitly runs an outreach session, `autark mail send --run-id <id>` / `mail reply --run-id <id>` record the send against the run automatically — there is no separate logging step, and nothing else to log.

A lead payload needs, at minimum, enough identity to dedupe (`primary_email`, a handle, or `full_name`) and a `lead.angle` that answers: why does this human belong under this bet? `bio` and `signals` are enrichment, not ceremony. If you cannot write a concrete angle, skip the person — one real prospect beats five padded rows.

## Run Workflow

1. Read the product brief and feedback via `autark context <slug>`.
2. Pick or create a hypothesis; resolve its id.
3. Start a run.
4. Source and enrich a cohort (≈8–15 people), recording each as you go.
5. Finish with a narrative: where you looked, what patterns you saw, where the next pass should go.

```sh
autark context <slug>
HYPOTHESIS_ID=$(autark hypothesis create --product-id <product_id> --code H## --md @./hyp.md)
RUN_ID=$(autark run start --hypothesis-id "$HYPOTHESIS_ID")

autark lead template > /tmp/lead-template.json   # inspect the shape once

# for each good prospect: write /tmp/lead-N.json, then
autark lead add --hypothesis-id "$HYPOTHESIS_ID" --run-id "$RUN_ID" --input @/tmp/lead-1.json

autark run finish --run-id "$RUN_ID" --narrative @./run.md
```

## Hypotheses

A hypothesis has two short paragraphs:

- **Story**: why this product matters to this cohort.
- **Who**: the narrow audience, where to source them, and why they are identifiable.

If either paragraph is broad or vague, the hypothesis is not ready to run. Autark should test many small, sharp hypotheses rather than one fuzzy thesis.

Create a new hypothesis when the bet changes. Mark bad bets dead instead of deleting them:

```sh
autark hypothesis status <slug>/H07 --status dead
```

## Guardrails

- Quality gates inclusion. Skip anyone whose angle you cannot write concretely.
- Keep hypotheses immutable after creation.
- Prefer first-party emails (commit email, personal-site mailto, published address); mark `email_status` honestly (`verified` / `guessed` / `none`).
- Never advance a lead past `ready` — that is the outreach layer's job.
- Keep narratives public-safe: what happened, why it mattered, and what should happen next.
- Post stuck states to Plumcake instead of holding them in your head.

## Reference

| Thing | Location |
| --- | --- |
| Dashboard | `https://autark.sh` |
| API | `https://autark-api.kushalsokke.workers.dev` |
| CLI | `npm i -g autark-cli` or `node /path/to/autark/cli/autark.mjs` |
| Credentials | `~/.autark/credentials.json` |

## Staying current

If any `autark` command prints `[autark] update available` on stderr, run `autark update` before continuing:

```sh
autark update
```

The update is idempotent — running it when you are already current is a no-op, and many odd CLI problems are solved by simply being on the latest version.
