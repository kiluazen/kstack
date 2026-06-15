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
  has many leads             (lead: person × hypothesis — the angle + the verdict)
    has many channel_states  (one per channel: the live stage on email / linkedin / …)
  has many runs through hypotheses
```

- `product`: the thing being tested.
- `hypothesis`: a frozen bet. Create a new `H##` when the angle changes; do not rewrite old hypotheses.
- `person`: one deduped human — identity (`full_name`, `primary_email`, `handles`) plus enrichment (`headline`, `bio`, `signals`) and `company_domain` (the grouping key behind "who else do we know at <company>"). No stage or angle lives here.
- `lead`: one person under one hypothesis — carries the `angle` (why this human belongs under this bet) and an `outcome` (`open` → `landed` / `dead`). **Outcome is the verdict on the whole pursuit across every channel, and it is yours to set, not the machine's** — `open` while you're still working it, `landed` when it converts, `dead` when it's over (opt-out / hard no). Outcome is what hides a lead from the action queues. The same human under two bets is one person, two leads.
- `channel_state`: the live per-channel rollup — one row per (lead, channel). It is **derived from the touch log**, not set by hand: each touch you record advances its channel's `stage`. Stages by channel:
  - **email**: `ready` (verified/sourced address, mailable now) → `contacted` → `replied`  (+`bounced`)
  - **linkedin**: `reachable` (handle known) → `invited` → `accepted` → `contacted` → `replied`  (+`withdrawn`/`blocked`)
  Each channel_state also tracks `needs_reply` (true = they sent the last word, the ball is in our court), `last_out_at`, `last_in_at`, `attempt_count`. A lead can be live on several channels at once — `email:contacted` and `linkedin:invited` side by side.
- `touch`: one real interaction on one lead — `channel`, `event` (`source`/`invite`/`accept`/`message`/`bounce`/`withdraw`/`block`/`note`), `direction` (`out`|`in`), `ref` (AgentMail thread id, invite URL, the permalink of YOUR comment), `summary`. The append-only touch log is the source of truth; channel_state is its materialized rollup. Bodies stay external; the touch is a pointer.
- `run`: one work session under one hypothesis, sealed with `narrative_md`: context, decisions, follow-ups, and what changed.

> Migration note: the old single `lead.status` field still exists and is kept in sync, but the real model is now per-channel `stage` + lead `outcome`. Read and write through the channel-aware commands below; reach for `lead status` only as a legacy override.

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
| `autark mail send --lead-id <id> --to <email> --subject <s> --text @draft.txt` | Send email AND record the touch AND advance the email channel, atomically |
| `autark touch record --lead-id <id> --channel <c> --event <e> [--direction out\|in] [--ref <ref>]` | Record one real interaction; advances that channel's stage (alias: `touch add`). LinkedIn ladder: `--event invite`→invited, `accept`→accepted, `message`→contacted (or `--direction in`→replied) |
| `autark lead list <slug>[/<H##>] [filters]` | The front door: one line per lead, ids first. Filters (combine): `--channel email\|linkedin`, `--stage <s>`, `--needs-reply` (ball in our court), `--silent-for <days>` (contacted, gone quiet), `--company <domain>`, `--include-closed`. Rows show outcome + every channel's stage (`*` = we owe a reply) |
| `autark lead show <lead-id>` | One lead fully loaded: person, bet, outcome, per-channel state, ordered touch log with ids — run this when handed a lead link or a bare id (`https://autark.sh/<slug>?lead=<id>` carries it in the query param) |
| `autark touch mute <touch-id>` | Judge an inbound touch a non-reply (ticket bot, autoresponder); channel_state recomputes, sweep respects it |
| `autark lead outcome <lead-id> --set open\|landed\|dead` | The human verdict on the whole pursuit. `landed` = converted, `dead` = opt-out / hard no. Drops the lead out of the action queues |
| `autark lead status <lead-id> --status <s>` | Legacy single-channel status override — prefer `touch record` (advances a channel) + `lead outcome` (the verdict) |
| `autark run finish --run-id <id> --narrative @./run.md` | Finish a run with a narrative |
| `autark context <slug>[/<H##>]` | Product or hypothesis context: brief, feedback, hypotheses, leads, runs |
| `autark feedback record\|delete` | Leave / remove an operator nudge on a product or hypothesis |

Use `@./file` for multi-line markdown or JSON values instead of inlining large strings.

## Two Separate Jobs: Filling the Sheet, Draining the Sheet

**Sourcing** fills the sheet: find people, enrich them, write angles, record leads. A sourcing run sends nothing — no emails, no DMs, no posts, no comments.

A lead payload needs, at minimum, enough identity to dedupe (`primary_email`, a handle, or `full_name`) and a `lead.angle` that answers: why does this human belong under this bet? `bio` and `signals` are enrichment, not ceremony. If you cannot write a concrete angle, skip the person — one real prospect beats five padded rows.

**`email_status` decides the email channel — set it honestly.** The email channel reaches `ready` (mailable now) automatically when the person has an address with `email_status: verified` or `sourced` (a real first-party address from a commit, site, or published page). A `guessed` / `unknown` / `none` address is NOT sendable and creates no email:ready — found the person but not a real address yet is honest, not a failure. So your sourcing job is simply: set `person.email_status` truthfully, and `email:ready` falls out of it. (A LinkedIn `handle` on the person likewise seeds `linkedin:reachable` automatically.) The legacy `lead.status` payload field still works but you no longer need to micromanage it.

**Promote with `enrich`, never re-add.** When you later find the email (or a handle) for a lead already on the sheet, update it in place: `autark lead enrich --lead-id <id> --input @enrich.json` carrying the new `person.primary_email` + `person.email_status: verified` (the email channel flips to `ready` on its own). Do NOT run `lead add` again for someone you already sourced — person identity is keyed on one field (`email` > handle > name), so adding an email *changes* the key and a re-add creates a duplicate row instead of updating. `enrich` keeps the same row id. If a duplicate ever slips through, `autark lead delete <id>` removes it (zero-touch leads only; it refuses anything with outreach history).

**Outreach** drains the sheet, and only when the operator explicitly asks for it. Start from the sheet, not the context dump, and scope it to the work in front of you:

- `autark lead list <slug>/<H##> --channel email --stage ready` — emails waiting to go out on this bet
- `autark lead list <slug> --needs-reply` — conversations where the ball is in our court (any channel)
- `autark lead list <slug> --channel linkedin --stage reachable` — people to send a LinkedIn invite to
- `autark lead list <slug> --channel linkedin --stage accepted` — connections accepted, ready for a first message
- `autark lead list <slug> --silent-for 7` — contacted, no reply, gone quiet 7+ days (follow-up candidates)

Each row carries the lead id, the company, and every channel's stage. Drill into one with `autark lead show <id>`, read the email conversation with `autark mail thread <thread_ref>`, then act against the explicit lead id:

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

**Non-email channels — do the action in the tool, then record the touch.** Email is the only channel the CLI sends; everywhere else you act first (in chrome-relay for LinkedIn, on the site for a GitHub/Reddit comment) and record the touch after, so autark mirrors what you did. The touch write advances that channel's stage:

```sh
# LinkedIn, worked through chrome-relay, recorded step by step:
autark touch record --lead-id "$LEAD_ID" --channel linkedin --event invite  --ref <invite-url>
autark touch record --lead-id "$LEAD_ID" --channel linkedin --event accept                       # they accepted
autark touch record --lead-id "$LEAD_ID" --channel linkedin --event message --ref <thread-url> --summary "first message"
autark touch record --lead-id "$LEAD_ID" --channel linkedin --event message --direction in        # they replied

# a GitHub comment:
autark touch record --lead-id "$LEAD_ID" --channel github --ref <permalink-to-YOUR-comment>
```

Record each LinkedIn step as you actually take it — invite, then accept when they connect, then message — so the `reachable → invited → accepted → contacted → replied` ladder reflects reality and `lead list --channel linkedin --stage accepted` surfaces exactly who's ready for a first message.

**Email replies are captured automatically**: a worker sweep polls the threads of `contacted` AND `replied` email leads twice a day, records each real inbound message as a `direction: in` touch, and flips the email channel to `replied` — no agent involvement. (LinkedIn has no such poll — you record inbound LinkedIn replies yourself with `--event message --direction in` when you see them.) The touch log keeps appending, so a lead's full history stays queryable via `autark lead show <id>`. If an email "reply" is a ticket bot or autoresponder, judge it with `autark touch mute <touch-id>`: that channel drops back to `contacted` and the sweep honors it permanently. A real human opt-out ("remove me from your list") is not a mute — it ends the pursuit: `autark lead outcome <id> --set dead`.

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
- During sourcing, never send or message anything — just record people. Outreach happens only when the operator asks, and always against an explicit `--lead-id`.
- Do not blast. Ten well-researched touches beat hundreds of generic sends.
- Channel stage moves with touches, not by hand — record what you actually did and the stage follows. `outcome` (`landed`/`dead`) is the one human verdict you set explicitly; never mirror a send you just made — the send already recorded it.
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
