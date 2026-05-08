---
name: email-finder
description: Find a real person's work email from minimal input (name, name+company, GitHub handle, LinkedIn URL, Twitter handle). Use before sending outbound — never guess-and-send. Covers the free path (GitHub commits, Google dorking, Gmail-compose profile-pic trick, permutator+verifier) and the paid path (Apollo, Hunter, Crustdata) with when to use each.
---

# email-finder

The output is one verified work email — not a list of guesses. Sending to a guess burns the address (bounces hurt the sender domain's reputation; agentmail SES isn't infinite). If you can't reach high confidence on the address, **don't send** — fall back to a different surface (LinkedIn DM, GitHub issue, Twitter @-mention) or skip the target.

The workflow is always: **find candidates → verify → send.** Skip the verify step and you're back to guessing.

## What input do you have?

The cheapest method depends on what you start with. Pick the highest row that fits:

| Input you have | Cheapest first move |
|---|---|
| GitHub handle | `git log --format="%ae" → unique` on a clone of any repo they push to (see Method 1) |
| LinkedIn profile URL | Crustdata `person/enrich?linkedin_profile_url=...` (Method 6) — single API call returns work email if available |
| Personal site / portfolio URL | `curl + grep -E '[A-Za-z0-9._-]+@[A-Za-z0-9.-]+'` for emails on the page itself or in the HTML source (often hidden but not encoded) |
| Conference/event speaker | The event's published speakers/program page often lists the email or the company; combine with Method 4 |
| Just a name + company | Permutator + verifier (Method 4); if company has 50+ employees, likely Apollo or Hunter is faster |
| Just a name | Stop. Find them somewhere first (LinkedIn, GitHub, Twitter, their company's team page). A name alone is too sparse. |

## Method 1 — GitHub commits (developers, ~70% hit rate)

Most engineers leave their real email in commit metadata. Even if their GitHub profile is empty.

```sh
# direct via the .patch URL — works on any public commit, no clone needed
curl -sL "https://github.com/<owner>/<repo>/commit/<sha>.patch" | head -5
# look for: From: First Last <user@domain.com>
```

Bulk: clone any repo they've pushed to and run

```sh
git log --all --format='%ae|%an' --author="<their-github-handle-or-name>" | sort -u
```

You'll typically see one of these patterns:
- `<id>+<handle>@users.noreply.github.com` — they enabled GitHub's email-privacy. Useless for outreach. Try a different repo (older repos often predate the privacy flag).
- `firstname.lastname@<corporate-domain>` — work email. Done.
- `firstname@gmail.com` / `handle@gmail.com` — personal email. Useful for solo founders / freelancers, less useful if you want their work email at a company.

If you only have a GitHub handle and want a fast scan: GitHub's events API (`https://api.github.com/users/<handle>/events/public`) plus a one-liner over their last 30 push events can surface a hit without cloning anything.

## Method 2 — Gmail compose profile-pic check (the Kushal trick)

Gmail Compose shows a Google profile photo + name auto-filled when you type a Gmail address that resolves to an active Google account. **It will not show one for a wrong/inactive address.** This is the cheapest "is this email real?" check that exists, and Google doesn't rate-limit it for a few lookups.

How to use:
1. Open `mail.google.com` → Compose.
2. Type the candidate address into the To: field.
3. Wait ~1s. If a profile pic + name appears next to the chip, the address is a live Google-managed mailbox.

Caveats:
- Only works for addresses on Gmail or on Google Workspace domains (i.e. companies hosted on Google's mail backend — most startups). For Microsoft 365 mailboxes (most enterprises), no profile pic, but the address can still be valid — fall back to Method 7.
- A profile pic doesn't prove *this person* owns the address — it proves the mailbox is real and tied to a Google account. Cross-check the displayed name matches the target.
- Best for famous / public people whose Google profiles include a photo. For nobodies, the default avatar still appears for valid addresses; treat it as a "positive but weak" signal.
- Some Workspace admins disable profile-pic display tenant-wide — if you get nothing for a senior exec at a known Workspace shop, the trick lied to you, not the address.

This is what to use when you have **one** candidate and want a 30-second sanity check. Don't run permutators through this manually — too slow.

## Method 3 — Google / DuckDuckGo dorking

Free, no signup. Two queries that work disproportionately well:

```
"firstname lastname" "@<domain>"
site:<domain> "<firstname>" "email"
```

DuckDuckGo handles the literal `@` better than Google does. Try both.

Surface targets: speaker bios, press releases, university directories, conference programs, GitHub Pages bios, leaked corporate decks indexed by Google, About-page mailto: links that the company forgot to obfuscate.

## Method 4 — Permutator + verifier combo (free path)

When the target's email isn't on the public web, generate every plausible variant for `<firstname> <lastname> @ <domain>` and verify each.

Common patterns (covers ~85% of corporate emails):
```
firstname.lastname@   firstinitial.lastname@   firstname@
firstname_lastname@   flastname@               lastname.firstname@
firstinitiallastname@ firstnamelastname@       lastname@
```

For most B2B targets, only 4 patterns matter: `firstname.lastname@`, `firstname@`, `flastname@`, `firstnamelastname@`. Generate those four first.

Free permutator: [Mailmeteor](https://mailmeteor.com/email-permutator) (web) or `mariosantella/gmail_permutator` (open source).

Free verifier: [Reacher](https://reacher.email/) (open source, runs the full SMTP handshake; can self-host) or [Hunter's verifier](https://hunter.io/email-verifier) (web, 25/month free).

Always verify before sending. A "deliverable=true" result from a real SMTP-handshake verifier is high-confidence; a "risky" or "catch-all" result means the company accepts mail to anything@domain — verifier can't help, you'd be guessing.

## Method 5 — Apollo / Hunter / RocketReach (paid path)

When you're sourcing >5 people at a time or hitting catch-all domains, pay.

| Tool | Best for | Free tier | Pricing |
|---|---|---|---|
| Apollo.io | Bulk discovery + sequencing in one tab; LinkedIn Chrome extension | 50 emails/month free | $59/mo |
| Hunter.io | API-first, best for programmatic verify | 25 searches + 50 verifications/month | $34/mo |
| RocketReach | Founders + execs; finds personal/direct dials others miss | 5 lookups/month | $39/mo |
| Clearbit Connect | Inline in Gmail; smoothest "find while you're emailing" UX | Free tier limited | bundled with HubSpot |

Default: **Apollo for volume + Hunter for verification** is the standard SDR stack. Use only one if budget is one tool.

For an autark-style run sourcing 7-10 emails per cohort, Hunter's free tier alone is enough. For cohorts above 25, get Apollo.

## Method 6 — Crustdata (developer-API path)

For agent code that needs to enrich on the fly: Crustdata's people API takes a LinkedIn URL, name+company, or even a name+social-handle and returns work email + employment history + skills. Real-time crawl rather than monthly snapshot, so the data is fresher than Apollo.

```sh
curl 'https://api.crustdata.com/screener/person/enrich?linkedin_profile_url=https://www.linkedin.com/in/<handle>/' \
  --header "Authorization: Token $CRUSTDATA_TOKEN"
```

Best when: agent has a LinkedIn URL and wants one programmatic call. Worst when: target has no LinkedIn or you only have a name (ambiguous matches).

## Method 7 — Catch-all / corporate domains (when verification is "risky")

Some companies (most enterprise; many Google Workspace setups) accept mail at `anything@domain.com` and bounce it later via internal rules. Verifier returns `risky` or `catch-all=true`. You can't verify by SMTP handshake.

Fallbacks in order:
1. **Find a public posting from the same person on the same domain.** GitHub commits (Method 1), conference talks, mailing-list archives. If they used `firstname.lastname@domain.com` once publicly, that's the format the company uses.
2. **Google the domain itself.** `site:<domain> "firstname.lastname"` — if the company publishes any team page, the format is usually consistent across employees.
3. **LinkedIn DM the person and ask.** Direct ask response rate is ~40% per Overloop data. Cheaper than guessing wrong.
4. **Company contact form / press@domain.** Skip the individual entirely. Lower hit rate but zero domain-reputation cost.

## Method 8 — Other surfaces worth knowing

- **GitHub Pages / personal portfolio site footer.** ~25% of solo developers list their email there. `curl <site> | grep '@'`.
- **Twitter/X bio + pinned tweet.** Some founders publish their email in bio.
- **YouTube channel "About" tab.** Public-creator standard.
- **Slack/Discord community profile.** Many members put their email in profile fields. Useful in indie-hacker communities like Indie Hackers, MFM, Build in Public.
- **Newsletter footer.** Subscribe to their newsletter, check the From header — solopreneurs often send from their personal email.
- **WHOIS records.** For domain registrants who didn't set privacy. `whois <domain>` from the terminal.
- **Conference speaker pages.** When the target speaks at a real event, their bio page often includes contact.

## Verification — non-negotiable before sending

Even if you found the email on the company's About page, verify before sending. Bounces hurt sender reputation cumulatively across runs.

```sh
# Reacher self-hosted endpoint (or any SMTP-verifying API)
curl -sX POST https://api.reacher.email/v0/check_email \
  -H "Content-Type: application/json" \
  -d '{"to_email":"target@domain.com"}' | jq '.is_reachable'
# expected: "safe" or "risky" (catch-all) or "invalid"
```

A `safe` verdict + a separate "looks like the right person at the right company" sanity check (Method 2 Gmail trick is good for this) is the bar.

## When NOT to bother

- The target gates email at scale (Patrick McKenzie's `kalzumeus.com/standing-invitation/` is the rare exception that publishes it). For these, find a different surface — Twitter, blog comments, conference Q&A.
- The cohort is >50 people. Either pay for an Apollo plan or pick a different cohort source where emails are public-by-default (GitHub bios, conference programs, HN "Who is hiring?").
- The address is `info@`, `hello@`, `team@`, `contact@`, `support@`, `press@`. These hit shared inboxes and rarely reach the actual person — even when delivered. If you must email, address it to a named person in the body.
- The target has no public web presence at all. They're not your customer for an outbound motion; they're a referral/intro target.

## Common failure modes

1. **Sent to a guess, got a bounce, didn't verify.** Don't. The 30 seconds Method 7 takes is cheaper than any reply.
2. **Found a personal Gmail and used it for B2B outreach.** Most people ignore B2B at their personal address. Get the work email, even if harder.
3. **Permutator + verifier on a catch-all domain.** Wasted credits — every variant verifies as `risky`. Fall back to Method 7.
4. **Used the wrong domain.** A target's LinkedIn says they're "at Acme" but their actual mail goes through `acme-inc.com` or `getacme.com`. Always cross-check by visiting the company's site and looking at the contact / job-listing email.
5. **Trusting a single source.** Apollo's data is sometimes 6+ months stale. If the person changed jobs and Apollo missed it, you'll send to their old work address. Cross-check the company against their LinkedIn current role.

## TL;DR decision tree

```
have GitHub handle?         → Method 1 (commits)
have LinkedIn URL?          → Method 6 (Crustdata) or Method 5 (Apollo)
have personal site/portfolio? → grep the page (free)
have name + company only?   → Method 4 (permutator + verifier)
verifier returns "risky"?   → Method 7 (find a public same-domain example)
have one candidate to sanity-check? → Method 2 (Gmail compose trick)
sourcing >25 targets?       → Method 5 (Apollo paid)
target gates email?         → Different surface, not email
```
