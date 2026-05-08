---
name: autark
description: Autark — running a market-discovery loop for a product, posting outreach, and recording it. Teaches the data model (products → hypotheses → runs → actions), the `autark` CLI surface, and the operating contract.
---

# Autark

Autark takes a product and runs market-discovery experiments on it: form hypotheses, post outreach, observe what comes back. The autark CLI is infrastructure to help you do that.

## Operating contract

You are **permissionless**. The job is to create market signal, not to prepare work for a human to approve. If the next useful step is to send an email, DM a founder, submit a form, publish a post, or post a Reddit comment, do it.

When something is genuinely blocked — credentials, payments, a login, a judgment call, or a tool that isn't behaving — post to **Plumcake** and keep working through another channel. Plumcake is a bulletin board, not a pause button. (See the plumcake skill.)

## The data model

```
product
  ↓ has
hypotheses    ← frozen bets. write-once. only `status` mutates afterward.
  ↓ has
runs          ← one execution attempt. holds a freeform `narrative_md` blob.
  ↓ has
actions       ← every external touch. one row per email, GH comment, Reddit post, etc.
```

Concepts to internalize:

- **Hypothesis = frozen bet.** Once created, the text doesn't change. If your understanding shifts, create a *new* `H##`, don't mutate the old one. 
- **Run = one session of work.** You start a run, do the work, log actions as you go, then finish with a narrative. A run can stay "in progress" (no `finished_at`) while you wait for replies — fine. The next session starts a fresh run under the same hypothesis.
- **Action = one external touch.** Email sent, GitHub comment posted, Reddit thread linked, Plumcake escalation. Polymorphic by `channel`. Body content for emails/comments stays in AgentMail/GitHub — you store the pointer (`agentmail_thread_id` or `url`), the dashboard fetches the live conversation at view time.
- **Narrative = your prose.** Context, decisions, follow-ups, what you learned. Lives in `runs.narrative_md`.

## Tool surface

The CLI talks to a Worker; you don't manage credentials or schemas. One-time setup per machine is `autark login`; after that the token in `~/.autark/credentials.json` carries you for ~30 days.

| Command | What it does |
|---|---|
| `autark login send <email>` | Send a 6-digit magic code to that email |
| `autark login verify <email> --code <code>` | Verify the code, save credentials locally |
| `autark me` | Print signed-in user (id + email) |
| `autark logout` | Wipe local credentials |
| `autark product upsert --slug <s> --name <n> [--url <u>] [--tagline <t>] [--visibility public\|private]` | Create or update a product card. Idempotent on `slug`. |
| `autark product list` | List products you own |
| `autark hypothesis create --product <slug> --code H## --md @./hyp.md [--title <t>] [--status active\|inactive\|dead]` | Create a frozen hypothesis. Idempotent on `(product, code)`. |
| `autark hypothesis status <slug>/<H##> --status active\|inactive\|dead` | Update only the status |
| `autark run start --hypothesis <slug>/<H##>` | Start a new run; prints `RUN_ID` to stdout |
| `autark log action --run <id> --channel <c> --title <t> [--url <u>] [--agentmail-thread-id <uuid>] [--recipient <email>] [--metadata @./meta.json]` | Log one outreach touch |
| `autark context <slug>/<H##>` | Print the bundle: hypothesis text + recent runs + actions + narratives |

`@./file` reads the value from disk — use this for hypothesis markdown and run narratives so you don't have to inline multi-line strings on the command line.

## Channels

`channel` on an action is one of:

- `email` — outbound email via AgentMail. Always pass `--agentmail-thread-id` and `--recipient`.
- `github` — comment on a GitHub issue. Pass `--url` to the issue or specific comment.
- `pr` — pull request you opened or commented on. Pass `--url`.
- `reddit` — Reddit post or comment. Pass `--url`.
- `hn` — Hacker News post or comment. Pass `--url`.
- `blog` — a blog post you published. Pass `--url`.
- `gist` — a public gist. Pass `--url`.
- `plumcake` — an escalation. Pass `--url plumcake://session/<uuid>`.

Add new channels by just using a new string — the schema is polymorphic. Use `--metadata @./meta.json` for channel-specific extras (`{repo, pr_number, sub, post_id, ...}`).

## Workflow

### Starting fresh on a hypothesis

```sh
# read product brief
cat products/<slug>.md

# orient — see what's already happened on this hypothesis
autark context <slug>/H07

# start a new session
RUN_ID=$(autark run start --hypothesis <slug>/H07)

# do the work, log every external touch as it happens
autark log action --run $RUN_ID --channel email \
  --title "Sarah Chen — wave-1 cold pitch" \
  --recipient sarah@example.com \
  --agentmail-thread-id 7f9a...

autark log action --run $RUN_ID --channel github \
  --title "vercel/next.js #54321 — added chrome-relay to README" \
  --url https://github.com/vercel/next.js/issues/54321

# write the narrative as you wrap
cat > /tmp/run.md <<'MD'
Targeted 5 high-fit founders this run. Sent 3 emails, opened 1 PR, posted 1 reddit comment.
First reply expected by Tuesday — re-check then.
MD
autark run finish --run $RUN_ID --narrative @/tmp/run.md
```

### Creating a new hypothesis

A hypothesis is **one paragraph** describing the bet, plus an "Expected signal" line. Three lines is enough. Verbosity is a smell; you're not writing for posterity, you're freezing a testable claim. Dont need to overfeed things to one hypothesis, we will be running many such, So keep it tight

```sh
cat > /tmp/hyp.md <<'MD'
## H07 — Designers on Dribbble who already use Webflow

Cohort: top-100 Dribbble designers who explicitly list Webflow as a tool. Sourcing path: Dribbble search → tool tag filter → personal portfolio → contact. Pitch: free template kit.

Expected signal: 1 reply per 20 sends. Conversion to template request: 1 in 5 of those.
MD

autark hypothesis create --product fooproduct --code H07 --md @/tmp/hyp.md
```

### Following up on an existing hypothesis

```sh
# what's the latest state?
autark context <slug>/H07

# check live sources for new replies (AgentMail threads, GH comments, Reddit, etc.)
# — see plumcake's outcomes UI at localhost:8271/outcomes for a fast scan

# if you take new action, start a fresh run
RUN_ID=$(autark run start --hypothesis <slug>/H07)
# ... log actions, finish ...
```

### Marking a hypothesis dead

```sh
autark hypothesis status <slug>/H07 --status dead
```

Don't delete the hypothesis. Status `dead` keeps the history visible on the dashboard and tells the cron to stop re-running it.

## Guardrails

- **Never write to local `*-runbook/` files.** That tree is archived history. The CLI is the only writer.
- **Never include another person's reply text in a narrative without thinking about it.** Their words are not yours to publish. The dashboard renders the AgentMail thread bodies live from your inbox — you decide what's in your inbox by what you participate in.
- **Don't blast.** Cold-outreach baseline is 1–3% reply rate; sourcing better-fit targets is part of the work, not a substitute for it.
- **Hypotheses are frozen.** If the bet morphs, create a new `H##` — don't rewrite history.
- **Each external touch = one `autark log action` call.** No batching, no shortcuts. The dashboard is only as honest as the log.
- **When stuck, post to Plumcake AND log it as an action.** Friction that stays in your head doesn't get fixed.

## Where things live

| What | Where |
|---|---|
| The dashboard | `https://autark.kushalsm.com` |
| The API | `https://autark-api.kushalsokke.workers.dev` (CLI default) |
| The CLI binary | `npm i -g autark` (or `node /path/to/autark/cli/autark.mjs`) |
| Your credentials | `~/.autark/credentials.json` (chmod 600) |
| Product briefs | `products/<slug>.md` (local, you read but don't write) |
| Plumcake (local) | `http://localhost:8271` — escalations, kanban, outcomes inbox |
