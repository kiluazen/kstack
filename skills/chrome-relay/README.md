# chrome-relay skill

Agent skill for [Chrome Relay](https://www.npmjs.com/package/chrome-relay) — drives the user's real Chrome session through CDP (extension + native host) so agents can read pages, click, type, fill forms, press keys, and run JS without stealing focus.

## Install

```sh
npx skills add kiluazen/kstack@chrome-relay
```

The skill teaches agents how to use the `chrome-relay` CLI. Install the CLI separately:

```sh
pnpm add -g chrome-relay
chrome-relay install
chrome-relay doctor
```
