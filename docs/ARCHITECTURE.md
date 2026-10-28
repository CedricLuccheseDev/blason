# Architecture

Blason is split in three, and every dependency points one way, towards the
simulation:

```
src/routes, src/components   the pages and the HUD (React)
        |
   src/render                the map on screen (PixiJS), the session, the gestures
        |
   engine/index.ts           the engine's contract
        |
   engine/                   the simulation: pure, deterministic TypeScript
```

The engine depends on nothing. The rendering and the interface depend on the
engine through `engine/index.ts` alone, never on its insides. Both rules are
checked by dependency-cruiser (`.dependency-cruiser.cjs`) in the CI.

## The engine

`engine/` is the game: its state, its rules and the step that moves it. It is
plain TypeScript with no dependency on React, PixiJS, the DOM or a server, so
that the same code runs in every browser and, later, on the game server.

It is **deterministic**: given the same seed and the same orders, every
machine computes the same game, tick for tick.

- Every draw of chance comes from the seed (`drawInt` in `engine/numbers.ts`),
  a pure function of the seed and its keys, so adding a draw somewhere never
  shifts the others.
- Every figure is an integer. Men and gold are counted in thousandths
  (`UNIT`), so a rate of half a man a second is still a whole number.
- The engine never reads the clock: it advances ten ticks a second
  (`TICKS_PER_SECOND`), whoever calls it.
- `engine/purity.test.ts` refuses in the engine anything that could differ from
  one machine to another (`Math.random`, `Math.sin`, `**`, the clock, React).
- `engine/war.test.ts` plays the same game twice and compares a fingerprint of
  the state (`stateHash`) at every tick.

### The state, the orders, the step

- `GameState` (`engine/types.ts`) holds the land (`owner`, the lord of each
  tile; `realm`, the free domain of each tile), the villages and works, the
  players (peasants, gold, traitor's mark), the armies on the march (`hosts`),
  the alliances and offers, the caravans, the tick and the winner.
- An `Order` is everything a player can do: choose where to start, attack a
  tile with one of the three armies, build a work, offer or accept an
  alliance, break it.
- `step(state, orders)` (`engine/step.ts`) applies the valid orders, then runs
  the rules of a tick in a fixed order: the peasants grow, the armies advance,
  the markets send caravans, the caravans move, alliances and offers expire,
  and the game is judged.

Every number of the rules lives in `RULES` (`engine/rules.ts`), so the arena
can tune them without touching the code. The rules themselves are described in
[RULES.md](RULES.md).

### The modules

| Module                   | Responsibility                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------ |
| `units.ts`, `numbers.ts` | The two units, integer arithmetic, seeded draws                                            |
| `map/`                   | The map generator: from a seed, the shape of the land, its coasts, lakes, rivers and names |
| `grid.ts`                | The land cut into tiles of four map units                                                  |
| `land.ts`                | The free domains, the start, the peasants                                                  |
| `muster.ts`              | Raising an army: the free barracks, its road to the front, where it stands                 |
| `war.ts`                 | Armies: their march, where they enter, how they spread, what each tile costs               |
| `battle.ts`              | Battles between armies that meet, by the combat table                                      |
| `heap.ts`                | The heap that orders the tiles an army strikes next                                        |
| `works.ts`               | Villages, markets, barracks and castles: where they may stand and their price              |
| `diplomacy.ts`           | Alliances, offers, renewals and traitors                                                   |
| `caravans.ts`            | The merchants' roads and what they pay                                                     |
| `step.ts`                | The tick, validation of orders, victory                                                    |
| `bots/`                  | The bots: `bot.ts` for war, works and expansion, `talk.ts` for diplomacy                   |

### The bots

A bot is a function of the state that returns orders (`createBot` in
`engine/bots/bot.ts`). It reads the same state as a player and sends the same
`Order`s, through the same validation: the simulation cannot tell a bot from a
person. Bots are pure and deterministic like the rest of the engine, so in
multiplayer they will run on every client without a server.

## The rendering

`src/render/` draws the game with PixiJS and turns the player's gestures into
orders. It decides nothing about the rules.

- `client.ts` mounts a game in a page element: the land (`ahead.ts` makes the
  next one while the home is read), the session, the scene, the camera, the
  input, and the handle the React screen drives.
- `session.ts` runs the simulation in the page: it collects the player's
  orders and the bots', and steps the state ten times a second.
- `scene.ts` stacks the layers: the page and its frame, the sea and its shore
  lines, the lands (`regions.ts`, traced around their tiles by `trace.ts` and
  inked with a trembling pen, `pen.ts`), the works (`marks.ts`, `art/`), the
  armies (`armies.ts`): where each one stands and faces (`fronts.ts`), its
  men kept from frame to frame and running to their places in a column or in
  ranks (`squads.ts`, drawn by `layers/troops.ts`), the peasants facing them,
  the dead (`layers/fallen.ts`), the warning of an army coming for the player
  and the seal of each battle (`layers/warning.ts`), the pill of their men
  (`layers/pill.ts`); the roads as they are drawn, straight and even
  (`roads.ts`); the barracks' seals (`layers/barracks.ts`), the caravans on
  their roads of beaten earth (`trade.ts`), what the player's works bring
  (`layers/tidings.ts`), the names (`places.ts`, `layers/labels.ts`), the aim
  (`layers/aim.ts`) and the parchment's grain (`layers/paper.ts`).
- `camera.ts` is the player's camera; `director.ts` is the spectator's, which
  goes to the fiercest fight on its own (the home's background).
- `summary.ts` reads from the state, once a second, the figures the HUD shows.

## The interface

The HUD is React, laid over the map. It is built on a small design system,
`src/components/hud/`, so that every piece shares the same measures:

- **tokens** (`tokens.ts`, and `src/styles/app.css` for the type and the
  shadow): four type sizes through four roles (`.hud-word`, `.hud-name`,
  `.hud-note`, `.hud-figure`), and spacing only on the steps 4, 8, 12, 16 and
  24 pixels;
- **one material**, the sheet of parchment (`Sheet.tsx`);
- **one button**, 44 pixels tall (`Act.tsx`);
- a figure with its icon (`Figure.tsx`), and the drawn objects at fixed sizes:
  shields, wax seals, gilt medallions, keys (`Emblem.tsx`);
- **one motion**: a single curve and two durations, through two roles,
  `.hud-press` on whatever is touched and `.hud-enter` on every sheet that
  appears; nothing moves under reduced motion;
- **a compact shape** on phones, upright or sideways (`useCompact.ts`).

The game's pieces (`src/components/game/`: the purse, the race, the bar, the
cartouche beside the pointer, the alliance letters) are built from these and
nothing else. The look follows the design boards, whose sources are in
`design/mockups/` and mirror the same tokens (`kit.py`).

## Multiplayer, next

The engine is built for lockstep, as in OpenFront: the server will run no
simulation. It will gather every player's orders for a turn, every 100
milliseconds, and send the turn to all; each browser applies it to its own
copy of the game. A client sends back a fingerprint of its state now and then
so that the server can spot one that diverges. Watching a game, or replaying
one, is then receiving or replaying the list of turns.

## SOLID

The project's architecture follows SOLID, read on modules and functions:

- **One responsibility**: a module does one thing and its name says which; a
  rule lives in the engine, a drawing in the rendering, a word in `i18n/`, a
  number in `rules.ts`.
- **Open to extension**: a new army, work or token is added to a table, not as
  a new branch in working code.
- **Substitution**: whoever plays goes through the same `Order`; a human, a
  bot or a remote player replace one another.
- **Narrow interfaces**: each consumer receives the type it uses (the HUD
  reads a `Summary`, not the state).
- **Dependencies inward**: the engine depends on nothing, and everything else
  reaches it through its contract.
