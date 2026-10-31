# Rules

The game as it plays today. Every number here comes from `RULES` in
`engine/rules.ts`, the only place the rules' figures live; the code that
applies each rule is named beside it.

## The land

- The map is grown from a seed (`engine/map/`): the same seed draws the same
  land on every machine. Its shape is one of six families (a continent, a
  coast, an inland sea, two lands and a neck, a strip between two seas,
  fjords), with peninsulas, bays and capes; it is one piece, with no
  islands. Lakes lie inland; an army crosses them, and the sea, only by
  boat (below). Rivers,
  hills, woods, plains and the lower mountains are drawn only: they change
  nothing to the rules; the high mountains close the ground (below). The land is cut into a fine grid of tiles, four map units a side
  (`engine/grid.ts`), some 53,000 tiles of land.
- The game's lands are raised by the relief's generator since 29/10
  (`generator: 'relief'`; the first, `classic`, stays for the arena), with
  **high mountains** that close the ground as
  the sea does: no one takes, crosses or builds on their tiles, and no
  caravan's road goes over them. They stand in ranges, some 9 % of the land
  (as much land is left to play as on today's maps), cut by **passes** a few
  tiles wide, the ranges' fronts and chokepoints; the land is always one
  piece through them. On the map, a range is washed in stone and ringed in
  ink, a mount on each of its cells; a pass is the gap the range leaves
  (`src/render/layers/peaks.ts`).
- **Maps of the real Earth** (`engine/map/atlas.ts`): the British Isles
  (small), France (middling), the Mediterranean and Europe (large), the
  World (huge); and two lands of legend, Middle-earth (large) and Westeros
  with Essos (huge),
  drawn by our own hand (`scripts/legend.ts`), never traced; each ground baked from the world's heights, its great lakes
  and main rivers real; a map of some lands only, as France or the British
  Isles, draws its neighbours' land **dead**: dulled, no one's, no army
  enters it nor any work stands there, as the high mountains (country
  outlines from Natural Earth, public domain); each map has its own size and the lords it suits, its islands kept
  apart and its straits open (an island is reached by boat), its high
  mountains on the real ranges. Every piece of land the water touches is in
  the game, the islands with the rest (20 tiles at least, `isle`); only a piece the high mountains close
  all round is not.
- A map has a **size** (`MAP_SIZES`): small (half the land), standard,
  large (twice) or huge (four times). The game's book offers its lands as a
  list of cards, the smallest first: the invented land small, middling or
  great, and the maps of the Earth, each with the lords it suits
  (`/play?size=huge` draws the huge one). Its tiles and cells keep their size: a larger land has more of
  them, and more lakes, rivers, ranges and woods.
- **The rivers are water** (`engine/map/streams.ts`): every tile of land
  under a river's course is water, a tile wide at its spring and three at its
  mouth. No one holds it; armies cross it by boat from any bank, as the sea
  (or go round by its spring when that is sooner), ports stand by it and
  ships sail it. It is drawn as the sea is, at every distance.
- The game is played on one piece of land: a tile the sea cuts off, which
  no walk reaches, is no part of it (`engine/land.ts`).
- What no lord holds is one **free land**. It only defends itself, by its
  villagers: each free tile is held by half the men that hold the mean lord's
  tile (`engine/war.ts`), and never fewer than 0.1 man, so that a small army
  does not nibble for ever. Each free tile taken brings 0.1 gold: some 60 for
  as much land as a lord starts with.

## The opening

For the first 10 seconds (30 online, the time for players to come into the
public game, `SETUP_LIMITS.opening.public`) no land is anyone's: each lord plants his
**standard** on any tile of the land by clicking it, as on OpenFront, and
may move it as often as he likes until the count ends, but never within 20
tiles of another lord's standard: the first to plant holds the ground round
his (`engine/opening.ts`). When the opening ends each lord receives the land
within 14 tiles of his standard, some 600 tiles, walking from it over the
land, never across the sea or a lake; where two starts overlap, each tile
goes to the nearer standard, to the lower seat of two as near. His first
village stands on his standard's tile, its peasants all there. A lord who
has planted none is given the spot with the most room: where his start is
whole, out of the sea's way, and the farthest from the others' standards.
While the count runs, no land is drawn on the map: only the bare land and
the standards. Every lord starts with 50 gold.

## The public game

The game online that anyone joins from the home (`server/rooms.ts`,
`publicSetup` in `engine/setup.ts`), as Cédric set it (« en ligne il faut 0
bot », « le matchmaking classique il ne doit pas ajouter de bot »):

- **No bot**: up to 20 persons, every lord for himself, on a standard land
  drawn at its opening and shown on the home's card, with an opening of 30
  seconds. Whoever plays comes straight into its opening, on the first free
  seat, to plant his standard; no one comes in during its last 5 seconds,
  nor once twenty-four have come.
- A seat no person takes stays **empty**: no lord there, given no standard
  and no land, counted for nothing in the race (`engine/opening.ts`).
- **No one wins alone**: one person alone when the doors close sees the
  opening begin again on the same land, his standard still planted, and the
  home's card says a lord is waiting. No one there, the game is dropped and
  a new land takes its place.
- A player who **leaves** leaves his lord **idle**: his land is there to be
  taken, his peasants defend it, and no bot takes it over.
- It is won as any game (see Winning).

A private room, joined by its code, still seats bots of the fair level in
the seats its players leave free, until its host may set them; a player who
leaves it gives his seat back to its bot.

## Peasants and gold

- The **land** feeds the **peasants**, more as it grows but fewer by the
  tile: 40 on 600 tiles (about a start's land), as the square root of its
  size, so that four times the land feeds twice the peasants; each
  **village** feeds 60 more. A start, its land and its village, feeds 100. An
  empty gauge fills in 60 seconds, and no one is born above the cap.
- **Sickness**: peasants over the cap (land or a village lost, an army come
  home) fall sick, and a tenth of those over it die each second, until the
  cap.
- The peasants hold the land, spread over it: a tile is held by its lord's
  peasants divided among his tiles.
- **Gold** comes from the merchants alone: each **market** sends caravans,
  and a caravan arriving pays both its markets (see Merchants). There is no
  gold by the second.
- Men are raised from the peasants for free: gold pays for works and
  mercenaries. (Paying a man raised in gold stalled the games past forty
  minutes; the price stays in `RULES.menPrice`, at 0.)

## War

- Three armies, which differ by their size and their pace: the **small
  troop** (`raid`) takes 10 % of the peasants and goes half again as fast, the
  **troop** (`host`) 25 % at the common pace, the **large troop** (`ban`) 50 %
  and goes at half the pace, on the march and at the front alike (keys 1 to 3; the mercenaries, below, key 4).
- A left click on another's land, or on free land, raises the army in hand
  at one of the lord's free **villages**, the nearest by the march to where it
  enters (below): each village levies one army at a time from its people, so
  a lord has as many armies out as he has villages (`engine/muster.ts`). With
  every village's army out, a click raises none.
- **Recall**: the engine knows the order (`recall`: an army's survivors go
  back to his peasants, the mercenaries their way, its village or market free
  again), but no piece of the HUD sends it since 29/10: a click on an army's
  banner, bottom right, brings the camera to it instead.
- **Mercenaries** are hired at a **market** for gold: a company of a quarter
  of the lord's cap of peasants, 2 gold a man (as many as the gold pays,
  short of it), from his free market nearest by the march, one company a
  market at a time. They take no peasants, so the land holds as well while they
  fight; when they are done their survivors go their way instead of home.
  They march and fight as the host does. In the bar their seal is gold, apart
  from the three levied at a village; the bots hire them when they have the
  gold for a full company.
- The army first **marches** to the front over its lord's own land and his
  allies', 6 tiles a second, seen by all: a lord met only beyond an ally's
  land may be struck through it, and an alliance broken on the road sends the
  army home. Then it enters by a border tile and pushes on towards the click,
  in a **band** as wide as its men (6 tiles each side of its line, plus the
  square root of its men: 16 for 100 men), past the click while it has men,
  at most 3 tiles a tick, whatever its size: more men go further, never
  faster; it never swells into a ball (`engine/war.ts`, its band
  `engine/band.ts`). Free land, which hardly holds, it takes twice as fast
  (`freePace`, 200 %).
- **Where it will be spent** (`engine/reach.ts`): the click
  gives a direction, and the army goes on to where its men will all be
  spent on that line, worked out by its push played over in
  thought on the land as it is (what each tile costs, the castles, its
  band); while aiming and on its way, its course is drawn in dashes fading
  out where its men will be spent, an arrow and a red target's cross where
  it is aimed, no banner; worked out again each second, back when a battle
  costs it men.
- **The land's roughness**: each tile bears a little roughness, fixed and
  drawn from the map's seed, an unseen relief smooth over a mesh of 5 tiles,
  at most 3 tiles' worth, added to the order an army takes tiles in; each
  lord reads it shifted by his own offset. It bends the band's edge too, up
  to 3 tiles in or out. Two fronts meet in a ragged line,
  as a coast, rather than a straight one (`engine/rough.ts`).
- **The entry that brings it soonest**: of the border tiles from which the
  click can be reached over the lord's land, no high mountain nor sea
  crossed, the army enters by the one that brings it to the click soonest;
  with none, nothing is sent, counting its march
  from the free village (or market) nearest by the march, then its way
  across the enemy's land, straight to the click. That way is slow: the
  bulge's tip goes only as fast as it fills the land behind it, about a
  square of tiles as deep as the way, no wider than its band, at its 3 tiles
  a tick, so 10 tiles deep take some 3 seconds and 20 some 13, where the
  march covers 6 tiles a second. When the lord's land borders the enemy's on
  two sides, a click near the far side sends the army in by the near side
  and straight across if the way round is long, and round to the far side
  only if that is truly sooner. The same course is drawn under the pointer
  before the click. With no village free, the aim shows the border tile
  nearest the click.
- **A lord the land does not touch**: with free land between the two, the
  army enters by the free land and takes it on its way, straight towards the
  click, then strikes the lord without stopping (`engine/course.ts`,
  `through`). Another lord's land in between still bars the way, unless he
  is an ally.
- **Across the water** (`engine/crossing.ts`, as on OpenFront): a land no
  road reaches by land, the army reaches by boat. It lands on the shore of
  that land nearest the click (the free land's, taken on its way, when the
  lord's own reaches no water); it walks its lord's land to the coast that
  brings it there soonest, the crossing counted, takes to the water from any
  tile of it, no port needed, and sails a tile a step, as it walks. At sea it
  takes nothing and fights no battle; it is seen as a boat under its
  standard. Then it strikes from where it landed, as from a border. Its
  sounds: a boat's creak and an oar when mine takes to the water, oars up
  close.
- **The woods** (`grid.wood`, the forest cells): an army marches there at 60 %
  of its pace, and each tile of woods it takes costs its front as much more
  time (`forestPace`).
- **The merchants' roads** (`engine/paving.ts`): an army marches on them at
  150 % of its pace (`roadPace`), a road through the woods a road. Its march
  is sought by what each step costs, not by tiles: it takes a road when the
  road brings it sooner, the way the aim draws (`stepCost`).
- Every tile taken costs the army as the **combat table** says, against the
  men who hold it (the lord's peasants divided among his tiles, half as many
  while he bears the traitor's mark; the villagers on free land):

  | The army against                       | It loses, per man of the other |
  | -------------------------------------- | ------------------------------ |
  | peasants                               | half a man (1 for 2)           |
  | peasants within 12 tiles of a castle   | a man (1 for 1)                |
  | an army in the field                   | a man (1 for 1)                |
  | an army defending under its own castle | two men (2 for 1)              |

  A lord's tile costs at least a tenth of a man however thin his land
  (`leastCost`), so that an army never runs on without end against a lord
  with no men left; the free land costs only what its villagers hold.
  The army fights until it cannot pay the next tile, then its survivors go
  home.

- **Battles**: an army in a lord's land, taking it, and an army of that lord
  that come within 8 tiles of each other, a way over the land joining them
  no more than twice as long as the straight line (round a mountain, a lake
  or a bay; no farther round, they pass each other by), stop and walk that
  way to meet in its middle, each its half, where the battle is drawn, which
  takes them as long as half the way, then fight there when they touch
  until one is gone; an even battle lasts some 4 seconds, so that it is seen. Any other army passes by:
  none is drawn into a war it was not sent to (`engine/battle.ts`).
- An army whose road is cut by the lord it marches on strikes him from where
  it stands; cut by anyone else, it goes home.
- **Encircled land**: a piece of a lord's land, or of the free land, that
  touches one lord alone all round (no sea, no edge of the map) passes to him
  whole, with its works; a lord wholly ringed by one other loses everything.
  A piece under 200 tiles, free or a lord's, is his even if the sea or the
  map's edge closes the rest of the ring: one lord beside it, and no other,
  is enough; never a whole coastal realm, nor a great free island where one
  boat landed, which is taken tile by tile. Allies never take each other's
  land so (`engine/enclosure.ts`).

## Works

Four works, placed anywhere on one's own land (keys 5 to 7, and P the
port), each with its footprint (3 tiles, 2 for a port), two works at least
their two footprints apart so that none lies on another (`workRoom`);
castles stand at least 10 tiles from one another; a port only on a tile by
the water (`engine/works.ts`). With one in hand, the tiles it may stand on
are lit and the rest darkened (`roomFor`):

- the **village** feeds 60 more peasants and levies the armies, one at a time;
- the **market** sends the caravans that bring the gold;
- the **port** sends the merchant ships, to other lords' ports only, and fits
  out the warships;
- the **castle**: the land within 12 tiles of it fights as the combat table
  says, one for one; it sends no army, but its archers shoot into that land:
  every 3 seconds, from the moment it stands, it looses a volley at each
  enemy army fighting there (an army striking its lord whose front lies
  within the 12 tiles), which loses 5 % of its men, one at least; an army
  striking someone else passes by (`engine/volleys.ts`).

The first village and market cost nothing, so that a lord can always start
again from nothing; then each costs double the one before (100 gold for the
second). A castle costs 200 gold, a port 150, then double. Three doublings at most. A
work is taken with its tile, and stands idle 8 seconds before it serves its
new lord, as a work being built does (`seizedTicks`): no levy, no trade, no
volley, so that a fight does not turn at once on what it took.

A work takes time to build, and serves only once done: 10 seconds for a
village, a market or a port, 20 for a castle.

## Alliances and traitors

`engine/diplomacy.ts`, from the menu a right click opens on a lord's land
(attack, alliance, offering), or on the map: the herald's letter of an offer
made to you, the seal of an alliance to renew:

- One order offers an alliance, accepts one offered, or renews one. An offer
  waits 20 seconds.
- An alliance lasts 5 minutes. In its last 30 seconds both lords may renew
  it; it is renewed once both have asked. Left to run out, it makes no traitor.
- Allies never strike each other: when an alliance is sealed, their armies
  against each other go home.
- Breaking an alliance is immediate and seen by all: the breaker bears the
  **traitor's mark** for 30 seconds, his land holding half as well.
- **Teams**, in a game the host sets so: teammates are allies for good,
  whom no order binds nor breaks, so no traitor among them; they never
  strike each other and their armies cross each other's land. A team wins
  together, when its members' land added up holds the share that wins (or
  it is the last side standing); its member with the most land is named the
  winner. Without teams every lord plays for himself.
- An **offering** gives another lord a quarter of one's gold, from the
  right click's menu, which shows how much. It is remembered 2 minutes: a
  bot that received it leaves the giver in peace the while (it opens no war
  on him, though it still answers an army of his), and accepts his alliance
  though it fights him or holds two allies already (three at most). Between
  players it is a gift or a ransom, nothing more; the lord who receives one
  is told, on the giver's land, and how much.

## Merchants

`engine/caravans.ts`:

- **The trade network**: each market reaches 40 tiles. Two markets within
  range of each other are joined by a road over the land, whoever holds them,
  unless a third market lies nearer to both (`engine/network.ts`). A road
  runs in long straight runs across, down and aslant, as OpenFront's railways, few
  turns, a step off the water where the land allows; it is drawn on its own
  tiles, and a village in hand lights the tiles where it would be a relay.
- Every 10 seconds, each market may send a caravan to another market, its
  lord's own or another lord's, never one of a lord at war with his (an army
  of either sent at the other), drawn by lot among all those the network
  reaches: the farther and the allies' more often (the chance goes with the
  road's length, twice for an ally, half for his own). It goes along the network's roads, through as many markets as it
  takes, over any land, as OpenFront's trains, but a lord's at war with its
  own, who bars the way. The more
  caravans its lord has on the roads, the less often it sends one: with 6 out,
  one time in two.
- It makes one journey at 4 tiles a second. Arriving, it pays both markets
  0.15 gold for each tile of its road, twice as much between allies; between
  two markets of one lord, half as much, paid once.
- **Ports and merchant ships** (`engine/ships.ts`, as OpenFront's): the port
  is a work of its own, by the water, never a market: markets trade by
  caravan with markets, ports by ship with ports. Every 15 seconds a port may
  send a ship to a port of another lord the same water reaches, never one at
  war with its own, the far ones and the allies' more often (fewer the more
  ships its lord has at sea: with 4 out, one time in two). It sails the
  shortest way over the water at 8 tiles a second and, arriving, pays both
  ports 0.15 gold a tile of its way, twice as much between allies.
- **Warships** (`engine/warships.ts`, as OpenFront's): taken from the bar
  (key B) and a click on the water, one is fitted out at the lord's port
  nearest that point by sea and sails there, 6 tiles a second; with no port
  of his reaching it, nothing is built nor paid. It costs 200 gold, doubled
  with each of his afloat, three times at most. It patrols within 12 tiles of
  its point, and a click on it then on the water sends it elsewhere on the
  same water. Every 2 seconds it shoots at what of a lord not its ally lies
  within 3 tiles: a warship first, which sinks at its fourth shot; then an
  army's boat crossing, sunk with its men; then a merchant ship not bound for
  its own lord's port, taken, its gold for him. Within its patrol it makes for
  the nearest of them. Bots fit one out now and then, one for 600 tiles
  beyond the first, three at most, off an enemy's port.
- **Relays** (`engine/relays.ts`, as OpenFront's stations): each village
  within 2 tiles of its road, once a caravan, pays its own lord and the
  caravan's (the same lord once): 3.5 gold between allies, 2.5 between other
  lords, 1 for a lord's own caravan. Nothing is taken from the merchant; the
  "+" of gold rises over the village for whoever gains it.
- An enemy, a lord at war with its own, who takes a tile of its road ahead takes the caravan: it turns to
  his nearest market and pays him alone. If he has none it can reach, it is
  plundered.

## Coups

`engine/coups.ts`: three purchases that may turn a game, each its own deed,
launched from the bar (keys 8, 9 and 0), the cheapest first, then a click on the target. Each
costs twice as much with each launched, eight times at most, and is seen
coming.

| Coup         | Price | Reach                    | Effect                                                                                                                                                                                                 |
| ------------ | ----- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Volley       | 200   | 5 tiles from the border  | A volley falls 2 seconds later on 4 tiles round: every enemy army under it loses 30 % of its men. Land and peasants are untouched.                                                                     |
| Troublemaker | 300   | any land of another lord | Walks from the border at the armies' pace; there, 6 tiles round turn free, their works lost, held by rebels twice as well as free land and never encircled. An army of that lord meeting him ends him. |
| Trebuchet    | 1000  | anywhere on the map      | The heavy weapon, as OpenFront's bomb: its flaming stone falls 8 seconds later; the works of enemies within 12 tiles burn, and no one may build there for a minute. No one dies.                       |

## Winning

`engine/step.ts`:

- A lord who holds no land is out.
- A lord who holds **80 %** of the land wins. From the tenth minute the share
  needed drops by 5 points a minute, down to 50 %.
- The last lord standing wins, or the last side, in a game begun with more
  than one: one begun with a single side (every lord in one team) is won by
  the share alone.
