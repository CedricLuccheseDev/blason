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
  tile; `realm`, the free domain of each tile, to start on), the villages and works, the
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
| `muster.ts`              | Raising an army: the free village, its road to the front, where it stands                  |
| `war.ts`                 | Armies: their march, where they enter, how they spread, what each tile costs               |
| `battle.ts`              | Battles between armies that meet, by the combat table                                      |
| `enclosure.ts`           | Encircled land passing to the lord all round it                                            |
| `heap.ts`                | The heap that orders the tiles an army strikes next                                        |
| `works.ts`               | Villages, markets and castles: where they may stand, their price, their building time      |
| `diplomacy.ts`           | Alliances, offers, renewals and traitors                                                   |
| `caravans.ts`            | The merchants' roads and what they pay                                                     |
| `step.ts`                | The tick, validation of orders, victory                                                    |
| `bots/`                  | The bots: `bot.ts` for war, works and expansion, `talk.ts` for diplomacy, `levels.ts`      |

### The bots

A bot is a function of the state that returns orders (`createBot` in
`engine/bots/bot.ts`). It reads the same state as a player and sends the same
`Order`s, through the same validation: the simulation cannot tell a bot from a
person. Bots are pure and deterministic like the rest of the engine, so in
multiplayer they will run on every client without a server. Their level
(`engine/bots/levels.ts`: easy, normal, hard), chosen at the home, never lets
them cheat: it sets how often a bot thinks, how soon it notices an attack, how
long it rests, how full it waits to be and how often it slips. The arena takes
it too: `npm run arena -- [games] [players] [easy|normal|hard]`.

## The rendering

`src/render/` draws the game with PixiJS and turns the player's gestures into
orders. It decides nothing about the rules.

- `client.ts` mounts a game in a page element: the land (`ahead.ts` makes the
  next one while the home is read), the session, the scene, the camera, the
  input, and the handle the React screen drives. What the player holds in
  hand, an army, a work or a coup, and the order a click sends with it, is
  `hand.ts` (the keys 1 to 9, `keys.ts`).
- `session.ts` runs the simulation in the page: it collects the player's
  orders and the bots', and steps the state ten times a second.
- `scene.ts` stacks the layers, so that what the game must make read stays
  above what only adorns it: the page and its frame, the sea and its shore
  lines (`layers/lands.ts`), the lands' washes (`regions.ts`, traced around
  their tiles by `trace.ts`), the ground over them (`layers/ground.ts`), the
  paved roads, the borders (`layers/borders.ts`: a watercolour edge of the
  lord's colour and a ribbon of ink that swells as a quill's, `ribbon.ts`,
  `pen.ts`), the works (`marks.ts`) and their life (`layers/life.ts`), the
  green and the red borders, then the wagons, the armies and the names.
- The map gains detail with the zoom, by the pixels a tile covers on screen
  (`ground/detail.ts`): from afar the wash and the works' silhouettes; at mid
  distance (9 to 18 pixels a tile) hatched hills, groves, rivers, fields round
  the villages, the works drawn, the mills turning; up close single trees,
  tufts, close furrows, the sea's ripples, roof tiles, smoke, peasants at work,
  gold glinting. Each level fades in over a range. The ground (`ground/`) reads
  each tile's biome once, from the map's nearest cell (`terrain.ts`); lays the
  wash's blooms (`bloom.ts`) and the woods' and hills' darker tone
  (`tones.ts`) at every distance, the rivers (`rivers.ts`) from mid distance;
  and paints the decoration (`ornaments.ts`, `fields.ts`, `paint.ts`, drawn by
  `art/trees.ts`) chunk by chunk, sixteen tiles a side, on canvases kept on the
  graphics card per level of zoom (`decor.ts`, `cache.ts`), multiplied into the
  washes so that its ink takes each land's hue. A chunk is painted again only
  when the land under it, a work or a road changed there (`changes.ts`, from
  the tiles' weights, `weights.ts`: nothing on a border, a road or a shore, a
  clearing round each work) or the zoom passed to another level, a few each
  frame, the middle of the screen first, the new one fading in over the old.
- The works (`art/works.ts`) are drawn once per lord's colour and level of
  detail into a texture: a silhouette cut out by a parchment halo, never under
  thirty pixels on screen; a drawing; an illustration (`art/village.ts`,
  `art/house.ts`, `art/castle.ts`, `art/ramparts.ts`, `art/market.ts`,
  `art/stall.ts`, `art/gold.ts`, with the pen of `art/ink.ts`); their life,
  sails, smoke, glints and peasants (`art/life.ts`), only on screen, still
  under reduced motion.
- Over the works, the
  armies (`armies.ts`): where each one stands and faces (`fronts.ts`), its
  men kept from frame to frame and running to their places in a column or in
  ranks (`squads.ts`, drawn by `layers/troops.ts`), the peasants facing them,
  the dead (`layers/fallen.ts`), the warning of an army coming for the player
  and the seal of each battle (`layers/warning.ts`), the standard-bearer
  among their men (`layers/standard.ts`); the roads as they are drawn, straight and even
  (`roads.ts`); the borders being bitten, in red (`layers/raids.ts`); the works being built
  (`layers/building.ts`); what the coups leave, the rebels' land hatched and
  their pitchforks, the ashes charred and paling (`layers/scars.ts`); the coups
  on their way, seen by all: the troublemaker walking with his torch, a volley
  of arrows, a pot of Greek fire trailing smoke, the land they will strike
  ringed in red for their victim (`layers/strikes.ts`, drawn by `art/coups.ts`,
  their ways by `flight.ts`), and how each ends, a rain of arrows, a burst of
  flames, a land rising, a troublemaker struck out (`layers/impacts.ts`); the villages' seals, their army home or out (`layers/levy.ts`), the caravans on
  their roads of beaten earth (`trade.ts`), what the player's works bring
  (`layers/tidings.ts`), the names (`places.ts`, `layers/labels.ts`), the aim
  (`layers/aim.ts`; with a coup in hand, the disc it would strike, its way and
  its reach along the border, `layers/aimCoup.ts`), the parchment's grain over the whole page, moving with it
  (`layers/paper.ts`), and the page round the map: its frame (`layers/page.ts`),
  the leaf browning and foxed outwards (`layers/leaf.ts`), the margin's chain,
  ruling and scale in pale ink (`layers/margin.ts`).
- `camera.ts` is the player's camera, out to twice farther than the whole land,
  where the names and standards shrink with it and the small writing fades; `director.ts` is the spectator's, which
  goes to the fiercest fight on its own (the home's background).
- `summary.ts` reads from the state, once a second, the figures the HUD shows;
  `news.ts` what the player's letters tell, the coups among it (`coupNews.ts`).

## The interface

The HUD is React, laid over the map. It is built on a small design system,
`src/components/hud/`, so that every piece shares the same measures:

- **tokens** (`tokens.ts`, and `src/styles/app.css` for the type and the
  shadow): four type sizes, 13, 16, 20 and 28 pixels, through four roles
  (`.hud-word`, `.hud-name`, `.hud-note`, `.hud-figure`), and spacing only on
  the steps 4, 8, 12, 16 and 24 pixels;
- **one scale**, `--hud` in `app.css`: 1 on a phone or a small screen, 1.2 on
  a screen at least 1280 by 640. The type, the spacing inside `.hud` (the
  game's screen) and the drawn objects all grow by it together, so that the
  measures above are written once, as drawn, and nothing is resized piece by
  piece (on a desk: type 15.6, 19.2, 24 and 33.6, steps 4.8 to 28.8, the
  button 53);
- **one material**, the sheet of parchment (`Sheet.tsx`);
- **one button**, 44 pixels tall at scale 1 (`Act.tsx`);
- a figure with its icon (`Figure.tsx`), and the drawn objects at fixed sizes:
  shields, wax seals, gilt medallions, the coups' lozenges ringed in gules, keys, and the badges of standing
  (`Emblem.tsx`): an ally the links of a chain in the alliance's green
  (`--color-pact`, the map's `TONE.pact`), a foe at war a sword in gules, a
  felon his shield broken in two on gules; the shape says it before the
  colour, the same badges as beside the names on the map;
- **one motion**: a single curve and two durations, through two roles,
  `.hud-press` on whatever is touched and `.hud-enter` on every sheet that
  appears; nothing moves under reduced motion;
- **a compact shape** on phones, upright or sideways (`useCompact.ts`).

The game's pieces (`src/components/game/`: the lords' list top left, the
race on one thin line, the letters and the alliances to renew top right, the
bar at the bottom with the purse in it, then the armies, the works and the
coups (`Bar.tsx`, its pieces `BarPiece.tsx`), what cannot be paid at half ink,
the lord aimed at, the cartouche beside the pointer) are built from these and
nothing else. The look follows the design boards, whose sources are in
`design/mockups/` and mirror the same tokens (`kit.py`).

## Multiplayer

The engine is built for lockstep, as in OpenFront: the server runs no
simulation.

- `net/protocol.ts`, shared by the browser and the server, says the
  messages: join a room (the public one, a private one by its code, or a new
  private one), start, an order, a fingerprint; and back the lobby, the
  beginning (the seed, the bots' level, the players by seat), each numbered
  turn, a desync.
- `server/` is the relay, a small Node WebSocket server of its own
  (`npm run relay`, `Dockerfile.relay`), deployed beside the site. Its rooms
  (`server/rooms.ts`) gather up to eight players, the rest of the twenty
  seats being bots; then every 100 milliseconds it sends everyone the turn:
  the orders received since the last, each signed with its sender's seat.
  A player who leaves during a game gives his seat to a bot, on every browser
  at the same turn. Every 50 turns each browser tells the fingerprint of its
  state, and the relay names the first turn where two differ.
- Each browser applies the turns to its own copy of the game, bots included:
  a distant player is one more seat the session receives from outside, as a
  bot is. Watching a game, or replaying one, is receiving or replaying the
  list of turns.

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
