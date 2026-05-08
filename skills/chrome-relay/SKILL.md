---
name: chrome-relay
description: Use when an agent needs to operate the user's real Chrome session — listing tabs, reading interactive elements, clicking, filling, typing into rich editors, pressing keys, evaluating JS, and capturing screenshots. All actions go through CDP and run on backgrounded tabs without stealing focus.
---

# Chrome Relay

Drives the user's real Chrome session through a Chrome extension + local native host. Prefer it when logged-in browser state (auth cookies, sessions, extensions) matters.

## Setup

1. [chrome extension](https://chromewebstore.google.com/detail/chrome-relay/cpdiapbifblhlcpnmlmfpgfjlacebokb?authuser=0&hl=en-GB)

2. chrome-relay cli
```sh
pnpm add -g chrome-relay
chrome-relay install
chrome-relay doctor
```

## Tool surface

| Command | What it does |
|---|---|
| `tabs` | List windows + tabs with their `tabId`s |
| `navigate <url>` | Open in current tab. `--new --inactive` opens in background. `--tab <id>` retargets an existing tab. |
| `read --tab <id> -i` | Interaction map: visible interactive elements with selectors, text, role, bounds |
| `click <selector> --tab <id>` | CDP `Input.dispatchMouseEvent` — trusted hover + press + release at element center |
| `fill <selector> <value> --tab <id>` | Atomic value write into `<input>` / `<textarea>` / `<select>`. Bypasses React's value tracker. |
| `type <text> --tab <id> [-s <selector>]` | CDP `Input.insertText` — trusted text commit. Use for contenteditable, Draft.js, Lexical, ProseMirror. |
| `keys <chord> --tab <id>` | CDP `Input.dispatchKeyEvent` — single key or chord (`Enter`, `Tab`, `Escape`, `Cmd+K`, `Shift+ArrowDown`) |
| `js <code> --tab <id>` | `Runtime.evaluate` in MAIN world. Use `return` for the value. Top-level await works. |
| `screenshot --tab <id> -o <path>` | PNG of any tab without activating it. `--full` captures beyond viewport. |
| `switch <tabId>` / `close <tabIds...>` | Activate or close tabs |

## Picking the right text tool

| Target element | Tool |
|---|---|
| `<input>`, `<textarea>`, `<select>` (including React-controlled) | `fill` |
| `[contenteditable]`, `role="textbox"`, Draft.js / Lexical / ProseMirror, X compose, LinkedIn DM, new Reddit composer | `type` |
| Submit, navigate menus, modifier shortcuts | `keys` |
| Anything weird — shadow DOM piercing, framework-internal pokes, scraping | `js` |

`fill` writes the whole value atomically. `type` inserts at the current caret. They produce different downstream events; if `fill` doesn't trigger the page's change handler, try `type`.

## Workflow

1. Find your tab:
   ```sh
   chrome-relay tabs
   ```

2. Open the page:
   ```sh
   chrome-relay navigate "https://example.com" --new --inactive
   ```

3. Read the page — pipe to a file, don't dump 100KB of JSON into your context:
   ```sh
   chrome-relay read --tab 1234 -i > /tmp/page.json
   jq '.elements[] | select(.text | test("Compose"; "i"))' /tmp/page.json
   # or
   grep -i -B1 -A3 'compose' /tmp/page.json
   ```
   `read -i` returns up to 250 elements (~50–100KB on dense apps like LinkedIn). The selectors are stable for the duration of the page; the file is reusable across multiple greps.

4. Act on the selectors you found:
   ```sh
   chrome-relay click "<selector>" --tab 1234
   chrome-relay fill "<selector>" "value" --tab 1234
   chrome-relay type "tweet body" --tab 1234 -s "[data-testid=tweetTextarea_0]"
   chrome-relay keys "Enter" --tab 1234
   ```

5. When the DOM doesn't expose what you need, drop to `js`:
   ```sh
   chrome-relay js --tab 1234 "return document.title"
   chrome-relay js --tab 1234 "const r = await fetch('/api/me'); return await r.json()"
   chrome-relay js --tab 1234 "return document.querySelector('faceplate-textinput').shadowRoot.querySelector('input').value"
   ```

6. Capture proof:
   ```sh
   chrome-relay screenshot --tab 1234 -o /tmp/evidence.png
   ```
   Backgrounded tabs work fine — focus is not stolen.

## Guardrails

- Pipe `read -i` to a file and grep/jq it. Do not paste the full element map into chat.
- Capture a screenshot before irreversible actions (form submit, send message, account change). Save the path.
- Run `chrome-relay <command> --help` if a flag is unclear.
