---
name: mcp-oauth-server
description: Day-one rules for any MCP server that uses @cloudflare/workers-oauth-provider (ChatGPT apps, Claude connectors, Codex/Claude Code plugins on Cloudflare Workers). Use when creating a new MCP server or Worker with OAuth/DCR, forking an existing one, adding OAuth to a Worker, bumping workers-oauth-provider, or when ChatGPT/Claude connects fail with a 500 on /authorize. Covers the 90-day client-expiry default that took Nexus down, the regression test, the /authorize error page, and the docs/qa.md "check things" file.
---

# MCP server on workers-oauth-provider: day-one rules

## 1. Clients never expire

`@cloudflare/workers-oauth-provider` defaults `clientRegistrationTTL` to **90 days**
and writes every `client:<id>` to KV with that expiration. ChatGPT registers **one**
client per app and reuses it for every user. When it expires, every new connect
returns a 500 on `/authorize`, and token refresh for users who are already
connected fails too. Nothing in ChatGPT tells you. On 2026-11-07 this took Nexus to
zero signups for ~22h.

Always set it explicitly:

```ts
new OAuthProvider({
  // …
  clientRegistrationEndpoint: "/register",
  // Registered clients never expire. The 90-day default expires ChatGPT's one
  // shared client and breaks every new connect.
  clientRegistrationTTL: undefined,
});
```

The explicit `undefined` matters. Every version from 0.7 to 1.2 spreads your options
over its defaults (`{ clientRegistrationTTL: 90d, ...options }`), so an omitted key
gets the default and an explicit `undefined` wins. 1.2+ validates it ("must be
undefined (no expiry) or an integer"), and with `undefined` it writes the client with
no expiration and skips its half-life renewal.

## 2. A test that fails if the expiry comes back

Ship it in the same PR that adds OAuth. `templates/oauth-client-expiry.test.mjs`
registers a client through your real provider config against a fake KV and fails
if the `client:` put carries `expirationTtl`/`expiration`. The library imports
`cloudflare:workers`, so the template stubs it with a `node:module` resolve hook.
That hook also works under vitest, because vitest loads externalized deps through
Node's loader. On `@cloudflare/vitest-plugin`, skip the stub:
`SELF.fetch("/register")`, then `env.OAUTH_KV.list({ prefix: "client:" })`, and
expect `keys[0].expiration` to be undefined. Check that it fails without the line
before you trust it.

If the repo has a deploy script with gates (typecheck, tests), add it there.

## 3. `/authorize` answers a bad client with a 4xx, not a 500

`parseAuthRequest()` throws for an unknown `client_id` or an unregistered redirect.
If your handler doesn't catch it, the person gets Cloudflare's bare
`error code: 1101`. Catch it, `console.error` the client id, and return a 400 page.
Don't redirect (RFC 6749 4.1.2.1: the redirect isn't verified).

```ts
let parsed: AuthRequest;
try {
  parsed = await env.OAUTH_PROVIDER.parseAuthRequest(req);
} catch (error) {
  console.error("authorize rejected", url.searchParams.get("client_id"), (error as Error)?.message);
  return invalidRequestHtml(); // status 400, product's own error shell
}
```

The page copy is user-visible, so it needs Kushal's sign-off like any other UI.
Reuse wording he already approved: "Can't connect" / "This connection request
isn't valid. Go back to the app you were connecting and start over."

## 4. `docs/qa.md` from day one

Every product has a living QA file that agents run when Kushal says "check things",
and every bug that gets past it adds a row. Model: Nexus `docs/qa.md`. Start with:

| # | Step | How to check it for real | Pass |
|---|---|---|---|
| 1.1 | Taps **Connect** in ChatGPT | `node scripts/qa-oauth-clients.mjs` replays `/authorize` with every real ChatGPT `client:` id + its real redirect | 302/200 sign-in step, never 5xx |
| 1.2 | Client records stay alive | same script lists every `client:` key | no key has an `expiration` |
| 1.3 | Top-of-funnel is alive | consent-viewed / signups query, plus the script's 24h `/authorize` traffic by status | not 0; no 5xx |
| 1.4 | Opens a broken connect link | curl `/authorize` with `client_id=doesnotexist` | 4xx page |

Copy `templates/qa-oauth-clients.mjs` to `scripts/` and fill in `STORES` (label,
KV namespace id, host). It's read-only and uses `CLOUDFLARE_API_TOKEN` or the local
`wrangler login`. Add this to `AGENTS.md` (and `CLAUDE.md`, or a CLAUDE.md that
says `@AGENTS.md`):

```md
## QA

When Kushal says "check things", QA, or asks if everything works, run
`docs/qa.md` on prod: every row, the real client ids, the shipped build. Update
each row's **Last checked**. When a user-facing bug gets past it, add the row that
would have caught it in the same PR as the fix.
```

## 5. Proving it on the shipped build

Unit tests aren't enough. After deploying:

1. `curl -X POST https://<host>/register` a throwaway client
   (`{"redirect_uris":["https://chatgpt.com/connector/oauth/qa-expiry-probe"],"token_endpoint_auth_method":"none","client_name":"QA expiry probe (delete me)"}`).
2. List `client:<that id>` through the Cloudflare KV API. The key must have no
   `expiration`.
3. Delete that key.
4. Run `scripts/qa-oauth-clients.mjs`.

If a client record is ever lost, Cloudflare GraphQL
`httpRequestsAdaptive { clientRequestQuery }` keeps past `/authorize` query strings,
which is how the ChatGPT redirect URI was recovered.
