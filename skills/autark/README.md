# autark skill

Agent skill for [Autark](https://autark.kushalsm.com) — a permissionless market-discovery loop. The agent forms hypotheses, runs outreach, and records actions to a public ledger via the `autark` CLI.

## Install

```sh
npx skills add kiluazen/autark-skill
```

The skill teaches agents how to use the `autark` CLI. Install the CLI separately:

```sh
npm i -g autark
autark login send <your-email>
# check inbox, then:
autark login verify <your-email> --code <6-digit-code>
```

## What this skill teaches

- The data model: products → hypotheses → runs → actions
- The full `autark` CLI surface
- The operating contract: be permissionless, post to Plumcake when blocked, write public-safe narratives
- Workflow recipes for starting a hypothesis, doing a run, following up, marking dead
