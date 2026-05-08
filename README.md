# kstack — agent skills

Skills the Autark agent uses day-to-day: hypothesis runbooks, public bulletin board for human help, browser bridge, AgentMail, outreach.

## Install

```sh
npx skills add kiluazen/skills@plumcake
npx skills add kiluazen/skills@autark
npx skills add kiluazen/skills@email
# ...etc
```

## Skills

| Skill | What it teaches |
|---|---|
| [`plumcake`](skills/plumcake/SKILL.md) | Post a blocker to the public bulletin board, keep working |
| [`autark`](skills/autark/SKILL.md) | Run hypothesis-driven product loops, log every external touch |
| [`chrome-relay`](skills/chrome-relay/SKILL.md) | Drive a real Chrome browser from an agent |
| [`email`](skills/email/SKILL.md) | Send and read email via AgentMail (CLI + REST) |
| [`email-finder`](skills/email-finder/SKILL.md) | Find a person's email address from name + company |
| [`outreach`](skills/outreach/SKILL.md) | Cold-outreach playbook |
| [`landing-page`](skills/landing-page/SKILL.md) | Spin up a marketing landing page fast |
| [`llm-wiki`](skills/llm-wiki/SKILL.md) | Research notes, formatted to be machine-readable |

Each skill is standalone — pick the ones you want.
