---
name: email
description: Use when an agent needs to send outreach, reply to inbound, sign up for a service, or log into a site via the user's autark-provisioned AgentMail inbox. Everything goes through `autark mail`.
---

# Email

Each autark user has their own AgentMail inbox provisioned at onboarding. All mail — sends, replies, inbox reads — goes through the `autark mail` CLI, which is already authenticated via `~/.autark/credentials.json`. Do not call `api.agentmail.to` directly. Do not use the `agentmail` npm CLI.

## Auth

`autark mail` reads the inbox token and address from `~/.autark/credentials.json` on every call. You do not need to set env vars or pass auth flags. If a command errors with `missing agentmail_token`, the user hasn't finished setup — run `autark mail setup --prefix <name>` once.

`AGENTMAIL_API_KEY` / `AGENTMAIL_EMAIL` / `AGENTMAIL_INBOX_ID` are honored as overrides if set in the environment — useful only when running with a non-default inbox.

## Plain text vs HTML — pick the right flag

The CLI accepts both `--text` and `--html`, matching the AgentMail / Mailgun / SendGrid / Resend / Postmark convention.

- `--text @file` — ships as `text/plain`. Recipient sees the bytes verbatim. Any HTML tags (`<div>`, `<p>`, `<br>`, `<a>`, etc.) show up as **literal text** in the recipient's inbox.
- `--html @file` — ships as `text/html`. Recipient's email client renders it as a styled email with real anchors, paragraph breaks, etc.

**The rule for outreach signatures:** if you put a link in the signature / footer of the email, the link must be **embedded in the word** (e.g. the name "kushal" is itself the clickable link), never a bare URL on its own line. A bare-URL signature is not the shape autark sends.

To get an embedded-link signature, you have to use `--html` — `--text` would render the `<a href>` markup as literal text in Gmail / Outlook. This is what broke on 2026-05-28: 6 cold emails went out with `<a href="https://autark.sh">kushal</a>` in `--text`, and every recipient saw the raw markup in their Gmail. See `autark/docs/email-html-in-text-incident.md` for the postmortem.

If your send doesn't have a signature link (signup verification, test pings, system messages), plain `--text` is fine.

## Lint every draft before sending

Run `autark mail lint` on every draft (sends *and* replies) before `autark mail send`:

```sh
autark mail lint --body @draft.txt
```

Exit 0 = clean. Exit 1 = violations printed as JSON, each with a `rule`, `detail`, and `why`. Treat the output as **feedback, not a gate**. The rules catch common AI tells; they sometimes false-positive on a draft that's actually fine. Read each `why`, judge whether the rule applies to your specific message, fix the ones that land, override the ones that don't. The bar isn't "lint exit 0" — it's "would this email land as a real human note?"

Lint inspects content quality only — AI-tells, hedging, length, signature shape. It does not police markup mechanics (that's the convention above + your judgment). Lint the body you're about to ship: if you're sending `--html`, lint the html file; if you're sending `--text`, lint the text file. Lint reads prose either way.

What lint checks:

- **structure-word** — AI-tell vocabulary in the body (`structurally`, `fundamentally`, `specifically`, `essentially`, `the key insight`, `that's exactly`, etc.). Humans writing cold email don't reach for these. Describe the thing directly.
- **em-dash** — any `—` character. Strong AI tell in outbound. Use commas, periods, or new line breaks. (Override if the recipient's own writing uses them and you're mirroring tone.)
- **body-url** — any URL outside a markdown `[name](url)` or HTML `<a href>` anchor. The product link belongs in the signature anchor; a bare URL mid-body reads as an A/B variant.
- **too-many-questions** — more than one `?`. Pick the single question that gives you the most signal. (Override fine for replies answering multiple direct asks.)
- **compound-question** — "are you X or Y...?" patterns. Drop the `or` and pick the more specific half.
- **too-long** — >400 chars before the signature (~4–6 short lines). Past that you're explaining, not asking.
- **no-anchor-sig** — signature has no clickable name link. Without an `<a href>` / `[name](url)` in the sig, the recipient has no quick path to figure out who you are.

If most violations land and you can't write a clean draft after 2 rewrites: the issue is upstream of the regex. Re-read `~/.claude/skills/outreach/SKILL.md` and ask whether you should send at all.

## Send a message — cold outreach (html, embedded-link sig)

```sh
autark mail send \
  --to person@example.com \
  --subject "Subject" \
  --html @./body.html \
  --lead-id $LEAD_ID
```

`body.html`:

```html
<p>Hi Karl,</p>
<p>one sentence quoting them.</p>
<p>one sentence on what you built.</p>
<p>one specific question?</p>
<p>best,<br><a href="https://autark.sh">kushal</a></p>
```

Recipient sees a styled email with "kushal" as a clickable link to autark.sh. This is the default shape for any cold outreach send.

**Always pass `--lead-id` on outreach.** One command does three things atomically: sends the email, records a `touch` on the lead (direction `out`, `thread_ref` = the AgentMail thread), and advances the lead `ready → contacted`. The send IS the bookkeeping — no separate status or logging command. The worker sweep then polls that thread (for contacted and replied leads) and records inbound replies automatically. Get the lead id from `autark lead list <slug>` / `autark lead show <id>`, or from the dashboard (clicking any lead row copies its id; `?lead=<id>` links carry it too).

`--run-id` still exists but it's the **legacy v1 action log** — it does not touch the lead sheet and the dashboard treats those rows as history. Don't use it for outreach against the sheet.

Other flags: `--cc`, `--bcc`, `--reply-to`, `--label`, `--attachment` (each repeatable or comma-separated), `--dry-run` to print the payload without sending.

Response is JSON with `message_id`, `thread_id`, and (when `--lead-id` was passed) the touch/lead record. Save it.

## Send a message — non-outreach (plain text, no link)

For signup verifications, test pings, system messages, or any send where there is no signature link to worry about:

```sh
autark mail send \
  --to verify@signup-form.test \
  --subject "Subject" \
  --text @./body.txt
```

Plain `--text` is fine here. No `--lead-id` because there's no lead — nothing lands on the sheet.

## Reply in a thread

```sh
autark mail reply \
  --message-id "$MESSAGE_ID" \
  --html @./reply.html \
  --lead-id $LEAD_ID
```

Same shape rules: if your reply has a signature link, use `--html`. If you're answering a one-liner with a one-liner and no sig link, `--text` is fine.

`$MESSAGE_ID` is the message id of the message you're replying to (the inbound one you got, or your own original send). It's what `mail send` / `mail message` / `mail thread` return.

**Following up when they have NOT replied:** a plain reply addresses the sender of the target message — which is you, so it self-sends into your own inbox. Pass an explicit `--to person@example.com` on follow-ups to your own last message.

Use `autark mail reply-all` to reply to all recipients, and `autark mail forward --message-id <id> --to <addr> [--html @body.html]` to forward.

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

- For any send whose signature contains a link, use `--html` so the link is embedded in the name. Bare-URL signatures are not the shape autark sends.
- Plain `--text` is fine for sends without a signature link (signup verifications, system pings, test sends).
- Lint every draft (sends and replies). Treat the output as feedback, override the rules that don't apply.
- Pass `--lead-id` on every outreach send/reply so the touch lands on the lead sheet and the reply sweep watches the thread.
- Do not guess email permutations from name + domain. Use the `email-finder` skill before first contact — verify the address through a concrete source (Apollo, GitHub commits, etc.).
- If the contact is high value or the source is shaky, corroborate with a second signal.
- If an address hard-bounces, suppress it and move on. Don't try nearby guesses.
- If browser work is needed for signups, verification links, or Apollo research, use the `chrome-relay` skill.
- The lead's touch log is the canonical record — `autark lead show <id>` lists every send and reply in order. The `mail send` response (`message_id` + `thread_id`) is how you reply into the right thread later.
