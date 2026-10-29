# Rules

The game as it plays today. Every number here comes from `RULES` in
`engine/rules.ts`, the only place the rules' figures live; the code that
applies each rule is named beside it.

## The land

- The map is grown from a seed (`engine/map/`): the same seed draws the same
  land on every machine. Its shape is one of six families (a continent, a
  coast, an inland sea, two lands and a neck, a strip between two seas,
  fjords), with peninsulas, bays and capes; it is one piece, with no
  islands. Lakes lie inland and, like the sea, no army crosses them. Rivers,
  mountains, hills, woods and plains are drawn only: they change nothing to
  the rules. The land is cut into a fine grid of tiles, four map units a side
  (`engine/grid.ts`), some 53,000 tiles of land.
- The game's lands are raised by the relief's generator since 29/10
  (`generator: 'relief'`; the first, `classic`, stays for the arena), with
  **high mountains** that close the ground as
  the sea does: no one takes, crosses or builds on their tiles, and no
  caravan's road goes over them. They stand in ranges, some 9 % of the land
  (as much land is left to play as on today's maps), cut by **passes** a few
  tiles wide, the ranges' fronts and chokepoints; the land is always one
  piece through them. On the map, a range is washed in stone and ringed in
  ink, a mount on each of its cells, and each pass marked by two strokes
  facing each other (`src/render/layers/peaks.ts`).
- A map has a **size** (`MAP_SIZES`): standard, large (twice the land) or
  huge (four times), chosen by `/play?size=large` or `huge` until the home
  offers it. Its tiles and cells keep their size: a larger land has more of
  them, and more lakes, rivers, ranges and woods.
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
  nor once twenty have come.
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

- Three armies, which differ by their size and their pace: the **raid**
  takes 10 % of the peasants and goes a quarter faster, the **host** 25 % at
  the common pace, the **levy** 50 % and goes a quarter slower, on the march
  and at the front alike (keys 1 to 3; the mercenaries, below, key 4).
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
  faster; it never swells into a ball (`engine/war.ts`).
- **The land's roughness**: each tile bears a little roughness, fixed and
  drawn from the map's seed, an unseen relief smooth over a mesh of 5 tiles,
  at most 3 tiles' worth, added to the order an army takes tiles in; each
  lord reads it shifted by his own offset. It bends the band's edge too, up
  to 3 tiles in or out. Two fronts meet in a ragged line,
  as a coast, rather than a straight one (`engine/rough.ts`).
- **The entry that brings it soonest**: of all the border tiles, the army
  enters by the one that brings it to the click soonest, counting its march
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
- Every tile taken costs the army as the **combat table** says, against the
  men who hold it (the lord's peasants divided among his tiles, half as many
  while he bears the traitor's mark; the villagers on free land):

  | The army against                       | It loses, per man of the other |
  | -------------------------------------- | ------------------------------ |
  | peasants                               | half a man (1 for 2)           |
  | peasants within 12 tiles of a castle   | a man (1 for 1)                |
  | an army in the field                   | a man (1 for 1)                |
  | an army defending under its own castle | two men (2 for 1)              |

  The army fights until it cannot pay the next tile, then its survivors go
  home.

- **Battles**: an army in a lord's land, taking it, and an army of that lord
  that come within 8 tiles of each other, with no sea between them (the
  straight line from one to the other crosses no tile of sea or lake, not even
  a corner of one), stop and walk to meet halfway, on the tile halfway
  between them, where the battle is drawn, which takes them as long as the way, then fight there
  until one is gone; an even battle lasts some 4 seconds, so that it is seen. Any other army passes by:
  none is drawn into a war it was not sent to (`engine/battle.ts`).
- An army whose road is cut by the lord it marches on strikes him from where
  it stands; cut by anyone else, it goes home.
- **Encircled land**: a piece of a lord's land, or of the free land, that
  touches one lord alone all round (no sea, no edge of the map) passes to him
  whole, with its works; a lord wholly ringed by one other loses everything.
  A piece of free land is his even if the sea or the map's edge closes the
  rest of the ring: one lord beside it, and no other, is enough; so is a
  piece of a lord's land under 200 tiles, never a whole coastal realm. Allies never
  take each other's land so (`engine/enclosure.ts`).

## Works

Three works, placed anywhere on one's own land (keys 5 to 7), at least 4
tiles from any other work so that none lies on another; castles stand at
least 10 tiles from one another (`engine/works.ts`):

- the **village** feeds 60 more peasants and levies the armies, one at a time;
- the **market** sends the caravans that bring the gold;
- the **castle**: the land within 12 tiles of it fights as the combat table
  says, one for one; it sends no army, but its archers shoot into that land:
  every 3 seconds, from the moment it stands, it looses a volley at each
  enemy army fighting there (an army striking its lord whose front lies
  within the 12 tiles), which loses 5 % of its men, one at least; an army
  striking someone else passes by (`engine/volleys.ts`).

The first village and market cost nothing, so that a lord can always start
again from nothing; then each costs double the one before (100 gold for the
second). A castle costs 200 gold, then double. Three doublings at most. A
work is taken with its tile.

A work takes time to build, and serves only once done: 10 seconds for a
village or a market, 20 for a castle.

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
  unless a third market lies nearer to both (`engine/network.ts`).
- Every 10 seconds, each market may send a caravan to another market, its
  lord's own or another lord's, never one of a lord at war with his (an army
  of either sent at the other), drawn by lot among all those the network
  reaches: the farther and the allies' more often (the chance goes with the
  road's length, twice for an ally, half for his own). It goes along the network's roads, through as many markets as it
  takes, over its lord's land, his allies' and free land, and the land of the
  lords whose markets it goes to; any other lord bars the way. The more
  caravans its lord has on the roads, the less often it sends one: with 6 out,
  one time in two.
- It makes one journey at 4 tiles a second. Arriving, it pays both markets
  0.15 gold for each tile of its road, twice as much between allies; between
  two markets of one lord, half as much, paid once.
- An enemy who takes a tile of its road ahead takes the caravan: it turns to
  his nearest market and pays him alone. If he has none it can reach, it is
  plundered.

## Coups

`engine/coups.ts`: three purchases that may turn a game, each its own deed,
launched from the bar (keys 8, 9 and 0), the cheapest first, then a click on the target. Each
costs twice as much with each launched, eight times at most, and is seen
coming.

| Coup         | Price | Reach                    | Effect                                                                                                                                                                                                 |
| ------------ | ----- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Archers      | 200   | 5 tiles from the border  | A volley falls 2 seconds later on 4 tiles round: every enemy army under it loses 30 % of its men. Land and peasants are untouched.                                                                     |
| Troublemaker | 300   | any land of another lord | Walks from the border at the armies' pace; there, 6 tiles round turn free, their works lost, held by rebels twice as well as free land and never encircled. An army of that lord meeting him ends him. |
| Trebuchet    | 1000  | anywhere on the map      | The heavy weapon, as OpenFront's bomb: its flaming stone falls 8 seconds later; the works of enemies within 12 tiles burn, and no one may build there for a minute. No one dies.                       |

## Winning

`engine/step.ts`:

- A lord who holds no land is out.
- A lord who holds **80 %** of the land wins. From the tenth minute the share
  needed drops by 5 points a minute, down to 50 %.
- The last lord standing wins.
