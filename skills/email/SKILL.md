---
name: email
description: Use when an agent needs to sign up for a service, log into a site, receive verification emails, or send outreach via the user's autark-provisioned AgentMail inbox.
---

# Email

Each autark user has their own AgentMail inbox (e.g. `kushal@kushalsm.com`, `laksh@kushalsm.com`) provisioned at onboarding. Use the inbox tied to **this** user's autark login for all outreach and signups.

## Auth — read the token from `~/.autark/credentials.json`

The autark installer drops a per-inbox API key into `~/.autark/credentials.json` (`agentmail_token` field). The same file holds the inbox email under `agentmail_email`. Every send goes through this token; it's scoped to one inbox so it can't read other users' mail.

Standard prelude for any shell call:

```sh
AGENTMAIL_API_KEY="${AGENTMAIL_API_KEY:-$(jq -r .agentmail_token ~/.autark/credentials.json 2>/dev/null)}"
AGENTMAIL_EMAIL="${AGENTMAIL_EMAIL:-$(jq -r .agentmail_email ~/.autark/credentials.json 2>/dev/null)}"
[ -z "$AGENTMAIL_API_KEY" ] && { echo "no agentmail token — run: autark onboard agentmail"; exit 1; }
[ -z "$AGENTMAIL_EMAIL" ]   && { echo "no agentmail email — credentials missing agentmail_email"; exit 1; }
```

`AGENTMAIL_API_KEY` and `AGENTMAIL_EMAIL` are also honored from the environment (useful for one-off debugging) — credentials.json is just the default.

The REST endpoints use the key as `Authorization: Bearer $AGENTMAIL_API_KEY`.

## Two paths: CLI and REST

The official `agentmail` CLI (`@agentmail/cli` from npm) is installed globally as `agentmail`. It is fine for **read operations** (list, retrieve) and quick plain-ASCII sends.

For **writes** (send, reply), default to **REST**. The CLI's flag-value parser is YAML-based and rejects common content with `Incorrect Usage: invalid value (... failed to parse as YAML)`. Concretely, these break the CLI:

- Any flag value beginning with `[` — e.g. `--subject "[skill-test] ..."`
- Bodies containing markdown list items that look like YAML, e.g. a line `- > A blockquote line` or `- some list item` followed by content the YAML parser doesn't accept.
- Any `--text` containing fenced code blocks with backticks adjacent to certain patterns.

There is no `--text-file` or stdin-fed flag, so escaping your way around this is a rabbit hole. Just use REST.

## Send a message

### REST (default — handles any body)

```sh
curl -s -X POST "https://api.agentmail.to/v0/inboxes/$AGENTMAIL_EMAIL/messages/send" \
  -H "Authorization: Bearer $AGENTMAIL_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg to person@example.com --arg subj "Subject" --rawfile body /tmp/body.txt \
        '{to: [$to], subject: $subj, text: $body}')"
```

The response is JSON with `message_id` and `thread_id` — save both into `evidence/`.

### CLI (only for short, plain bodies)

```sh
agentmail inboxes:messages send \
  --inbox-id "$AGENTMAIL_EMAIL" \
  --to person@example.com \
  --subject "Subject" \
  --text "Plain ASCII body, no markdown, no leading colons or quotes."
```

If `--text` rejects the body with `Incorrect Usage: invalid value`, switch to REST. Don't try to escape your way through it.

## Reply in a thread

To land in the existing thread (so the recipient sees it as a reply, not a new email):

### REST

```sh
curl -s -X POST "https://api.agentmail.to/v0/inboxes/$AGENTMAIL_EMAIL/messages/$MESSAGE_ID/reply" \
  -H "Authorization: Bearer $AGENTMAIL_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$(jq -n --rawfile body /tmp/reply.txt '{text: $body}')"
```

`$MESSAGE_ID` is the original message's `message_id` (with the angle brackets, e.g. `<CAPoqp...@mail.gmail.com>`). Get it from the thread listing.

### CLI equivalent

```sh
agentmail inboxes:messages reply \
  --inbox-id "$AGENTMAIL_EMAIL" \
  --message-id "$MESSAGE_ID" \
  --text "Plain reply body."
```

## Read inbox

CLI is fine here — output is JSON.

```sh
agentmail inboxes:threads list --inbox-id "$AGENTMAIL_EMAIL" --limit 30
agentmail inboxes:threads retrieve --inbox-id "$AGENTMAIL_EMAIL" --thread-id <thread-id>
agentmail inboxes:messages list --inbox-id "$AGENTMAIL_EMAIL"
agentmail inboxes:messages retrieve --inbox-id "$AGENTMAIL_EMAIL" --message-id "$MESSAGE_ID"
```

REST equivalents:

```
GET /v0/inboxes/$AGENTMAIL_EMAIL/threads
GET /v0/inboxes/$AGENTMAIL_EMAIL/threads/{thread_id}
GET /v0/inboxes/$AGENTMAIL_EMAIL/messages
GET /v0/inboxes/$AGENTMAIL_EMAIL/messages/{message_id}
```

## Rules

- Do not guess email permutations from name + domain.
- Before first outbound contact, verify the address through Apollo or another concrete browser-based source.
- If the contact is high value or the source is shaky, corroborate with a second signal.
- If an address hard-bounces, suppress it and move on instead of trying nearby guesses.
- If browser work is needed for signups, verification links, or Apollo research, use the `browser` skill and `chrome-relay`.
- Save every send response (or REST response body) into `evidence/` — `message_id` and `thread_id` are how you find replies later.
