---
name: landing-page
description: 'Build solo-product landing pages the way Kushal builds them — confident, sparse, no SaaS theater. Use whenever the task involves designing or writing a new landing page, redesigning an existing one, or critiquing one. Captures the lessons from autark / chrome-relay / tteg / bidsmith iterations: what to put in the hero, what NOT to put anywhere, palette + type defaults, and the section template. NOT a generic "landing page best practices" doc — this is opinionated for pre-revenue indie products that have no logos to flex and no users to quote.'
---

# Landing Page

The landing page is the hardest visual artifact for a pre-revenue product because it has to look confident without lying. Every SaaS template fights you on this — they're built to dress up a product as if it has 10K users. You don't. Don't pretend you do.

## The two failure modes

**Mode 1: SaaS theater.**
Customer logos you don't have. "Trusted by 10,000+" when there are 3. Countdown timers. "Be the first to" buttons. Pricing tiers for a product that doesn't ship. FAQ sections nobody asked for. Quote carousels with stock-photo founders. Multiple CTAs fighting for the click.

When you see this on someone's landing it shows they don't know what they're doing — they're papering over the fact that the product is unproven by stuffing the page with credibility theater.

**Mode 2: too much explanation.**
Three paragraphs in the hero. Five "key benefits" with icons. A 6-step "how it works" section. A 12-row feature comparison table. Eyebrow text + headline + sub-headline + lede + bullet list + two CTAs all in the hero. A 6-stat row.

When the design is working, you don't have to explain. The visual should land before the words. If you find yourself writing more, your hero visual is weak — fix that, not the copy.

## The shape that works

Asymmetric hero, two-column on desktop, one column on mobile.

- **Left:** wordmark logo (top), display headline (1 line, max 2), 3-bullet proof list, inline email form. That's it.
- **Right:** a literal visual demonstration of the product — what it produces, or what it replaces. Not an abstract illustration. A concrete UI mockup, a code window, a "before / after" pair, the thing the user will actually see.

Below the hero: TWO sections, max. Not three, not four.

1. **The "why this works" section** — one sentence headline, one paragraph, ONE artifact: usually a versus-table (3 rows max) contrasting "the usual way" with "your way." This is where you punch incumbents without naming them.
2. **The "how it works" section** — one sentence headline, one paragraph, 4 numbered steps. Three sentences max per step. End there.

Footer: one line. Maybe two. Personal site link, contact email if you must. No nav, no sitemap.

That's the whole page. ~600 words of copy total. Most pre-revenue landings have 3,000.

## What goes in the hero (and what doesn't)

**In:**
- Brand mark + wordmark (custom, with personality — see "Brand mark" below)
- Display headline that does wordplay or contrast — strike-through, em-dashed contrast, antithesis. Not a value-prop sentence.
- 3-bullet proof list using the smallest concrete unit you can ("10-20 min agent run", not "fast turnaround")
- Inline email form: input + button, that's it
- One micro-line under the form (no CC, who it's for, picking criteria — pick ONE)

**Out:**
- Eyebrow tags ("FOR UPWORK PROS · EARLY ACCESS") — they age the page in 2 weeks
- Sub-headlines (your headline + lede already do too much)
- Two CTAs (one primary kills the secondary every time)
- "Trusted by" / customer logos / "as seen on" rows
- Press strips, GitHub star counts, ProductHunt badges (unless they're current and impressive)

## Headline pattern

Use one of these. Pick by feel, not by formula:

1. **Strike-through wordplay** — "Send the work, not the ~~promise~~." (bidsmith)
2. **Antithesis with cross-out** — "AI cover letters don't win. **The actual work** does."
3. **Concrete > abstract** — "Local browser control for coding agents." (chrome-relay)
4. **One verb + object** — "Find customers for your product." (autark)

Avoid: "The fastest way to ___." "AI-powered ___." "Build ___ 10x faster." Three-word benefit-stacked headlines. Anything that could be on 50 other pages with the noun swapped.

Display font: **Fraunces** at weight 800-900, opsz on, letter-spacing -0.025em. A serif with a glyph that has bite is correct. Geist / Inter at the heading is the SaaS-template tell.

## Proof list, not feature bullets

The 3-bullet proof list under the headline is the ONE place to be specific. No marketing words, just the actual unit of work the product does.

```
✓ Job post
✓ 10-20 min agent run
✓ Finished artifact attached
```

Not:

```
✗ Save hours every week
✗ AI-powered automation
✗ Built for modern teams
```

If you can't write 3 lines of this where each line is a literal noun the product manipulates, your hypothesis isn't sharp enough. Fix that before fixing the page.

## The hero visual

**This is the page.** A weak hero visual cannot be saved by stronger copy. A strong hero visual carries the page even if the copy is terse.

Pick one of these patterns:

- **Demonstration mockup** — show the literal output. bidsmith shows a proposal inbox with one card highlighted. tteg could show a stock photo replacing a placeholder block. chrome-relay shows a CLI command and the browser response.
- **Before/after split** — hard to do well, but powerful when it is. Two windows side by side with the same input → different output.
- **Live element** — animated CSS, not video. A pulse, a typing cursor, a card sliding in. Do not autoplay video — it's heavy and can't be SSR'd.

Build it in CSS, not in Figma export. The page should be one HTML file with no build step (or just static + tailwind if needed). No Next.js, no React, no SSG framework. The page weighs <30KB and loads in <100ms over decent wifi.

## Palette: warm paper

Don't use the SaaS dark-mode-by-default palette. Don't use pure white. Use a warm paper:

```css
--paper:    #f3ecda; /* page background */
--paper-2:  #ebe2c9; /* slightly deeper, for nested cards */
--ink:      #14110d; /* text, dark elements */
--ink-soft: #2c2820; /* body text */
--muted:    #6b6452; /* secondary text */
--muted-2:  #9a937f; /* tertiary, placeholders */
--line:     #d4ccb6; /* borders */
--panel:    #fffcf2; /* cards, the "lit" surface */
--accent:   #b8431e; /* one accent — terracotta-orange / brick-red */
--accent-2: #d96a3e; /* hover, secondary accent */
--accent-soft: #f4dccc; /* accent backgrounds, chip fills */
```

Plus subtle radial gradients on the body to add warmth without doing anything visible:

```css
body {
  background-image:
    radial-gradient(ellipse 1200px 600px at 80% -10%, rgba(184, 67, 30, 0.10), transparent 60%),
    radial-gradient(ellipse 1000px 500px at -10% 30%, rgba(200, 154, 58, 0.10), transparent 60%);
  background-attachment: fixed;
}
```

If the product needs a different mood, shift the accent (chrome-relay used a green) but keep the paper. The paper background is the through-line across all the kushalsm.com landings — it makes them feel like one author's portfolio without looking copy-pasted.

## Type stack

Three fonts. No more.

- **Fraunces** — display headlines, section h2s, brand wordmark. Weight 800-900, opsz active, tight tracking.
- **Inter** — body, UI, buttons. 400-700.
- **JetBrains Mono** — kickers ("WHY THIS WORKS"), chips, code, timestamps, anything that should feel system-y.

A serif body font (Fraunces 400) inside `.quote` blocks works for italic pull-quotes. Don't use it for paragraphs.

## Brand mark

The "letter in a black square" pattern is the SaaS-template tell. Spend 20 minutes drawing a real glyph in inline SVG. Should:

- Be 1-2 simple shapes that read at 24px
- Pun on the name (bidsmith → anvil + spark; chrome-relay → relay baton; tteg → speech-bubble or photo frame)
- Use the accent color for one element only — the rest is ink

Inline SVG, not a PNG, not an icon-font. The mark should weight ~1KB.

## Sections below the hero

**The "why this works" section.** Headline is one sentence stating the principle. Paragraph is 2-3 sentences. Then a vs-table:

```
| THE USUAL WAY                | YOUR WAY                      |
|------------------------------|-------------------------------|
| What everyone does           | What you do                   |
| The next failure mode        | How you sidestep it           |
| The wrong incentive          | The right one                 |
```

3 rows. Punchy. Right column gets a tinted background (rgba accent at 4%), strong words bolded in accent color.

**The "how it works" section.** Headline. Paragraph. 4 numbered steps. Each step:

```
01.   Read the post
      Brief. Constraints. What proof would make the client believe.
```

Numerals in Fraunces 32px. Body 13px muted. Three sentences max.

That's it. Two sections. Both done.

## Things that look like sections but aren't

- "Pricing" — no pricing pre-revenue. Just an email form.
- "FAQ" — if you need an FAQ, the page is wrong.
- "Roadmap" — internal doc, not landing.
- "Testimonials" — if you have them, fold them into the hero. If you don't, don't fake them.
- "Integrations" — only if integrations ARE the product (chrome-relay arguably). Otherwise, footer.
- "Built with ___" — nobody cares. Footer at most.

## Email capture

In the hero, inline:

```html
<form class="contact-form">
  <div class="contact-row">
    <input type="email" placeholder="you@domain.com" required />
    <button class="btn accent">Send</button>
  </div>
  <div class="micro">For freelancers who already spend real money on connects.</div>
</form>
```

The micro-line under the form does ONE of these jobs (pick one):

- Filter (who it's for): "For freelancers who already spend real money on connects."
- Honesty (what won't happen): "No 'be the first' countdown. No CC. Picking on volume + niche fit."
- Status (where you are): "Closed beta · ~30 freelancers."

Backend: post to a Google Apps Script that appends to a sheet. Same script across all kushalsm.com landings (it routes by `product` field). No Tally / Formspree / ConvertKit — those add brand and CSP headaches.

## Deployment

Each landing is its own GitHub repo (`kiluazen/<product>-landing`) and its own Cloudflare Pages project. Custom domain `<product>.kushalsm.com` via CNAME to `<product>.pages.dev`, proxied. Same _headers file. Same favicon size. Same OG image template.

Redeploy:

```bash
cd <product>/landing
wrangler pages deploy public --project-name=<product> --branch=master --commit-dirty=true
git push
```

Wrangler's OAuth doesn't include DNS edit — for first-time setup the CNAME has to be added via the CF dashboard (or via chrome-relay driving the dashboard).

## The journey check

If you're working on a landing and feel the urge to add ANY of these, stop:

- Another section
- A second CTA above the email form
- Customer logos
- A trust strip
- A pricing section
- An FAQ
- More copy in the hero

Instead ask: "is the hero visual carrying the page?" If yes, ship. If no, fix that — not the copy.

## File template

A working starter is at `chrome-relay/landing/public/index.html` and `bidsmith/landing/public/index.html`. The bidsmith one is the more recent / more refined pattern (inline form in hero, no separate CTA section, only 2 below-the-fold sections). When starting a new product landing, copy bidsmith's structure and swap:

1. The brand SVG and wordmark
2. The headline (use one of the 4 patterns above)
3. The 3 proof bullets (concrete nouns the product manipulates)
4. The hero visual mockup (rebuild in CSS for THIS product)
5. The vs-table contents (3 rows, don't pad)
6. The 4-step flow contents (4 nouns, don't pad)
7. Filter line under the email form
8. The Apps Script `PRODUCT` constant in the inline `<script>`



My fav landing pages

- https://flask.do/