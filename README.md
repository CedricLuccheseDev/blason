# Blason

Blason is a medieval real-time strategy game played in the browser. Twenty
lords share a land drawn anew for each game and take it from one another tile
by tile: peasants hold the land and march out as armies, gold builds, alliances
are short and traitors are marked for all to see. The whole map is drawn in
ink on a manuscript.

It is inspired by [OpenFront](https://openfront.io) and written from scratch.

[![CI](https://github.com/CedricLuccheseDev/blason/actions/workflows/ci.yml/badge.svg)](https://github.com/CedricLuccheseDev/blason/actions/workflows/ci.yml)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

## Features

- **A new land each game**: coasts, lakes, rivers and names, all grown from a
  single seed.
- **Land taken tile by tile** from the point you click, at a pace you can see
  and answer.
- **Peasants and gold**: your villages feed peasants who hold your land and
  whom you raise in three armies (a raid, a host, the whole levy); your
  merchants bring the gold that pays for the works.
- **Armies that march and battles you can watch**: an army is levied at a
  village, walks to the front over your land, and fights the enemy army that
  comes to meet it.
- **Three works**: villages feed the peasants and levy the armies, markets
  send the merchants, castles make their land fight one for one; the first
  village and market are free, so a lord can always start again.
- **Diplomacy**: alliances of five minutes, renewed or left to lapse; a lord
  who breaks one bears the traitor's mark.
- **Nineteen bots** that read the same state and send the same orders as you.
- **A deterministic simulation**, the same on every machine, ready for
  lockstep multiplayer.

The game is playable alone against the bots. Multiplayer, a small relay server
in lockstep as in OpenFront, comes next.

## Prerequisites

- [Node.js](https://nodejs.org/) 24
- npm
- A modern browser with WebGL

## Getting started

```sh
git clone https://github.com/CedricLuccheseDev/blason.git
cd blason
npm install
npm run dev
```

Then open the address `npm run dev` prints: the home offers the next public
game, a solo game against nineteen bots, and private rooms, a game of bots
playing behind. Online play needs the relay beside it (`npm run relay`).

## Commands

| Command                                             | What it does                                                 |
| --------------------------------------------------- | ------------------------------------------------------------ |
| `npm run dev`                                       | The game with live reloading                                 |
| `npm run build`                                     | The production build, then a type check                      |
| `npm start`                                         | Serves the production build                                  |
| `npm test`                                          | The tests (Vitest), among them the rules and determinism     |
| `npm run lint`                                      | TypeScript and ESLint                                        |
| `npm run knip`                                      | Dead files, exports and dependencies                         |
| `npm run depcruise`                                 | The architecture's dependency rules                          |
| `npm run norm`                                      | The house style checks (`scripts/norm-check.mjs`)            |
| `npm run format`                                    | Prettier                                                     |
| `npm run arena -- [games] [players] [level] [size]` | Whole games of bots, without a screen, and what they measure |

## Project structure

- `engine/`: the simulation, pure and deterministic TypeScript; its public
  contract is `engine/index.ts`
  - `engine/map/`: the map generator
  - `engine/bots/`: the bots
- `src/routes/`: the pages: the home (`/`), the game (`/play`), the journal
  (`/blog`)
- `src/render/`: the map on screen (PixiJS) and the player's gestures
- `src/components/hud/`: the HUD's design system
- `src/components/game/`: the game's HUD, built on it
- `src/components/home/`: the home: the next public game, the solo game, the
  private rooms, the journal, the bots' game behind
- `src/i18n/`: French and English
- `src/content/`: the journal's posts
- `scripts/`: the arena and the style checks
- `design/mockups/`: the sources of the design boards
- `docs/`: the architecture and the rules

## Documentation

- [Architecture](docs/ARCHITECTURE.md): how the simulation, the rendering and
  the HUD fit together, and why.
- [Rules](docs/RULES.md): the game as it plays today, with its numbers.
- [Contributing](CONTRIBUTING.md): the workflow, the checks and the
  conventions.

## License

Blason is free software under the
[GNU Affero General Public License v3.0](LICENSE): whoever runs a modified
version of it on a server must offer its source to the players.
