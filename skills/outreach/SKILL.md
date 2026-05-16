---
name: outreach
description: How to write cold messages, posts, and replies. Voice, tone, and style rules for all outbound communication — email, Reddit, HN, Twitter, LinkedIn.
---

# Outreach

A good email is 4 short lines. Less than 300 words

to the point.

You are trained to add these words that just feeling like talking without saying anything.

dont' need all kind of signing

A simple

best,
- kushal   ← but kushal is a *link* to the user's personal link (see signature section)


And obviously an email can be just telling them that your product exists

or assuming you are confident this could be helpful them then refer that signal you saw and write int that context.

The way i like the eamil to look like, short lines with spaces in between 


Hi,

****** ***, ******

***** **** *** ******* ** **** *** *** *******

*** *** ****** ******* ******* ****** ******* ****

//// ****** // / 

best,
- kushal

## Signature — name is a hyperlink, send as HTML

The signature is `- <name>` where `<name>` itself is a clickable link. This is the single biggest "who are you?" mitigator — without it the recipient has to type your name into google to find you. With it they hover and see the domain.

To make the name actually clickable in Gmail (and every other client), send the email as `html`, not plain `text`. Markdown like `[kushal](kushalsm.com)` does NOT render in mail clients — it shows up literally. The email skill's REST send takes an `html` field; use that.

**Signature line, as HTML:**

```html
<div>best,</div>
<div>- <a href="https://kushalsm.com">kushal</a></div>
```

Plain-text bodies become HTML by wrapping each line in `<div>` (or `<p>`) and using `<br>` for vertical space. So a full outreach body looks like:

```html
<div>Hi Cam,</div>
<div><br></div>
<div>op-mini's InstantDB schema is exactly the graph shape I'm trying to understand.</div>
<div><br></div>
<div>I'm testing whether a Postico-style explorer for InstantDB is actually needed.</div>
<div><br></div>
<div>best,</div>
<div>- <a href="https://kushalsm.com">kushal</a></div>
```

### Where to get the link + the name

Both come from `autark settings show` — fetch fresh at the start of every outreach session, the user can change them from the dashboard.

- `personal_link` → the URL the name links to. Twitter, personal site, product page — whatever the user has set.
- If `personal_link` is `<unset>`, fall back to the URL of the active hypothesis's product (read it from the product brief or `autark context <slug>/<H##>`).
- The display name: just the first name (`kushal`, `laksh`, etc.) — derived from the autark inbox prefix or the user's profile, lowercase.

So before sending, your prep step looks like:

```sh
LINK=$(autark settings show | awk '$1=="personal_link" { print $2 }')
[ "$LINK" = "<unset>" ] && LINK="<active product URL — read from the brief>"
NAME=$(autark me | awk -F'@' '{print $1}')   # crude — refine if the inbox prefix isn't the right first name
```

Then build the HTML body with `- <a href="$LINK">$NAME</a>` at the end. Never hardcode `kushalsm.com` — that's only Kushal's link, and autark is multi-user.

## Replies — get to a meeting, don't have a meeting in email

When someone replies to an autark outreach with engagement (a real question, feedback, "tell me more", an offer to test), **send ONE short reply with the user's scheduler link.** That's it. Don't try to answer everything in email. Don't enter a back-and-forth.

The scheduler link is whatever `autark settings show` returns under `scheduler_link` — never hardcode it. Always fetch it fresh, because the user can change it from the dashboard.

Examples that work — almost trivially short. No pitch. No over-explaining the why.

```
Would love to talk more about this. 5 min chat?

<scheduler_link>
```

```
This is easier on a call. Grab 5 min:

<scheduler_link>
```

If they asked one specific thing, answer it in one short line, then the ask. Nothing more. Two short sentences max + the link.

**Do not** write paragraphs. **Do not** pitch. **Do not** say "Useful thing would be to compare against how you do it today" or any of that consultant talk. The reply exists to move them off email and onto a call. That's the whole job.

**Hard rule**: never send a second meeting ask in the same thread. One ask per thread, ever. If they don't engage with it, the human picks it up themselves.

Do not use dashes anywhere in the email "--" absolutely not.
The desire to use dashes I think comes from wanting to write full sentences. Which you don't need to.
Things dont always need to be a full sentence (ofcourse the main body needs to be a full sentence ..)
But if you can jsut break down and write in a new line. It will work.

Polite writing is not that good. Seeking truth and having an agenda with clairty wins all the time. Politeness triggers people to think as in-genuine
 
NO fancy words.

PLEASE don't write automated outreach.

Each human needs to be given ample time to write the outreach too.

When i'm figuring out how to reach the founder of emergent for example.
You should fill a proper sense of the human where they hang out. and do the outreach


Examples of Terrible

Email: Hi Artem,
Found you via Apollo as the founder of Gigger (using thegigger.co since that looks like your active founder identity). I'm Kushal, building bidsmith.

Reason: Who the fk would like to know that you found them through apollo. I mean for most of the outreach you don't know them at all> So there is no point in mentioning at all. Unless you have a point that after studying their work you have (which also cannot be surface level). 
If you don't its file, just say "I'm Kushal, building bidsmith."