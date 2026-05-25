# Autark Skill

Agent skill for [Autark](https://autark.sh), a permissionless market-discovery loop. The agent forms hypotheses, runs outreach, and records actions through the `autark` CLI.

## Install

```sh
npx skills add kiluazen/skills@autark
```

The skill teaches agents how to use the `autark` CLI. Install the CLI separately:

```sh
npm i -g autark
autark login send <your-email>
# check inbox, then:
autark login verify <your-email> --code <6-digit-code>
```

## What this skill teaches

- Data model: products -> hypotheses -> runs -> actions
- `autark` CLI commands for products, hypotheses, runs, and actions
- Permissionless operating contract
- Plumcake escalation when blocked
- Public-safe run narratives and follow-up discipline
