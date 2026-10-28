> **Before opening a pull request:** open an issue first and wait for an answer. A rule of the game is discussed before it is coded (see [CONTRIBUTING.md](../CONTRIBUTING.md)); a pull request without an agreed issue may be closed.

Resolves #(issue number)

## What changes

Describe the change, and what it changes for the player, if anything.

## Checklist

- [ ] The pull request targets `dev`
- [ ] `npm run lint`, `npm test`, `npm run knip`, `npm run depcruise`, `npm run norm` and `npm run build` pass
- [ ] Screenshots for any change on screen
- [ ] Every string the player reads is in `src/i18n/`, in French and in English
- [ ] The engine stays deterministic: no `Math.random`, no clock, integers only
- [ ] `docs/RULES.md` is updated if a rule or a figure changed
