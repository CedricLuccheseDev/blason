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
- A map has a **size** (`MAP_SIZES`): standard, large (twice the land) or
  huge (four times), chosen by `/play?size=large` or `huge` until the home
  offers it. Its tiles, cells and free domains keep their size: a larger
  land has more of them, and more lakes, rivers, ranges and woods.
- At the start the whole land is shared into **free domains**, each around its
  village, one village for some 600 tiles, for the lords to choose where they
  start (`engine/land.ts`).
- Once the opening is over, the free domains and their villages are gone:
  what no lord holds is one **free land**. It only defends itself, by its
  villagers: each free tile is held by half the men that hold the mean lord's
  tile (`engine/war.ts`), and never fewer than 0.1 man, so that a small army
  does not nibble for ever. Each free tile taken brings 0.1 gold: some 60 for
  what was a domain.

## The opening

For the first 10 seconds no land is anyone's: each lord plants his
**standard** on the free domain he wants by clicking it, and may move it as
often as he likes until the count ends. The first to plant holds a domain:
no other standard may stand on it, nor on a domain touching it. When the
opening ends each lord receives his standard's domain whole, its village
included; a lord who has planted none is given the free domain farthest from
the others' standards. While the count runs, no land nor domain is drawn on
the map: only the bare land, the free villages and the standards.
Every lord starts with 50 gold.

## Peasants and gold

- Every resource comes from a work: without one, none. Each **village**
  feeds 100 **peasants**; the land alone feeds none. An empty gauge fills in
  60 seconds, and no one is born above the cap.
- **Sickness**: peasants over the cap (a village lost, an army come home)
  fall sick, and a tenth of those over it die each second, until the cap.
- The peasants hold the land, spread over it: a tile is held by its lord's
  peasants divided among his tiles.
- **Gold** comes from the merchants alone: each **market** sends caravans,
  and a caravan arriving pays both its markets (see Merchants). There is no
  gold by the second.
- Men are raised from the peasants for free: gold pays for works. (Paying a
  man in gold stalled the games past forty minutes; the price stays in
  `RULES.menPrice`, at 0.)

## War

- Three armies, which differ by their size and their pace: the **raid**
  takes 10 % of the peasants and goes a quarter faster, the **host** 25 % at
  the common pace, the **levy** 50 % and goes a quarter slower, on the march
  and at the front alike (keys 1 to 3).
- A left click on another's land, or on free land, raises the army in hand
  at the lord's free **village** nearest the front: each village levies one
  army at a time from its people, so a lord has as many armies out as he has
  villages (`engine/muster.ts`). With every village's army out, a click
  raises none.
- The army first **marches** to the front over its lord's own land, 6 tiles a
  second, seen by all. Then it enters by the border tile nearest the click and
  pushes on towards it, in a **band** as wide as its men (6 tiles each side of
  its line, plus the square root of its men: 16 for 100 men), past the click
  while it has men, at most 3 tiles a tick, whatever its size: more men go
  further, never faster; it never swells into a ball (`engine/war.ts`).
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
  that come within 8 tiles of each other, with no sea between them, stop and
  walk to meet halfway, which takes them as long as the way, then fight there
  until one is gone; an even battle lasts some 4 seconds, so that it is seen. Any other army passes by:
  none is drawn into a war it was not sent to (`engine/battle.ts`).
- An army whose road is cut by the lord it marches on strikes him from where
  it stands; cut by anyone else, it goes home.
- **Encircled land**: a piece of a lord's land, or of the free land, that
  touches one lord alone all round (no sea, no edge of the map) passes to him
  whole, with its works; a lord wholly ringed by one other loses everything.
  Allies never take each other's land so (`engine/enclosure.ts`).

## Works

Three works, placed anywhere on one's own land (keys 4 to 6), at least 4
tiles from any other work so that none lies on another; castles stand at
least 10 tiles from one another (`engine/works.ts`):

- the **village** feeds 100 peasants and levies the armies, one at a time;
- the **market** sends the caravans that bring the gold;
- the **castle**: the land within 12 tiles of it fights as the combat table
  says, one for one; it sends no army.

The first village and market cost nothing, so that a lord can always start
again from nothing; then each costs double the one before (100 gold for the
second). A castle costs 200 gold, then double. Three doublings at most. A
work is taken with its tile.

A work takes time to build, and serves only once done: 10 seconds for a
village or a market, 20 for a castle.

## Alliances and traitors

`engine/diplomacy.ts`, by a right click on a lord's land:

- One order offers an alliance, accepts one offered, or renews one. An offer
  waits 20 seconds.
- An alliance lasts 5 minutes. In its last 30 seconds both lords may renew
  it; it is renewed once both have asked. Left to run out, it makes no traitor.
- Allies never strike each other: when an alliance is sealed, their armies
  against each other go home.
- Breaking an alliance is immediate and seen by all: the breaker bears the
  **traitor's mark** for 30 seconds, his land holding half as well.

## Merchants

`engine/caravans.ts`:

- **The trade network**: each market reaches 40 tiles. Two markets within
  range of each other are joined by a road over the land, whoever holds them,
  unless a third market lies nearer to both (`engine/network.ts`).
- Every 10 seconds, each market may send a caravan to a market of another
  lord, drawn by lot among all those the network reaches: the farther and the
  allies' more often (the chance goes with the road's length, twice for an
  ally). It goes along the network's roads, through as many markets as it
  takes, over its lord's land, his allies' and free land, and the land of the
  lords whose markets it goes to; any other lord bars the way. The more
  caravans its lord has on the roads, the less often it sends one: with 6 out,
  one time in two.
- It makes one journey at 4 tiles a second. Arriving, it pays both markets
  0.15 gold for each tile of its road, twice as much between allies.
- An enemy who takes a tile of its road ahead takes the caravan: it turns to
  his nearest market and pays him alone. If he has none it can reach, it is
  plundered.

## Coups

`engine/coups.ts`: three purchases that may turn a game, each its own deed,
launched from the bar (keys 7 to 9) then a click on the target. Each costs
twice as much with each launched, eight times at most, and is seen coming.

| Coup         | Price | Reach                    | Effect                                                                                                                                                                                                 |
| ------------ | ----- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Troublemaker | 300   | any land of another lord | Walks from the border at the armies' pace; there, 6 tiles round turn free, their works lost, held by rebels twice as well as free land and never encircled. An army of that lord meeting him ends him. |
| Archers      | 200   | 5 tiles from the border  | A volley falls 2 seconds later on 4 tiles round: every enemy army under it loses 30 % of its men. Land and peasants are untouched.                                                                     |
| Greek fire   | 1000  | anywhere on the map      | The heavy weapon, as OpenFront's bomb: falls 8 seconds later; the works of enemies within 12 tiles burn, and no one may build there for a minute. No one dies.                                         |

## Winning

`engine/step.ts`:

- A lord who holds no land is out.
- A lord who holds **80 %** of the land wins. From the tenth minute the share
  needed drops by 5 points a minute, down to 50 %.
- The last lord standing wins.
