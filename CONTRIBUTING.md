# Contributing to Blason

Thank you for your interest. Blason is a small project with one maintainer;
contributions are welcome, from a typo to a rule.

## Before you start

- **Open an issue first** for anything larger than a fix, and wait for an
  answer: a rule of the game is discussed before it is coded, and a change
  that was not agreed on may not be merged.
- Read [the architecture](docs/ARCHITECTURE.md) and [the rules](docs/RULES.md).
- Blason is written from scratch. It is inspired by OpenFront, whose code may
  be read to understand an idea, but never copied.

## Getting started

```sh
git clone https://github.com/CedricLuccheseDev/blason.git
cd blason
npm install
npm run dev
```

Node.js 24 is required.

## Workflow

- `dev` is the integration branch: branch from it and open your pull request
  against it. `main` holds what is released and only moves by a release.
- Keep a pull request to one subject, and say in its description what changes
  for the player, if anything.
- Commit messages are one imperative line, prefixed with the branch:
  `dev: let a castle's land hold three times better`.

## The checks

Everything below runs in the CI and must stay green:

```sh
npm run lint        # TypeScript and ESLint
npm test            # Vitest, the rules and the determinism among them
npm run knip        # no dead file, export or dependency
npm run depcruise   # the architecture's dependency rules
npm run norm        # the house style
npm run build
```

`npm run format` formats the code with Prettier. For a change to the rules or
the bots, `npm run arena -- [games] [players]` plays whole games without a
screen and reports their length, the attacks and the end.

## Conventions

### Architecture: SOLID

- **One responsibility** per module, and its name says which. A rule lives in
  `engine/`, a drawing in `src/render/`, a word in `src/i18n/`, a figure of the
  rules in `engine/rules.ts`.
- **Extend by adding** to a table (`RULES`, the armies, the works, the HUD's
  tokens), not by adding branches to working code.
- **The same contract for whoever plays**: an `Order`, whether from a person
  or a bot.
- **Narrow interfaces**: pass what is used, not the whole state.
- **Dependencies point to the engine**, and outside `engine/` only
  `engine/index.ts` is imported.

### The engine stays deterministic

Code in `engine/` must compute the same thing on every machine:

- no `Math.random`: draw with `drawInt(seed, ...keys)`;
- integers only: men and gold are in thousandths (`UNIT`); no `Math.sqrt`,
  `Math.sin` or `**` (use `isqrt` and friends in `engine/numbers.ts`);
- never the clock: time is the tick;
- no import of React, PixiJS, Convex or a browser API.

`engine/purity.test.ts` and the determinism test enforce this.

### Code

- TypeScript strict; Prettier (no semicolons, single quotes, trailing commas).
- Files stay under 200 lines: split a module rather than grow it.
- Comments are in English and explain why, in plain sentences; a module opens
  with what it is for.
- Names say what things are in the game's own words: a lord, a land, a host, a
  work.

### Interface

- Every piece of the HUD is built from the design system in
  `src/components/hud/`: its words by their level (`Text.tsx`), its spaces
  by what they part (`Layout.tsx`), the sheet, the button. No size, colour or
  spacing of its own: `npm run norm` refuses a spacing or a type size written
  in `src/components/game/` or `src/components/home/`.
- The art direction is a map inked on a manuscript: parchment, ink, gold and
  gules, Vollkorn for words and Alegreya Sans for figures (IM Fell English for
  the game's name alone), never a dark panel.
- Every string the player reads is in `src/i18n/`, in French and in English.
- Anything clickable is at least 44 pixels tall, keyboard focus stays visible,
  and colour never carries meaning alone.

## License

By contributing, you agree that your contribution is licensed under the
[GNU Affero General Public License v3.0](LICENSE), the project's license.
