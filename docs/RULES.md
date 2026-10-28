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
domain; he takes it whole, village included. A lord who has not chosen is
given one when the opening ends. Every lord starts with 50 gold.

## Peasants and gold

- A land feeds **peasants**: 50, plus 0.3 a tile, plus 50 a village. An empty
  gauge fills in 60 seconds, and no one is born above the cap.
- The peasants hold the land, spread over it: a tile is held by its lord's
  peasants divided among his tiles.
- **Gold** comes at 5 a second for every lord, plus what the caravans bring.
- Men are raised from the peasants for free: gold pays for works. (Paying a
  man in gold stalled the games past forty minutes; the price stays in
  `RULES.menPrice`, at 0.)

## War

- Three armies, which differ only by their size: the **raid** takes 10 % of
  the peasants, the **host** 25 % and the **levy** 50 % (keys 1 to 3).
- A left click on another's land, or on free land, raises the army in hand.
  It enters by the border tile nearest the click and spreads from there
  towards it, at most 3 tiles a tick, whatever its size: more men go further,
  never faster (`engine/war.ts`).
- Every tile taken costs the men who hold it: the lord's share of his
  peasants, three times as many on land within 12 tiles of one of his castles,
  half as many while he bears the traitor's mark; the militia on free land.
  The army fights until it cannot pay the next tile, then its survivors go
  home.
- Two armies that strike each other clash, man for man.

## Works

Three works, placed anywhere on one's own land (keys 4 to 6), at least 10 tiles
from another work (`engine/works.ts`):

- the **village** feeds 50 peasants more;
- the **castle** makes the land within 12 tiles of it hold three times better;
- the **market** sends caravans.

A work costs 100 gold, doubled for each one of its kind the lord already holds
(three doublings at most). It is taken with its tile.

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
