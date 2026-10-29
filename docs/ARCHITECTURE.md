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
  tile), the works, the players (peasants, gold, traitor's mark, the tile of
  their standard), the armies on the march (`hosts`), the alliances and
  offers, the caravans, the tick and the winner.
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

| Module                   | Responsibility                                                                                      |
| ------------------------ | --------------------------------------------------------------------------------------------------- |
| `units.ts`, `numbers.ts` | The two units, integer arithmetic, seeded draws                                                     |
| `map/`                   | The map generator: from a seed, the shape of the land, its coasts, relief, lakes, rivers and biomes |
| `grid.ts`                | The land cut into tiles of four map units                                                           |
| `land.ts`                | The land in the game, the peasants, the men holding a tile                                          |
| `opening.ts`             | The opening: each lord's standard, planted anywhere and moved at will, then the land round it given |
| `muster.ts`              | Raising an army: the free village, its road to the front, where it stands                           |
| `war.ts`                 | Armies: their march, where they enter, how they spread, what each tile costs                        |
| `battle.ts`              | Battles between armies that meet, by the combat table                                               |
| `enclosure.ts`           | Encircled land passing to the lord all round it                                                     |
| `heap.ts`                | The heap that orders the tiles an army strikes next                                                 |
| `works.ts`               | Villages, markets and castles: where they may stand, their price, their building time               |
| `diplomacy.ts`           | Alliances, offers, renewals and traitors                                                            |
| `caravans.ts`            | The merchants' roads and what they pay                                                              |
| `step.ts`                | The tick, validation of orders, victory                                                             |
| `bots/`                  | The bots: `bot.ts` for war, works and expansion, `talk.ts` for diplomacy, `levels.ts`               |

### The map

`engine/map/generate.ts` grows a land from a seed, in stages, each its own
module, all pure and seeded (floating point, but only `+ − × ÷`, so every
machine draws the same land):

1. **Cells** (`points.ts`, `cells.ts`): points scattered evenly over the
   frame (Poisson disc, relaxed twice) and their Voronoi cells, some two
   thousand on land, each about 430 square map units.
2. **The shape** (`shapes.ts`): the seed draws one of six families, a
   continent the sea rings round, a coast on any side, an inland sea, two
   lands joined by a neck, a strip between two seas, a land cut by fjords;
   its lines are bent by a warp and roughened by noise (`noise.ts`, Perlin
   written with the four operations), then marked on the coast with
   peninsulas, bays and capes turned to face the open sea (`marks.ts`).
3. **The sea** (`terrain.ts`): the family's share of the lowest cells, less
   if it would break the land, which is one piece with no islands: every
   cell can be reached on foot.
4. **The ground** (`ground.ts`): each land cell's height, from the shape's
   relief, the distance from the shore and a few ridged ranges; its
   wetness, from a rain noise, more by the water and less up high.
5. **Lakes** (`lakes.ts`): a few hollows of the inland, a handful of cells
   each, filled with water where the land stays one piece round them. The
   simulation counts them as sea: no army crosses them.
6. **Rivers** (`rivers.ts`): along the cells' borders, from high springs
   down the way a priority flood finds for the whole land, to the sea or a
   lake, a few apart, tributaries ending where they meet another.
7. **Biomes** (`biomes.ts`): the highest cells mountains, the next hills,
   the wettest of the lowland woods, the rest plain, by shares; then a vote
   of the neighbours, twice, so that they lie in regions. They are only
   drawn: the simulation knows land and water.

The tiles (`grid.ts`) then follow the cells: a tile is land when the cell
nearest its middle is.

A map's size (`MAP_SIZES` in `rules.ts`, `generateWorld(seed, { size })`)
multiplies its area, 1, 2 or 4 times the standard land's: the cells keep
their area, so there are more of them, and the noise that raises the ranges
and brings the rain is measured in map units, so a larger land has more
ranges and woods rather than larger ones; its shape takes an octave of noise
more at the largest size, and more coast features, smaller. The game reads
the size from the grid alone: the starts keep their reach, so a larger land
leaves more free land between them. The rendering reads the world's own
width and height; only the camera's closest zoom reads the size, so that it
comes as close on a larger land as on the standard one.

### The bots

A bot is a function of the state that returns orders (`createBot` in
`engine/bots/bot.ts`). It reads the same state as a player and sends the same
`Order`s, through the same validation: the simulation cannot tell a bot from a
person. Bots are pure and deterministic like the rest of the engine, so in
multiplayer they will run on every client without a server. Their level
(`engine/bots/levels.ts`: easy, normal, hard), chosen at the home, never lets
them cheat: it sets how often a bot thinks, how soon it notices an attack, how
long it rests, how full it waits to be, how often it slips, and how many lords
may hunt the same one: a bot leaves alone a lord already struck by another
(two at the hard level), its answers to an attack apart, so that no one, bot
or player, is set upon from every side at once. The arena takes
it too: `npm run arena -- [games] [players] [easy|normal|hard] [standard|large|huge]`,
and times there the land's making and each tick, and weighs the memory a game
holds. The census (`npm run census -- [seed] [level] [minutes]`,
`scripts/census.ts`) plays one game and every few minutes counts, for the
first lord and the median one, the land, the works, the peasants and what
feeds them, and the gold; other figures for the peasants are tried with
`LAND=… VILLAGE=…` and for the works' prices with `DOUBLINGS=…`.

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
  green and the red borders, then the wagons, the armies and the names. Each
  layer is its own render group, so that what moves every frame (a man shown
  or hidden, a seal drawn again) rebuilds only its own batches, never the
  washes' or the borders'. The washes with the ground's tones, and the
  borders, are clipped to the land's one shape (`landShape` in
  `layers/lands.ts`: its cells filled, their sides between two land cells
  straight, only the coast as drawn), laid once and shared by every clip; the
  washes and the borders' watercolour are laid with fewer points, none farther
  from its line than the border's ink covers (`straighten` and `simplify` in
  `geometry.ts`).
- The map is light on the machine (`quality.ts`). The renderer draws at most a
  pixel and a half a point, and so do the canvases painted for it (the works,
  the men's sheets, the decoration). The frames are watched: when the middle
  frame of a second and a half runs much longer than aimed at, the drawing
  steps down a level, fewer pixels at each (first the smoke, the glints and
  the peasants at work left out; then the decoration painted with less time a
  frame and without its cast shadows; at the last, the mills still and the men
  without their shadows), and back up after several seconds with room, later
  each time a level had to be left; a step down that did not shorten the
  frames is undone (a screen or a battery that caps them). Each game begins at
  the best. While the page is hidden nothing is drawn and the ticker stops: a
  game alone waits, a game online plays the relay's turns on as they come;
  back, a frame plays twenty ticks at most, the rest at the next ones,
  so that catching up never freezes the page. Off the screen, no man
  is laid; the works and the seals are laid again only with a tick or the
  zoom; a road's stones show only once each covers a pixel; the sea's shore
  lines leave out the coast's smallest turns, the farther from it the more.
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
  `art/trees.ts` and `art/hill.ts`, quieter up close so that it bears the
  washes up) chunk by chunk, sixteen tiles a side, on canvases kept on the
  graphics card per level of zoom (`decor.ts`, `cache.ts`), multiplied into the
  washes so that its ink takes each land's hue. A chunk is painted again only
  when the land under it, a work or a road changed there (`changes.ts`, from
  the tiles' weights, `weights.ts`: nothing on a border, a road or a shore, a
  clearing round each work) or the zoom passed to another level, a few each
  frame within a budget of time, the middle of the screen first, the new one
  fading in over the old; a chunk already painted waits most of a second
  before it is painted again, however often a front moves through it. The
  cache keeps some ten million pixels, without mipmaps: a chunk is painted
  for its level and never shrunk much.
- One light over the whole map, from the upper left (`art/light.ts`), so that
  what stands on it stands: each tree, hill and work casts a soft shadow to
  the lower right, as long as it is high, with a darker contact at its foot,
  its faces turned from the light in shade. The shadows are painted with what
  casts them, once, into the decoration's chunks and the works' textures: the
  silhouettes laid flat by a shear on a small canvas, where they merge, then
  stretched over the drawing, which softens their edge; never each frame.
- The works (`art/works.ts`) are drawn once per lord's colour and level of
  detail into a texture: a silhouette cut out by a parchment halo, never under
  thirty pixels on screen; a drawing; an illustration (`art/village.ts`,
  `art/house.ts`, `art/church.ts`, `art/castle.ts`, `art/ramparts.ts`,
  `art/market.ts`, `art/stall.ts`, `art/gold.ts`, with the pen of
  `art/ink.ts`), each piece where its plan sets it (`art/plans.ts`). Drawn and
  illustrated, they stand in the map's light with volume: the faces turned from
  it in shade, a line of shade under the eaves and the verges, the towers lit
  round, and, laid on their ground before them, the shadows of their volumes
  and a darker contact at their foot (`art/shadows.ts`, from the hulls of
  `art/solid.ts`) on a patch of trodden earth; the silhouette from afar has
  none. Their life,
  sails, smoke, glints and peasants (`art/life.ts`), only on screen, still
  under reduced motion.
- Over the works, the
  armies (`armies.ts`): where each one stands and faces (`fronts.ts`), its
  men kept from frame to frame and running to their places in a column or in
  ranks (`squads.ts`, drawn by `layers/troops.ts`), the peasants facing them;
  each kind of army its own men, riders for the raid, men-at-arms for the
  host, the levy as it came, walking and fighting, drawn once for every lord
  on a sheet per look (`art/men/`: the looks in `looks.ts`, the frames in
  `pose.ts`, the sheet in `atlas.ts`) and laid as two sprites a man, his dye
  tinted in his lord's colour under his base, on a shadow (`figures.ts`);
  the dead (`layers/fallen.ts`), the warning of an army coming for the player
  and the seal of each battle (`layers/warning.ts`), the standard-bearer
  among their men (`layers/standard.ts`, its banner drawn by `art/banner.ts`);
  in the opening, each lord's standard planted by the village he has chosen,
  the player's ringed in gold, hopping to its new village when moved
  (`layers/planted.ts`); the roads as they are drawn, straight and even
  (`roads.ts`); the borders being bitten, in red (`layers/raids.ts`); the works being built
  (`layers/building.ts`); what the coups leave, the rebels' land hatched and
  their pitchforks, the ashes charred and paling (`layers/scars.ts`); the coups
  on their way, seen by all: the troublemaker walking with his torch, a volley
  of arrows, a pot of Greek fire trailing smoke, the land they will strike
  ringed in red for their victim (`layers/strikes.ts`, drawn by `art/coups.ts`,
  their ways by `flight.ts`), and how each ends, a rain of arrows, a burst of
  flames, a land rising, a troublemaker struck out (`layers/impacts.ts`); the villages' seals, their army home or out (`layers/levy.ts`), the caravans on
  their roads of beaten earth (`trade.ts`), what the player's works bring
  (`layers/tidings.ts`), the alliances between the lords' capitals, the
  player's own a ribbon of green silk hemmed in gold, the others' a thin dotted
  cord of ink with a tiny seal parted in both lords' colours (`layers/pacts.ts`,
  their bowed line `cord.ts`, drawn by `art/cords.ts`), and one broken
  snapping before all, its seal cracking in two (`art/snap.ts`), the names (`places.ts`, `layers/labels.ts`), the aim
  (`layers/aim.ts`; with a coup in hand, the disc it would strike, its way and
  its reach along the border, `layers/aimCoup.ts`), the parchment's grain over the whole page, moving with it
  (`layers/paper.ts`), and the page round the map: its frame (`layers/page.ts`),
  the leaf browning and foxed outwards (`layers/leaf.ts`), the margin's chain,
  ruling and scale in pale ink (`layers/margin.ts`).
- `camera.ts` is the player's camera, out to twice farther than the whole land,
  where the names and standards shrink with it and the small writing fades; `director.ts` is the spectator's, which
  goes to the fiercest fight on its own (the game on the home's board).
- `heralds.ts` says where the HUD lays its pieces on the map (the seal of each
  of the player's alliances at the middle of its ribbon, the herald's letter of
  each offer made to him, on his land nearest the lord who sends it,
  `envoys.ts`; the news where it happened, a few seconds, `notes.ts`), in
  pixels of the
  screen, each time they move, to the HUD that listens (`GameHandle.heralds`,
  `handle.ts`).
- `summary.ts` reads from the state, once a second, the figures the HUD shows;
  `news.ts` what the player hears and where: a lord biting his border, the
  coups at his land (`coupNews.ts`), and any lord who broke an alliance.

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
  appears, `.hud-life` on what is told a few seconds, and `.hud-glow` on what waits on the map for a click (a seal to
  renew), `.hud-bob` on a herald's letter waiting there, and the halves of a
  seal that breaks (`.hud-broken`); nothing moves under reduced motion;
- **a compact shape** on phones, upright or sideways (`useCompact.ts`).

The game's pieces (`src/components/game/`: the lords' list top left, the
race on one thin line and under it a betrayal cried to all on a banderole of
gules (`Banner.tsx`), the top right left to the map; the seals of the player's
alliances on the map at the middle of their ribbons, a click to renew in their
last moments; an offer as the herald's sealed letter on the player's land, its
gold ring the time it stands, which a click breaks open to seal or refuse
(`HeraldLetter.tsx`); either waiting at the screen's edge with an arrow when
out of view (`Heralds.tsx`, `PactSeal.tsx`, `edge.ts`); the news as a pennant
planted where it happened, a few seconds (`Pennant.tsx`); the
bar at the bottom with the purse in it, then the armies, the works and the
coups (`Bar.tsx`, its pieces `BarPiece.tsx`), what cannot be paid at half ink,
the lord aimed at, the cartouche beside the pointer) are built from these and
nothing else. The look follows the design boards, whose sources are in
`design/mockups/` and mirror the same tokens (`kit.py`).

## The home

The home is built as OpenFront's, in the game's own materials: one column
on a quiet ground, the player at its head (his shield and "Lord" until
profiles come), the next public game first and biggest, with one click to
sit at it, then the solo game and the private rooms, each set on a sheet of
its own (the browser's modal `<dialog>`); the journal beside it, reading the
blog's posts. Every piece is the HUD's (`Sheet`, `Act`, `Figure`,
`Shield`), so the home costs no CSS of its own.

Behind the column, the bots' game: the spectator's game of twenty bots
(`client.ts` with the director) drawn by PixiJS straight into the page's
background under a veil of parchment, at no more than 1.5 pixels per CSS
pixel and 30 frames a second. It starts once the menu is painted and the
browser is idle, and only where WebGL is; elsewhere the parchment stays. The
veil lifts to watch it full screen. Nothing else on the home runs a loop:
the room's clock ticks once a second, and only while a room is sat at.

`src/components/home/`: `Home.tsx` lays it out; `PublicCard.tsx` the next
public game, `SoloSettings.tsx` (the land's size and the bots' level, then
`/play?level=…&size=…`), `PrivateRoom.tsx` (a room made and its code to
share, or a code typed to join, and the host's start), `Seats.tsx`,
`Journal.tsx`, `Masthead.tsx`, `Foot.tsx`; the rooms of the relay
(`useRoom.ts`), the background game (`useSpectator.ts`, `Backdrop.tsx`).

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
- In the browser, `link.ts` is the line to the relay; the home sits the
  player at a room and shows it live (`useRoom.ts`); when the relay says
  the game begins, the open line is left in `online.ts` and `/play?online`
  mounts the game with `remote.ts`'s session, stepped by the relay's turns,
  instead of the local one.
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
