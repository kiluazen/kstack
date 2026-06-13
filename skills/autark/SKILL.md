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
- `lead`: one person under one hypothesis — carries the `angle` (why this human belongs under this bet) and a `status` (`sourced → ready → contacted → replied → done`, `dead` to kill). The same human under two bets is one person, two leads. The worker also stamps `person_label` (name, else masked email) automatically — it's what public visitors see, since person rows themselves are owner-only.
- `touch`: one outreach interaction on one lead — `channel`, `direction` (`out`|`in`), `thread_ref` (AgentMail thread id or the URL of YOUR comment), `summary`. Bodies stay external; the touch is a pointer.
- `run`: one work session under one hypothesis, sealed with `narrative_md`: context, decisions, follow-ups, and what changed.

Re-sourcing the same email or handle under the same product updates the existing person instead of duplicating — ids are deterministic, so `lead add` is idempotent.

**The CLI gives primitives, and every write is against an explicit id.** Autark never guesses which lead an email or interaction belongs to — you name the `lead_id`, or nothing is recorded. Read ids from `autark context` before writing.

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
| `autark mail send --lead-id <id> --to <email> --subject <s> --text @draft.txt` | Send email AND record the touch AND advance status, atomically |
| `autark touch add --lead-id <id> --channel <c> [--direction out\|in] [--thread-ref <ref>]` | Record a non-email interaction on a lead (advances status) |
| `autark lead list <slug>[/<H##>] [--status replied,ready\|contacted]` | The front door: one line per lead, ids first, newest replies on top. Scope to one bet with `<slug>/<H##>` (or `--hypothesis H##`); `--status` takes a comma list. "Who replied?" and "ready leads in H07?" both start here |
| `autark lead show <lead-id>` | One lead fully loaded: person, bet, status, ordered touch log with ids — run this when handed a lead link or a bare id (clicking a lead row in the dashboard copies it; `https://autark.sh/<slug>?lead=<id>` links carry it in the query param) |
| `autark touch mute <touch-id>` | Judge an inbound touch a non-reply (ticket bot, autoresponder); lead verdict recomputes, sweep respects it |
| `autark lead status <lead-id> --status <s>` | Explicit status write — rarely needed; touches advance status automatically. Use `dead` for opt-outs |
| `autark run finish --run-id <id> --narrative @./run.md` | Finish a run with a narrative |
| `autark context <slug>[/<H##>]` | Product or hypothesis context: brief, feedback, hypotheses, leads, runs |
| `autark feedback record\|delete` | Leave / remove an operator nudge on a product or hypothesis |

Use `@./file` for multi-line markdown or JSON values instead of inlining large strings.

## Two Separate Jobs: Filling the Sheet, Draining the Sheet

**Sourcing** fills the sheet: find people, enrich them, write angles, record leads. A sourcing run sends nothing — no emails, no DMs, no posts, no comments.

A lead payload needs, at minimum, enough identity to dedupe (`primary_email`, a handle, or `full_name`) and a `lead.angle` that answers: why does this human belong under this bet? `bio` and `signals` are enrichment, not ceremony. If you cannot write a concrete angle, skip the person — one real prospect beats five padded rows.

**Outreach** drains the sheet, and only when the operator explicitly asks for it. Start from the sheet, not the context dump — and when you're working one bet, scope the sheet to it: `autark lead list <slug>/<H##> --status ready` for that hypothesis's first touches, `--status replied` for conversations needing a follow-up (drop the `/<H##>` for the product-wide view). Each row carries the lead id, the thread pointer, and the angle. Drill into one with `autark lead show <id>`, read the conversation with `autark mail thread <thread_ref>`, then send against the explicit lead id:

```sh
autark mail send --lead-id "$LEAD_ID" --to person@example.com \
  --subject "..." --text @draft.txt
```

One command does three things atomically: sends the email, records a `touch` (channel `email`, direction `out`, `thread_ref` = the AgentMail thread), and advances the lead `ready → contacted`. **The send is the bookkeeping** — never follow up with a separate status or logging command for the same send.

**Following up when they have NOT replied yet:** reply to your own latest message **with an explicit `--to`** — a plain reply addresses the sender of the target message, which is you, and the follow-up self-sends into your own inbox:

```sh
autark mail reply --lead-id "$LEAD_ID" --message-id <your-last-msg-id> \
  --to person@example.com --text @followup.txt
```

When answering THEIR message, plain `mail reply --lead-id --message-id <their-msg-id>` is correct — the sender you're addressing is them.

For non-email channels (a GitHub comment, a Reddit reply), perform the action first, then record it: `autark touch add --lead-id <id> --channel github --thread-ref <permalink-to-YOUR-comment>`. Same rule: the touch write advances the status. `autark lead status` exists as an explicit override (e.g. marking a lead `dead`), not as part of the normal flow.

Replies are captured automatically: a worker sweep polls the threads of `contacted` AND `replied` leads twice a day, records each real inbound message as a `direction: in` touch, and flips contacted leads to `replied` — no agent involvement. The touch log keeps appending after the first reply, so a lead's full conversation history (who said what, in what order) stays queryable via `autark lead show <id>`. If a "reply" turns out to be a ticket bot or autoresponder, judge it with `autark touch mute <touch-id>`: the lead drops back to `contacted` and the sweep honors the judgment permanently. A real human opt-out ("remove me from your list") is not a mute — set the lead `dead`.

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
- During sourcing, never advance a lead past `ready` and never send anything. Outreach happens only when the operator asks, and always against an explicit `--lead-id`.
- Do not blast. Ten well-researched touches beat hundreds of generic sends.
- Status moves with touches, not by hand. Reach for `lead status` only to override (e.g. `dead`), never to mirror a send you just made — the send already recorded it.
- Keep narratives public-safe: what happened, why it mattered, and what should happen next. On public products, hypothesis text, run narratives, and lead **angles** are readable by anyone — never put an email address in any of them. Emails belong on the person record (owner-only) and nowhere else.
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
