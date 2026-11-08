#!/usr/bin/env node
// QA rows "connect", "client keys never expire" and "/authorize traffic"
// (docs/qa.md).
//
// Lists every `client:` key in the OAuth KV, fails if any carries an
// expiration, then replays /authorize for every client ChatGPT registered
// (its real client id + its real redirect) and fails unless the host answers
// with the sign-in step. Last, it prints the real /authorize traffic of the
// past 24h by status (Cloudflare analytics, this script's own requests
// excluded): any 5xx there means people are failing to connect right now.
// Read-only: never writes KV.
//
// Auth: CLOUDFLARE_API_TOKEN (Workers KV Storage: Read) if set, else the
// local `wrangler login` token.
//
//   node scripts/qa-oauth-clients.mjs
import { readFileSync } from "node:fs";
import { homedir } from "node:os";

const ACCOUNT = "<cloudflare-account-id>";
// [label, KV namespace id, host whose /authorize serves those clients]
const STORES = [
  ["<Product> (worker <name>)", "<kv-namespace-id>", "<host>"],
];
// The sign-in step: 302 to our consent page, or the consent page itself.
const OK_STATUS = new Set([200, 302]);
const PKCE = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";
const UA = "qa-oauth-clients";
// Zone id per apex domain, for the /authorize traffic report.
const ZONES = { "<example.com>": "<zone-id>" };

function token() {
  if (process.env.CLOUDFLARE_API_TOKEN) return process.env.CLOUDFLARE_API_TOKEN;
  for (const p of [`${homedir()}/.wrangler/config/default.toml`, `${homedir()}/Library/Preferences/.wrangler/config/default.toml`]) {
    try { const m = readFileSync(p, "utf8").match(/oauth_token = "([^"]+)"/); if (m) return m[1]; } catch {}
  }
  throw new Error("set CLOUDFLARE_API_TOKEN or run `npx wrangler login`");
}
const TOKEN = token();
async function cf(path, raw = false) {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}${path}`, { headers: { authorization: `Bearer ${TOKEN}` } });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status} ${await res.text()}`);
  return raw ? res.text() : res.json();
}

let failed = false;
for (const [label, ns, host] of STORES) {
  const keys = [];
  let cursor = "";
  do {
    const page = await cf(`/storage/kv/namespaces/${ns}/keys?prefix=client:&limit=1000${cursor ? `&cursor=${cursor}` : ""}`);
    keys.push(...page.result);
    cursor = page.result_info?.cursor;
  } while (cursor);

  const expiring = keys.filter((k) => k.expiration);
  console.log(`\n${label}: ${keys.length} client keys, ${expiring.length} with an expiration`);
  for (const k of expiring) { failed = true; console.log(`  FAIL ${k.name} expires ${new Date(k.expiration * 1000).toISOString()}`); }

  const records = [];
  for (let i = 0; i < keys.length; i += 25) {
    records.push(...await Promise.all(keys.slice(i, i + 25).map(async (k) => JSON.parse(await cf(`/storage/kv/namespaces/${ns}/values/${encodeURIComponent(k.name)}`, true)))));
  }
  const chatgpt = records
    .map((c) => ({ c, redirect: (c.redirectUris || []).find((u) => u.startsWith("https://chatgpt.com/")) }))
    .filter((x) => x.redirect);
  if (!chatgpt.length) console.log("  no ChatGPT clients registered");
  for (const { c, redirect } of chatgpt) {
    const url = `https://${host}/authorize?response_type=code&client_id=${encodeURIComponent(c.clientId)}`
      + `&redirect_uri=${encodeURIComponent(redirect)}&code_challenge=${PKCE}&code_challenge_method=S256&state=qa`;
    const res = await fetch(url, { redirect: "manual", headers: { "user-agent": UA } });
    const pass = OK_STATUS.has(res.status);
    if (!pass) failed = true;
    const registered = c.registrationDate ? new Date(c.registrationDate * 1000).toISOString().slice(0, 10) : "?";
    console.log(`  ${pass ? "ok  " : "FAIL"} ${res.status} ${c.clientId} (${c.clientName ?? "?"}, registered ${registered}) ${redirect}`);
  }
}
// Real /authorize traffic, last 24h. Report only: a quiet day is not a failure,
// but any 5xx is.
const since = new Date(Date.now() - 86400_000).toISOString();
for (const host of [...new Set(STORES.map(([, , h]) => h))]) {
  const zone = Object.entries(ZONES).find(([d]) => host.endsWith(d))?.[1];
  const res = await fetch("https://api.cloudflare.com/client/v4/graphql", {
    method: "POST",
    headers: { authorization: `Bearer ${TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify({
      query: `query($z:String!,$s:Time!,$h:String!){viewer{zones(filter:{zoneTag:$z}){httpRequestsAdaptiveGroups(limit:20,filter:{datetime_geq:$s,clientRequestHTTPHost:$h,clientRequestPath:"/authorize",userAgent_notlike:"%${UA}%"}){count dimensions{edgeResponseStatus}}}}}`,
      variables: { z: zone, s: since, h: host },
    }),
  }).then((r) => r.json());
  const groups = res.data?.viewer?.zones?.[0]?.httpRequestsAdaptiveGroups;
  if (!groups) { console.log(`\n${host} /authorize, last 24h: analytics unavailable (${JSON.stringify(res.errors)})`); continue; }
  const byStatus = groups.map((g) => `${g.dimensions.edgeResponseStatus}×${g.count}`).join(" ") || "no requests";
  const errors = groups.filter((g) => g.dimensions.edgeResponseStatus >= 500).reduce((n, g) => n + g.count, 0);
  if (errors) failed = true;
  console.log(`\n${host} /authorize, last 24h (real traffic): ${byStatus}${errors ? `  FAIL: ${errors} server errors` : ""}`);
}

console.log(failed ? "\nFAIL" : "\nok");
process.exit(failed ? 1 : 0);
