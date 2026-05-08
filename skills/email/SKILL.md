---
name: email
description: Use when Codex needs to sign up for a service, log into a site, receive verification emails, or send outreach using Kushal's branded agent inbox.
---

# Email

The canonical Autark agent email identity is **`kushal@kushalsm.com`**.

Use that address in outreach and signups unless the current run explicitly needs a legacy path for debugging old work.

## Auth

Both the CLI and the REST API use the same key.

```sh
set -a
. /Users/kushalsm/solo/.env
set +a
export AGENTMAIL_API_KEY="$KUSHALSM_AGENTMAIL"
```

The REST endpoints use the same key as `Authorization: Bearer $KUSHALSM_AGENTMAIL`.

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
curl -s -X POST "https://api.agentmail.to/v0/inboxes/kushal@kushalsm.com/messages/send" \
  -H "Authorization: Bearer $AGENTMAIL_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg to person@example.com --arg subj "Subject" --rawfile body /tmp/body.txt \
        '{to: [$to], subject: $subj, text: $body}')"
```

The response is JSON with `message_id` and `thread_id` — save both into `evidence/`.

### CLI (only for short, plain bodies)

```sh
agentmail inboxes:messages send \
  --inbox-id kushal@kushalsm.com \
  --to person@example.com \
  --subject "Subject" \
  --text "Plain ASCII body, no markdown, no leading colons or quotes."
```

If `--text` rejects the body with `Incorrect Usage: invalid value`, switch to REST. Don't try to escape your way through it.

## Reply in a thread

To land in the existing thread (so the recipient sees it as a reply, not a new email):

### REST

```sh
curl -s -X POST "https://api.agentmail.to/v0/inboxes/kushal@kushalsm.com/messages/$MESSAGE_ID/reply" \
  -H "Authorization: Bearer $AGENTMAIL_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$(jq -n --rawfile body /tmp/reply.txt '{text: $body}')"
```

`$MESSAGE_ID` is the original message's `message_id` (with the angle brackets, e.g. `<CAPoqp...@mail.gmail.com>`). Get it from the thread listing.

### CLI equivalent

```sh
agentmail inboxes:messages reply \
  --inbox-id kushal@kushalsm.com \
  --message-id "$MESSAGE_ID" \
  --text "Plain reply body."
```

## Read inbox

CLI is fine here — output is JSON.

```sh
agentmail inboxes:threads list --inbox-id kushal@kushalsm.com --limit 30
agentmail inboxes:threads retrieve --inbox-id kushal@kushalsm.com --thread-id <thread-id>
agentmail inboxes:messages list --inbox-id kushal@kushalsm.com
agentmail inboxes:messages retrieve --inbox-id kushal@kushalsm.com --message-id "$MESSAGE_ID"
```

REST equivalents:

```
GET /v0/inboxes/kushal@kushalsm.com/threads
GET /v0/inboxes/kushal@kushalsm.com/threads/{thread_id}
GET /v0/inboxes/kushal@kushalsm.com/messages
GET /v0/inboxes/kushal@kushalsm.com/messages/{message_id}
```

## Rules

- Do not guess email permutations from name + domain.
- Before first outbound contact, verify the address through Apollo or another concrete browser-based source.
- If the contact is high value or the source is shaky, corroborate with a second signal.
- If an address hard-bounces, suppress it and move on instead of trying nearby guesses.
- If browser work is needed for signups, verification links, or Apollo research, use the `browser` skill and `chrome-relay`.
- Save every send response (or REST response body) into `evidence/` — `message_id` and `thread_id` are how you find replies later.

## Legacy references

The old `kushalsm@agentmail.to` references in historical notes are legacy only.
