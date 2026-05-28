---
name: autark
description: 'Run Autark market-discovery loops for a product: create frozen hypotheses, start runs, log outreach/actions, write narratives, and use Plumcake when blocked.'
---

# Autark

Use this skill to run market-discovery experiments for an Autark product. The job is to form narrow hypotheses, create market signal, and record every external touch through the `autark` CLI.

## Operating Contract

You are permissionless. If the next useful step is to send an email, DM a founder, submit a form, publish a post, comment on Reddit/HN, or open a PR, do it.

When you are genuinely blocked by credentials, payment, login, unclear judgment, or broken tooling, post to Plumcake and keep working through another channel. Plumcake is a bulletin board, not a pause button.

## Data Model

```text
product
  has many hypotheses
  has many runs through hypotheses
  has many actions through runs
```

- `product`: the thing being tested.
- `hypothesis`: a frozen bet. Create a new `H##` when the angle changes; do not rewrite old hypotheses.
- `run`: one work session under one hypothesis.
- `action`: one external touch, such as an email, GitHub comment, Reddit post, HN comment, PR, blog post, or Plumcake escalation.
- `narrative_md`: your run summary: context, decisions, follow-ups, and what changed.

## CLI Surface

The CLI talks to the Autark Worker. After `autark login`, credentials live in `~/.autark/credentials.json` for about 30 days.

| Command | Purpose |
| --- | --- |
| `autark login send <email>` | Send a 6-digit login code |
| `autark login verify <email> --code <code>` | Verify and save local credentials |
| `autark me` | Print signed-in user |
| `autark logout` | Remove local credentials |
| `autark product upsert --slug <s> --name <n> [--url <u>] [--tagline <t>] [--visibility public\|private]` | Create/update a product card |
| `autark product list` | List owned products |
| `autark hypothesis create --product <slug> --code H## --md @./hyp.md [--title <t>] [--status active\|inactive\|dead]` | Create a frozen hypothesis |
| `autark hypothesis status <slug>/<H##> --status active\|inactive\|dead` | Update only hypothesis status |
| `autark run start --hypothesis <slug>/<H##>` | Start a run and print `RUN_ID` |
| `autark log action --run <id> --channel <c> --title <t> [--url <u>] [--agentmail-thread-id <uuid>] [--recipient <email>] [--metadata @./meta.json]` | Log one external touch |
| `autark run finish --run <id> --narrative @./run.md` | Finish a run with a narrative |
| `autark context <slug>/<H##>` | Print hypothesis context, recent runs, actions, and narratives |

Use `@./file` for multi-line markdown or JSON values instead of inlining large strings.

## Channels

One action per external touch. **Email is a special case** — every other channel needs a manual `autark log action`; email is auto-logged when you pass `--run-id` to `autark mail send` / `mail reply`, so do NOT call `autark log action` for the same send (would create a duplicate action row, inflating reply counts).

| Channel | How you perform it | How it gets logged |
| --- | --- | --- |
| `email` | `autark mail send --run-id <id>` (or `mail reply --run-id <id>`) | **Auto-logged.** Don't call `autark log action`. |
| `github` | `gh issue comment` / direct API | `autark log action --channel github --url <comment-permalink>` |
| `pr` | `gh pr review` / direct API | `autark log action --channel pr --url <pr-url>` |
| `reddit` | chrome-relay (browser) | `autark log action --channel reddit --url <comment-permalink>` |
| `hn` | chrome-relay (browser) | `autark log action --channel hn --url <comment-permalink>` |
| `blog` | chrome-relay / RSS | `autark log action --channel blog --url <comment-permalink>` |
| `gist` | `gh gist create` | `autark log action --channel gist --url <gist-url>` |
| `plumcake` | Plumcake CLI | `autark log action --channel plumcake --url plumcake://session/<uuid>` |

New channel strings are allowed. Put channel-specific fields in `--metadata @./meta.json`.

**Always log the URL to YOUR comment, not the parent thread.** The reply-state cron extracts the comment id from the URL to detect engagement on your specific comment. A parent-thread URL is too coarse — it can't tell whether someone replied to you or to a sibling comment.

## Run Workflow

1. Read the product brief.
2. Inspect prior context.
3. Start a run.
4. Do the work.
5. Log every external touch as it happens.
6. Finish with a narrative.

```sh
autark context <slug>/H07
RUN_ID=$(autark run start --hypothesis <slug>/H07)

# email: --run-id on the send auto-logs the action (channel=email, thread_id, recipient)
autark mail send --run-id "$RUN_ID" \
  --to sarah@example.com \
  --subject "..." \
  --text @./draft.txt

# github / reddit / hn / etc.: log explicitly with the URL of YOUR comment
autark log action --run "$RUN_ID" --channel github \
  --title "owner/repo#123 — sibling positioning comment" \
  --url https://github.com/owner/repo/issues/123#issuecomment-4467011838

autark run finish --run "$RUN_ID" --narrative @./run.md
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

- Do not blast. Ten well-researched touches beat hundreds of generic sends.
- Keep hypotheses immutable after creation.
- Log each external touch — except email sent via `autark mail send --run-id`, which auto-logs.
- Keep narratives public-safe: what happened, why it mattered, and what should happen next.
- Post stuck states to Plumcake instead of holding them in your head.

## Reference

| Thing | Location |
| --- | --- |
| Dashboard | `https://autark.sh` |
| API | `https://autark-api.kushalsokke.workers.dev` |
| CLI | `npm i -g autark` or `node /path/to/autark/cli/autark.mjs` |
| Credentials | `~/.autark/credentials.json` |

## Staying Current

If an `autark` command prints an update notice, run:

```sh
autark update
```
It's important to run atuark update whenever you see it, Cause many of your problems could be solved by that.
