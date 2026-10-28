# Rules

The game as it plays today. Every number here comes from `RULES` in
`engine/rules.ts`, the only place the rules' figures live; the code that
applies each rule is named beside it.

## The land

- The map is grown from a seed (`engine/map/`): the same seed draws the same
  land on every machine. It is cut into a fine grid of tiles, four map units a
  side (`engine/grid.ts`).
- At the start the whole land is shared into **free domains**, each around its
  village, one village for some 600 tiles: there is no empty land
  (`engine/land.ts`).
- A free domain only defends itself, by its militia: 0.2 men a tile, a whole
  man a tile within 3 tiles of its village. Taking a free village gives it to
  the taker with 50 gold.

## The opening

For the first 10 seconds each lord chooses where he starts by clicking a free
domain; he takes it whole, its village included, and a barracks rises near
that village. A lord who has not chosen is given one when the opening ends.
Every lord starts with 50 gold.

## Peasants and gold

- Every resource comes from a work: without one, none. Each **village**
  feeds 100 **peasants**; the land alone feeds none. An empty gauge fills in
  60 seconds, and no one is born above the cap.
- The peasants hold the land, spread over it: a tile is held by its lord's
  peasants divided among his tiles.
- **Gold** comes from the merchants alone: each **market** sends caravans,
  and a caravan arriving pays both its markets (see Merchants). There is no
  gold by the second.
- Men are raised from the peasants for free: gold pays for works. (Paying a
  man in gold stalled the games past forty minutes; the price stays in
  `RULES.menPrice`, at 0.)

## War

- Three armies, which differ only by their size: the **raid** takes 10 % of
  the peasants, the **host** 25 % and the **levy** 50 % (keys 1 to 3).
- A left click on another's land, or on free land, raises the army in hand
  at the lord's free **barracks** nearest the front: each barracks sends one
  army at a time, so a lord has as many armies out as he has barracks
  (`engine/muster.ts`). With every barracks' army out, a click raises none.
- The army first **marches** to the front over its lord's own land, 6 tiles a
  second, seen by all; if its road is cut under it, it goes home. Then it
  enters by the border tile nearest the click and spreads from there towards
  it, at most 3 tiles a tick, whatever its size: more men go further, never
  faster (`engine/war.ts`).
- Every tile taken costs the army as the **combat table** says, against the
  men who hold it (the lord's peasants divided among his tiles, half as many
  while he bears the traitor's mark; the militia on free land):

  | The army against                       | It loses, per man of the other |
  | -------------------------------------- | ------------------------------ |
  | peasants                               | half a man (1 for 2)           |
  | peasants within 12 tiles of a castle   | a man (1 for 1)                |
  | an army in the field                   | a man (1 for 1)                |
  | an army defending under its own castle | two men (2 for 1)              |

  The army fights until it cannot pay the next tile, then its survivors go
  home.

- **Battles**: two enemy armies that come within 8 tiles of each other stop
  and fight where they meet, until one is gone; an even battle lasts some 4
  seconds, so that it is seen (`engine/battle.ts`).

## Works

Four works, one resource each, placed anywhere on one's own land (keys 4 to
7), at least 4 tiles from any other work so that none lies on another;
castles stand at least 10 tiles from one another (`engine/works.ts`):

- the **village** feeds 100 peasants;
- the **market** sends the caravans that bring the gold;
- the **barracks** is where the armies are raised and sent from, one at a
  time;
- the **castle**: the land within 12 tiles of it fights as the combat table
  says, one for one; it sends no army.

The first village, market and barracks cost nothing, so that a lord can always
start again from nothing; then each costs double the one before (100 gold for
the second village or market, 150 for the second barracks). A castle costs 200
gold, then double. Three doublings at most. A work is taken with its tile.

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

- Every 10 seconds, each market sends a caravan to the nearest market of
  another lord, by a road through its lord's land, his allies' and free land.
- It travels 4 tiles a second. Arriving, it pays both markets 0.15 gold for
  each tile of its road, twice as much between allies.
- An enemy who takes a tile of its road ahead plunders it.

## Winning

`engine/step.ts`:

- A lord who holds no land is out.
- A lord who holds **80 %** of the land wins. From the tenth minute the share
  needed drops by 5 points a minute, down to 50 %.
- The last lord standing wins.
