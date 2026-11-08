// Registered OAuth clients must never expire.
//
// workers-oauth-provider defaults clientRegistrationTTL to 90 days and writes
// every client:<id> to KV with that expiration. ChatGPT registers ONE client
// per app and reuses it for every user, so when it expires every new connect
// fails on /authorize (Nexus outage, 2026-11-07).
//
// Adapt the one import marked TODO so the test runs YOUR real provider config,
// then confirm it fails with `clientRegistrationTTL` removed.
// Run: node --test test/oauth-client-expiry.test.mjs
// (TypeScript sources: node --import tsx --test, or --experimental-strip-types.)
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

// The library imports `cloudflare:workers`, which only exists in workerd.
register("data:text/javascript," + encodeURIComponent(`
  export async function resolve(specifier, context, next) {
    if (specifier === "cloudflare:workers")
      return { url: "data:text/javascript,export class WorkerEntrypoint {}", shortCircuit: true };
    return next(specifier, context);
  }`));

test("a client registered through /register is stored without a KV expiration", async () => {
  // TODO: import the function (or default export) that builds your OAuthProvider.
  const { createOAuthProvider } = await import("../src/auth.ts");
  const unused = { fetch: () => new Response("unused") };
  const provider = createOAuthProvider(unused, unused);

  const puts = [];
  const kv = {
    async put(key, _value, options) { puts.push({ key, options }); },
    async get() { return null; },
    async delete() {},
    async list() { return { keys: [], list_complete: true }; },
  };
  const res = await provider.fetch(
    new Request("https://example.test/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        redirect_uris: ["https://chatgpt.com/connector_platform_oauth_redirect"],
        token_endpoint_auth_method: "none",
        client_name: "ChatGPT",
      }),
    }),
    { OAUTH_KV: kv },
    { waitUntil() {}, passThroughOnException() {}, props: {} },
  );
  const text = await res.text();
  assert.equal(res.status, 201, text);
  const clientPut = puts.find((p) => p.key.startsWith("client:"));
  assert.ok(clientPut, "register did not write a client: key");
  assert.equal(clientPut.options?.expirationTtl, undefined, "client: key was written with expirationTtl");
  assert.equal(clientPut.options?.expiration, undefined, "client: key was written with expiration");
  assert.ok(!JSON.parse(text).client_secret_expires_at, "registration response advertises an expiry");
});
