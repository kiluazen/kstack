---
name: email
description: Use when an agent needs to send outreach, reply to inbound, sign up for a service, or log into a site via the user's autark-provisioned AgentMail inbox. Everything goes through `autark mail`.
---

# Email

Each autark user has their own AgentMail inbox provisioned at onboarding. All mail — sends, replies, inbox reads — goes through the `autark mail` CLI, which is already authenticated via `~/.autark/credentials.json`. Do not call `api.agentmail.to` directly. Do not use the `agentmail` npm CLI.

## Auth

`autark mail` reads the inbox token and address from `~/.autark/credentials.json` on every call. You do not need to set env vars or pass auth flags. If a command errors with `missing agentmail_token`, the user hasn't finished setup — run `autark mail setup --prefix <name>` once.

`AGENTMAIL_API_KEY` / `AGENTMAIL_EMAIL` / `AGENTMAIL_INBOX_ID` are honored as overrides if set in the environment — useful only when running with a non-default inbox.

## Lint every draft before sending

Run `autark mail lint` on every draft (sends *and* replies) before `autark mail send`:

```sh
autark mail lint --body @draft.txt
```

Exit 0 = clean. Exit 1 = violations printed as JSON, each with a `rule`, `detail`, and `why`. Treat the output as **feedback, not a gate**. The rules catch common AI tells; they sometimes false-positive on a draft that's actually fine. Read each `why`, judge whether the rule applies to your specific message, fix the ones that land, override the ones that don't. The bar isn't "lint exit 0" — it's "would this email land as a real human note?"

What lint checks:

- **structure-word** — AI-tell vocabulary in the body (`structurally`, `fundamentally`, `specifically`, `essentially`, `the key insight`, `that's exactly`, etc.). Humans writing cold email don't reach for these. Describe the thing directly.
- **em-dash** — any `—` character. Strong AI tell in outbound. Use commas, periods, or new line breaks. (Override if the recipient's own writing uses them and you're mirroring tone.)
- **body-url** — any URL outside a markdown `[name](url)` or HTML `<a href>` anchor. The product link belongs in the signature anchor; a bare URL mid-body reads as an A/B variant.
- **too-many-questions** — more than one `?`. Pick the single question that gives you the most signal. (Override fine for replies answering multiple direct asks.)
- **compound-question** — "are you X or Y...?" patterns. Drop the `or` and pick the more specific half.
- **too-long** — >400 chars before the signature (~4–6 short lines). Past that you're explaining, not asking.
- **no-anchor-sig** — signature has no clickable name link. Without an `<a href>` / `[name](url)` in the sig, the recipient has no quick path to figure out who you are.

If most violations land and you can't write a clean draft after 2 rewrites: the issue is upstream of the regex. Re-read `~/.claude/skills/outreach/SKILL.md` and ask whether you should send at all.

## Send a message

```sh
autark mail send \
  --to person@example.com \
  --subject "Subject" \
  --text @./draft.txt \
  --run-id $RUN_ID
```

Multi-line bodies are fine — `--text @./file` reads from disk so there's no shell-escaping or YAML-parser dance. Use `--text "literal string"` only for one-liners.

**Always pass `--run-id`.** With it, `autark mail send` records the autark action itself (channel=email, recipient, thread_id, message_id, subject) so you don't need a separate `autark log action`. Without `--run-id`, the send still works but isn't tracked — only do that for non-outreach signups/login flows where there's no autark run.

Other flags: `--cc`, `--bcc`, `--reply-to`, `--label`, `--attachment` (each repeatable or comma-separated), `--dry-run` to print the payload without sending, `--title` to override the auto-generated action title.

Response is JSON with `message_id`, `thread_id`, and (when `--run-id` was passed) `autark_action_id`. Save it.

## Reply in a thread

```sh
autark mail reply \
  --message-id "$MESSAGE_ID" \
  --text @./reply.txt \
  --run-id $RUN_ID
```

`$MESSAGE_ID` is the message id of the message you're replying to (the inbound one you got, or your own original send). It's what `mail send` / `mail message` / `mail thread` return.

Use `autark mail reply-all` to reply to all recipients, and `autark mail forward --message-id <id> --to <addr> [--text @body.txt]` to forward.

## Read inbox

```sh
autark mail threads [--limit 30]               # list threads
autark mail thread <thread_id>                 # one thread + all messages
autark mail messages [--limit 30]              # flat message list
autark mail message <message_id>               # single message
autark mail raw <message_id>                   # full raw payload
autark mail attachment --message-id <id> --attachment-id <id> [--out file]
```

JSON output throughout. No auth flags — credentials are read from disk.

## Escape hatch

If AgentMail ships a new endpoint that `autark mail` doesn't wrap yet:

```sh
autark mail request GET /inboxes/$EMAIL/some/new/endpoint
autark mail request POST /inboxes/$EMAIL/foo --body @payload.json
```

Reuses the same authenticated session. Use this only when no wrapped command fits.

## Rules

- Lint every draft (sends and replies). Treat the output as feedback, override the rules that don't apply.
- Pass `--run-id` on every outreach send/reply so the action lands in autark and the reply-state cron can detect engagement.
- Do not guess email permutations from name + domain. Use the `email-finder` skill before first contact — verify the address through a concrete source (Apollo, GitHub commits, etc.).
- If the contact is high value or the source is shaky, corroborate with a second signal.
- If an address hard-bounces, suppress it and move on. Don't try nearby guesses.
- If browser work is needed for signups, verification links, or Apollo research, use the `chrome-relay` skill.
- The `autark mail send` response (or `--dry-run` payload) is the canonical record — `message_id` + `thread_id` are how you find replies later. If you passed `--run-id`, autark already stored them under the action.
