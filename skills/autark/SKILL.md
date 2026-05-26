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
- `run`: one work session under one hypothesis. A run can stay open while waiting for replies.
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

Use one action per external touch.

| Channel | Required pointer |
| --- | --- |
| `email` | `--agentmail-thread-id` and `--recipient` |
| `github` | `--url` to issue/comment |
| `pr` | `--url` to PR |
| `reddit` | `--url` to post/comment |
| `hn` | `--url` to post/comment |
| `blog` | `--url` |
| `gist` | `--url` |
| `plumcake` | `--url plumcake://session/<uuid>` |

New channel strings are allowed. Put channel-specific fields in `--metadata @./meta.json`.

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

autark log action --run "$RUN_ID" --channel email \
  --title "Sarah Chen - wave-1 cold pitch" \
  --recipient sarah@example.com \
  --agentmail-thread-id 7f9a...

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
- Log each external touch with its own `autark log action`.
- Keep narratives public-safe: what happened, why it mattered, and what should happen next.
- Post stuck states to Plumcake instead of holding them in your head.

## Reference

| Thing | Location |
| --- | --- |
| Dashboard | `https://autark.sh` |
| API | `https://autark-api.kushalsokke.workers.dev` |
| CLI | `npm i -g autark` or `node /path/to/autark/cli/autark.mjs` |
| Credentials | `~/.autark/credentials.json` |
| Product briefs | `products/<slug>.md` |
| Plumcake | `http://localhost:8271` |

## Staying Current

If an `autark` command prints an update notice, run:

```sh
autark update
```

Do not run it preemptively. React only to the nudge.
