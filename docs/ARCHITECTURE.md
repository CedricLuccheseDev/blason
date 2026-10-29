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
  the rules of a tick in a fixed order: the peasants grow, the battles are
  fought, the castles shoot, the armies advance, the coups fall, encircled
  land passes, the markets send caravans, the caravans move, alliances and
  offers expire, and the game is judged.

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
| `volleys.ts`             | The castles' arrows: a volley every few seconds at each enemy army fighting in their zone           |
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
machine draws the same land). It has two generators, chosen by
`generateWorld(seed, { generator })` from a table: the first, the game's
(`classic.ts`), below, and a second on trial, the relief's, after it. They
share the cells, the borders, the rivers and the biomes; each makes its own
ground (`Ground` in `types.ts`: the water, the high mountains, each cell's
height):

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

The second generator (`relief.ts`), judged on a board before it may
replace the first (`npm run maps -- <board.html>`, `scripts/maps.ts`),
raises a land as a land is, so that its coasts are the outline of a relief
rather than of a figure:

1. **The recipe** (`recipes.ts`, `bench.ts`, `sculpt.ts`): the same six
   families, each a recipe of the sculptor's tools, hills, ranges, troughs
   and domes, each spreading from cell to cell a little more or less at
   each step, laid where the family wants them in heights of the map; the
   masses rounded, then the coast's features set on the coast they draw,
   turned out to sea, peninsulas, gulfs, sounds, bays, capes, fjords
   (`coastline.ts`), more of them and as large in map units on a larger
   map. The ranges' crests are kept apart, as the ridges.
2. **The roughness**: a noise of every size, stronger in some places than in
   others (a second noise tempers it), so that a coast runs smooth here and
   ragged there.
3. **The sea** (`seas.ts`): the family's share of the lowest cells; a great
   piece of land cut off is joined to the largest by a neck over the
   shortest strait, the islets sink, the ponds are filled: one land.
4. **The water's work** (`erosion.ts`): the rain runs down to the sea by a
   priority flood, and the more water runs through a cell the deeper it
   digs it, never below the sea: valleys from the heights to the shore.
5. **Lakes**, as the first generator's, in the hollows the water left.
6. **The high mountains** (`peaks.ts`): of the land, the 9 % that rise the
   most, the ridges first, less the groups of a few cells; a chink where
   two of their cells meet by a side too short for a tile is sealed. They
   are no land of the game (`map.peaks`, apart from `map.land` and
   `map.sea`; `grid.ts` makes their tiles no land, as the sea's), and the
   world draws them apart (`world.peaks`). Then the **passes**
   (`passes.ts`, `crossings.ts`): every piece of the land walled in by them
   is joined to the rest by the lowest way over (a piece too small is
   mountain too), and where a range parts two lands a long walk round it,
   it is cut at its lowest, once for so many of its cells. A pass is a cell
   wide, and the cells of a way are joined by sides wide enough for a road
   of tiles (`pieces.ts`): the land stays one, tile by tile.
7. **Rivers** and **biomes** as the first generator's, the biomes without
   mountains of their own: the land below the high ones has hills.

The tiles (`grid.ts`) then follow the cells: a tile is land when the cell
nearest its middle is land, not when it is sea or high mountain.

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
it too: `npm run arena -- [games] [players] [easy|normal|hard] [standard|large|huge] [classic|relief]`,
the last the generator of its lands, and times there the land's making and
each tick, and weighs the memory a game holds. The census
(`npm run census -- [seed] [level] [minutes]`, `scripts/census.ts`) plays
one game and every few minutes counts, for the first lord and the median
one, the land, the works, the peasants and what feeds them, and the gold;
other figures for the peasants are tried with `LAND=… VILLAGE=…` and for
the works' prices with `DOUBLINGS=…`.

## The rendering

`src/render/` draws the game with PixiJS and turns the player's gestures into
orders. It decides nothing about the rules.

- `client.ts` mounts a game in a page element: the land (`ahead.ts` makes the
  next one while the home is read, and keeps the public game's, which
  `sketch.ts` draws small on the home's card, for that game when it
  begins), the session, the scene, the camera, the input, and the handle the
  React screen drives. What the player holds in
  hand, an army, a work or a coup, and the order a click sends with it, is
  `hand.ts` (the keys 1 to 9 then 0, `keys.ts`). What the pointer aims at, where
  the army would enter and whose land it is, is `aiming.ts`; `pin.ts` keeps
  the aim the HUD is shown, the pointer's, or the one a right click pinned
  on another lord's land for his menu until it is closed (a click on the map
  then only closes it, and so does one just after the pointer left it
  behind, so that no army goes out of a click meant to put it away).
- `session.ts` runs the simulation in the page: it collects the player's
  orders and the bots', and steps the state ten times a second.
- A saved game (`save.ts`) is a game's state at a tick as plain data, less
  what the seed makes again (the land and its tiles, the rules, whatever the
  game has not changed since it began): the arrays over every tile kept as
  runs, the roads as walks, three steps a letter. `/play?save=<name>` shows
  one held still at its tick, from the seat and with the camera it was saved
  with (`still.ts`; `sessions.ts` picks a game's session: saved, online or
  alone). `npm run maquette` (`scripts/maquette.ts`) plays a game of bots
  without a screen and saves the moments the maquette is drawn on into
  `public/saves/`, each read back first and checked to give the same game
  and the same HUD.
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
  (`ground/detail.ts`): from afar, the strategist's map, the wash and the
  works' small marks; at mid
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
  detail into a texture: a silhouette cut out by a parchment halo; a drawing;
  an illustration (`art/village.ts`, `art/house.ts`, `art/church.ts`,
  `art/castle.ts`, `art/ramparts.ts`, `art/market.ts`, `art/stall.ts`,
  `art/gold.ts`, with the pen of `art/ink.ts`), each piece where its plan sets
  it (`art/plans.ts`). Up close a work stands at the map's scale; under 24
  pixels it shrinks twice as fast as the map, a small mark of some 14 at the
  whole land's zoom. That map is the strategist's, to be read at once and
  with room round everything: there another's market is left out (the trade's
  roads stand for it), another's work goes once it would be a speck, the
  player's own stay marks of 8 pixels at least, and the villages' seals and
  another's work being built (`layers/levy.ts`, `layers/building.ts`) come
  back only from mid distance (`workShown`, `toldShown`). Drawn and
  illustrated, they stand in the map's light with volume: the faces turned from
  it in shade, a line of shade under the eaves and the verges, the towers lit
  round, and, laid on their ground before them, the shadows of their volumes
  and a darker contact at their foot (`art/shadows.ts`, from the hulls of
  `art/solid.ts`) on a patch of trodden earth; the silhouette from afar has
  none. Their life,
  sails, smoke, glints and peasants (`art/life.ts`), only on screen, still
  under reduced motion.
- Over the works, the
  armies (`armies.ts`): where each one stands and faces (`fronts.ts`; a
  battle on the ground the engine has its two armies meet on, `groundOf`,
  never a ground of its own), its
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
  in the opening, each lord's standard planted on the tile he has chosen,
  the player's ringed in gold, hopping to its new tile when moved
  (`layers/planted.ts`); the roads as they are drawn, straight and even
  (`roads.ts`); the borders being bitten, in red (`layers/raids.ts`); the works being built
  (`layers/building.ts`); what the coups leave, the rebels' land hatched and
  their pitchforks, the ashes charred and paling (`layers/scars.ts`); the coups
  on their way, seen by all: the troublemaker walking with his torch, a volley
  of arrows, a pot of Greek fire trailing smoke, the land they will strike
  ringed in red for their victim (`layers/strikes.ts`, drawn by `art/coups.ts`,
  their ways by `flight.ts`), and how each ends, a rain of arrows, a burst of
  flames, a land rising, a troublemaker struck out (`layers/impacts.ts`); the
  castles' arrows, the same on the same arc, loosed from their towers a moment
  before each volley, which the castles' rhythm tells ahead, so that they come
  down on the enemy army's men as the volley takes them (`layers/volleys.ts`);
  the villages' seals, their army home or out, from mid distance
  (`layers/levy.ts`), the caravans on
  their roads of beaten earth (`trade.ts`), what the player's works bring
  (`layers/tidings.ts`), no line between allies in ordinary times (their
  green border and the badge beside each ally's name say it), but an alliance
  broken snapping before all between the two capitals, the player's own a
  ribbon of green silk hemmed in gold, the others' a line of ink, its seal
  cracking in two (`layers/pacts.ts`, its bowed line `cord.ts`, drawn by
  `art/snap.ts`), the names, never under 16 pixels and at full strength over
  the works, a land too small on screen to carry its words leaving them out,
  never the player's, and the marks beside them (`places.ts`,
  `layers/labels.ts`), the aim
  (`layers/aim.ts`; the road an army would march from its village, the
  mercenaries' from their market; with a coup in hand, the disc it would strike, its way and
  its reach along the border, `layers/aimCoup.ts`; in the opening, a ring
  where the standard would stand, red where another lord's is too near, his
  ringed by the ground it holds), the parchment's grain over the whole page, moving with it
  (`layers/paper.ts`), and the page round the map: its frame (`layers/page.ts`),
  the leaf browning and foxed outwards (`layers/leaf.ts`), the margin's chain,
  ruling and scale in pale ink (`layers/margin.ts`).
- `camera.ts` is the player's camera, out to twice farther than the whole land,
  where the figures and the standards shrink with it, a name never under 16
  pixels, and the standards' small writing fades.
- `heralds.ts` says where the HUD lays its pieces on the map (the seal of each
  of the player's alliances in its last moments, beside his ally's name, past
  the figure under it and its marks, `besideOf` in `places.ts`, the ally's
  links giving way to it there; the herald's letter of each offer made to him,
  on his land nearest the lord who sends it, `envoys.ts`; the news where it
  happened, a few seconds, `notes.ts`), in pixels of the screen, each time they
  move, to the HUD that listens (`GameHandle.heralds`, `handle.ts`).
- `summary.ts` reads from the state, once a second, the figures the HUD shows;
  `news.ts` what the player hears and where: a lord biting his border, the
  coups at his land (`coupNews.ts`), an offering given him (on the giver's
  land nearest his own, with its gold), his alliances offered to him, made
  or come to their end unbroken (there too, though the map shows them), and
  any lord who broke an alliance.

## The interface

The HUD is React, laid over the map. It is built on a small design system,
`src/components/hud/`, so that every piece shares the same measures:

- **tokens** (`tokens.ts`, and `src/styles/app.css` for the type and the
  shadow): four type sizes, 15, 18, 22 and 28 pixels, none smaller so that
  every word reads at a glance, through four roles (`.hud-word`, `.hud-name`,
  `.hud-note`, a hint in italics at full ink, `.hud-figure`), and spacing
  only on the steps 4, 8, 12, 16 and 24 pixels;
- **one scale**, `--hud` in `app.css`: 1 on a phone or a small screen, 1.2 on
  a screen at least 1280 by 640. The type, the spacing inside `.hud` (the
  game's screen) and the drawn objects all grow by it together, so that the
  measures above are written once, as drawn, and nothing is resized piece by
  piece (on a desk: type 18, 21.6, 26.4 and 33.6, steps 4.8 to 28.8, the
  button 53);
- **one material**, the sheet of parchment (`Sheet.tsx`);
- **one button**, 44 pixels tall at scale 1 (`Act.tsx`);
- **one hint**, a small sheet a piece pointed at a moment opens over the
  whole page, its name and what it does with its figures (`Hint.tsx`; its
  words in `i18n/hints.ts`);
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
- **a compact shape** on phones, upright or sideways (`useCompact.ts`);
- **nothing off the screen** and nothing on another piece, at any size from
  1024 by 600: a piece measures the room it has and grows more compact when
  it lacks it (`useFit.ts`; the bar is laid on rows as on a phone; the race
  keeps its figure alone), and
  what is placed by the pointer or on the map keeps within the screen
  (`useSize.ts`; `useBeside.ts`: the cartouche and the right click's menu,
  above the bar's row, go to the pointer's other side, and on a phone stand
  above the bar; a letter's words; a pennant flies left near the right side).

The game's pieces (`src/components/game/`: the lords' list top left, every
lord standing on a thin line washed in his colour as far as his land goes
against the first's, the lord under the pointer lit there (`Lords.tsx`); the
race on one thin line and under it a betrayal cried to all on a banderole of
gules (`Banner.tsx`), the top right left to the map; the seal of an alliance of
the player's only in its last moments, beside his ally's name, a click to renew
it, its time and whose turn it is beside it (`PactSeal.tsx`); an offer as the
herald's sealed letter on the player's land, its gold ring the time it stands,
which a click opens, to accept it in the alliance's green or refuse it in
gules, in plain words (`HeraldLetter.tsx`); either waiting at the screen's edge
with an arrow when out of view (`Heralds.tsx`, `edge.ts`); the news as a
pennant planted where it happened, a few seconds (`Pennant.tsx`); the
bar at the bottom, tight, with the purse in it, then the four armies as seals
in a row, the mercenaries' in gold, paid in gold, each with its figure under
it as a work has its price (the share of the peasants a levy takes, the
mercenaries' gold), and only the one in hand named under the row with its
men, then the works and the coups as their
emblems and their prices alone, their names under the pointer, what cannot be
paid at half ink, keys 1 to 9 then 0 (`Bar.tsx`, its pieces `BarPiece.tsx`);
the cartouche beside the pointer, what a left click sends, the army in hand
and its men, and over another lord's land that a right click opens the rest
(`Cursor.tsx`); a right click there opens his menu beside the pointer, as a
short list: a small sheet, his shield and his name, then a thin line for
each act, its medallion ringed in its colour, its word and its figure:
attack, the men of the army in hand, sent there as a left click would (none
on an ally's land); the alliance, its word what it does now, to offer,
accept, renew or break it, asleep while the player's offer waits; an
offering, the gold it would give (`LordMenu.tsx`, its lines `lordMenu.ts`))
are built from these and nothing else. The look follows the design boards, whose sources are in
`design/mockups/` and mirror the same tokens (`kit.py`).

## The maquette

The interface is designed on the game itself, never beside it: the
maquette (`design/maquette/maquette.html`) shows the game's real screen,
held still at chosen moments of a real game, at the sizes of screen that
matter, side by side. It cannot drift from the game, because each of its
frames is the game. A piece of the HUD is redesigned there first, as
proposals beside the game's own; the one chosen is then coded. It is made
in three steps, and a fourth makes it into boards:

1. `npm run maquette` (`scripts/maquette.ts`) plays a game of bots without
   a screen to its end and saves its moments (`public/saves/`, the saved
   games above): the opening, minute 3, an offer of alliance, an alliance to
   renew, a war up close, the whole land at minute 20, and the tick the game
   is won, from the winner's seat and from the seat of the lord who came
   nearest.
2. `node design/maquette/capture.mjs [game url]`, the game served, opens
   each save in `/play?save=<name>` in a headless Chrome at each size
   (`moments.mjs`: a desk's screen, a laptop's, a phone), staged as a player
   would (the pointer on a neighbour's land, a right click, a key, a click),
   waits until the map is drawn, and takes apart the map alone as an image
   and the HUD's markup as the page rendered it, and once the page's CSS
   (`captures/`). A moment may be a page of the site instead of a save: the
   home, its next public game told by the relay served beside it, the game
   of bots behind it taken as the map; any other canvas of a page (the land
   of the next game) is kept in its markup as the image it shows. Last, the
   HUD's pieces drawn by the game's own components (`pieces.tsx`, imported
   in a page of the game through Vite), for the board of the interface.
   The dev server does not watch `design/`, and the game's CSS is not made
   from it (`vite.config.ts`, the `@source not` of `app.css`): what the
   maquette writes never reloads the pages it is capturing, nor feeds the
   game's CSS with its words.
3. `node design/maquette/build.mjs` lays them together again in
   `maquette.html`: each frame a document of its real size, so that the
   game's CSS lays the HUD out as the game does at that size, scaled down to
   its place in the row, the map's image underneath and the HUD on top. A
   proposal (`proposals/*.mjs`) puts new markup, written in the game's own
   classes, in the place of a piece of the HUD, and is shown beside the
   game's on the same moments and sizes. A frame's document is built by
   `frame.js`, which the boards share.
4. `npm run planches` (`design/maquette/planches.mjs`) makes the maquette
   into a studio's boards, eleven pages of 1920 by 1080 in the game's own
   matter (`board.css`: the parchment, the ink, the gilt rules, Vollkorn and
   Alegreya Sans): a cover, a board for each moment, and one for the HUD's
   system. `boards.mjs` says what each shows: its title and its line, the
   moments and their sizes, and its notes in French, each naming a piece of
   the HUD by its selector in the frame, or a point of the map in the
   frame's own pixels. `board.js` lays a board out: the desk's screen large,
   the phone's beside it where it matters, a part of a frame larger where a
   detail matters, and the notes in a column at the height of what they
   name, ordered so that no two lines cross, a line going round the lords'
   list rather than over it, the same number pinned on the phone. The
   command first takes again what the boards show (`take.mjs`: the saves
   made again, the game and the relay served on free ports, the boards'
   moments captured at the boards' sizes, the pieces), then exports each
   board to PNG into the author's notes (`Maquette/NN-name.png`) and writes
   the note that shows them (`Maquette.md`); `--no-take` lays them out from
   the captures there are, `--out <dir>` exports elsewhere, and boards named
   are made alone. A note whose piece the game no longer draws is reported, and
   its board made without it: the selectors follow the HUD's markup.

## The home

The home is built as OpenFront's, in the game's own materials, on the
game's page without its map: the parchment, the frame the map lies in, and
a faint compass rose in its corner (`Ornaments.tsx`). The name of the game;
under it the public game in its opening, the biggest thing there; then three
short buttons, the solo game, a private room made and a private room joined
by its code, each opening a sheet of its own (the browser's modal
`<dialog>`). On their right the journal, a sheet of its last posts, each its
date, its title and its first line, in Alegreya Sans at full ink to be read.
At the foot of the page, never in its middle, quiet: the player on the left
(his shield and "Lord" until profiles come), the rest of the site in the
middle; on a phone or a narrow screen, everything stacked, the journal under
the buttons. Every piece is the HUD's (`Sheet`, `Act`,
`Figure`, `Shield`), so the home costs no CSS of its own.

The public game is a large card, as OpenFront's, whose body is the land of
the game being planted now: the very land it is played on, made from the
relay's seed when the browser has a moment and drawn small on a canvas
(`sketch.ts`), as the map shows it from afar at the opening, the sea's wash
and its shore lines, the land's parchment, its woods, hills and mountains a
shade darker, the coast in ink. Its title, the time left to join it and the
seats taken lie on it as a map's cartouches, and Play at its corner, or a
click anywhere on the land, goes straight into its opening, to plant a
standard: there is no room to wait in
(Multiplayer, below). When no one may come in any more, the relay shows the
next, and the land fades for the new one; the land made is kept, so that
the game, when joined, is not made again.

Nothing on the home runs a loop: the public game's clock ticks once a
second (`Countdown.tsx`), and the relay is asked about that game every
second and a half, only while the page is shown (`useUpcoming.ts`).

`src/components/home/`: `Home.tsx` lays it out; `PublicCard.tsx` the public
game, its land on `LandPlate.tsx` and its clock `Countdown.tsx`,
`SoloSettings.tsx` (the land's size and the bots' level, then
`/play?level=…&size=…`), `PrivateRoom.tsx` (a room made and its code to
share, or a code typed to join, and the host's start), `Seats.tsx`,
`Journal.tsx`, `Masthead.tsx`, `Ornaments.tsx`, `Foot.tsx`; the line to the
relay for a game or a room (`useRoom.ts`) and its public game
(`useUpcoming.ts`).

## Multiplayer

The engine is built for lockstep, as in OpenFront: the server runs no
simulation.

- `net/protocol.ts`, shared by the browser and the server, says the
  messages: join the public game, a private room by its code, or a new
  private room; start, an order, a fingerprint; and back a private room's
  lobby (who sits, its code), the beginning (my seat, the land's seed and
  size, the bots' level, the opening's length), each numbered turn, a
  desync. A turn holds the orders received since the last, each signed with
  its sender's seat, and the seats that became a person's (`joined`: their
  bots stop at that turn) or a bot's again (`left`). Every seat begins a
  bot's.
- `server/` is the relay, a small Node WebSocket server of its own
  (`npm run relay`, `Dockerfile.relay`), deployed beside the site. Each game
  (`server/rooms.ts`) draws its land as it opens, a seed and a size
  (standard), and seats up to twenty persons, every lord, the seats no one
  took being bots. As on OpenFront there is no room to wait in: one public game
  is always in its opening, which lasts 30 seconds online
  (`ONLINE_OPENING_TICKS`, sent with the game, so that every browser has the
  same). It begins as it opens, bots in every seat, its turns flowing from
  the first and kept while players may come in; whoever joins sits at once
  on the first free seat, given the land, the opening and every turn played
  so far, and his seat is a person's from the next turn, on every browser.
  No one comes in during the opening's last 5 seconds, so that the last to
  come may still plant his standard, nor once twenty have come: then the
  game goes on with whoever came, and the next opens; if no one came, it is
  dropped and a new land takes its place (`server/rooms.test.ts` runs that
  cycle on a clock of its own). Anyone may see it without joining it: the
  relay answers `GET /public` with its seed and size, the ms left to join it
  and the seats taken, never cached and open to any page (CORS), for it
  tells nothing that joining would not. A private room gathers its players
  first and begins on its host's word, its players seated from the first
  turn, with the same opening. A player who leaves a game gives his seat
  back to a bot, on every browser at the same turn. Every 50 turns each
  browser tells the fingerprint of its state, and the relay names the first
  turn where two differ (`server/checks.ts`).
- In the browser, `link.ts` is the line to the relay, and its address for
  the public game, which the home asks every second and a half while it is
  shown, as OpenFront asks for its lobbies (`useUpcoming.ts`); the home
  takes the player into it, or into a private room shown live
  (`useRoom.ts`); when the relay says the game begins, the open line is left
  in `online.ts` and `/play?online` mounts the game on the land the relay
  drew, with `remote.ts`'s session, stepped by the relay's turns, instead of
  the local one. Who comes in during the opening plays the turns so far as
  they come, twenty a frame, and is in the opening within a second.
- Each browser applies the turns to its own copy of the game, bots included:
  a distant player is one more seat the session receives from outside, as a
  bot is (`src/render/remote.test.ts` plays a game on two browsers, one from
  its first turn and one come in during the opening, and finds the same
  state). Watching a game, or replaying one, is receiving or replaying the
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
