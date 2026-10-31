# 03 — War

How land changes hands. Figures: `docs/RULES.md` (War).

## D-WAR-1: Armies raised from the peasants at the villages

- Status: Accepted
- Owner: Cédric
- Updated: 2026-10-28
- Scope: every lord, bots included
- Links: P1; D-ECO-1

#### Why?

- Need: one lever (how many men, how fast) instead of unit types.
- Outcome: « Lever une armée … les armées partent du château le plus proche.
  comme ça on voit l'attaque arrivé » (28/10), then the villages levying.
- Evidence: OpenFront's one attack ratio is learnt in a minute; « un soldat
  vaut pour 2 paysans » gives the table its feel.
- Alternatives: units built and moved — against P1.
- Tradeoff: no unit skill; strategy is where and when.

#### How?

- A click on another's land raises the army in hand at a free village and
  sends it there: seen marching, then entering by the border that brings it
  soonest to the click, then a front that takes tiles towards it.

#### What?

- Small troop 10 % of the peasants, 50 % faster; troop 25 %; large troop
  50 %, 50 % slower (tried on 30/10, « Essaye le -50 +50% »); mercenaries bought with gold at a market. One army a village
  (or market) at a time. Combat table in `RULES.md`.
- Acceptance: Given every village's army out, When the player clicks an
  enemy's land, Then no army leaves and the cursor shows the army's seal
  struck through.

#### Validation

- Confidence: Supported (arena: games end by share in 19–30 minutes).
- Revisit trigger: a dominant army choice in playtests.

## D-WAR-2: A lord's land is never free

- Status: Accepted
- Owner: Cédric
- Updated: 2026-10-30

#### Why?

- Outcome: « la frontiere adverse augmente alors que y'a pas d'unité c'est
  infini ». Evidence: armies ran without end against an empty land.

#### What?

- A lord's tile costs an army at least a tenth of a man (`leastCost`).

#### Validation

- Confidence: Supported (arena).

## D-WAR-3: Battles met halfway, round what stands between

- Status: Accepted
- Owner: Cédric
- Updated: 2026-10-30
- Links: P2, P3

#### Why?

- Outcome: « ils faut qu'ils se rencontre au point central de leur
  déplacement, si le milieu a vol d'oiseau est obstrué il faut contourné et
  ils se rencontrent quand ils se touchent », then « Oui » to the bound below.

#### How?

- Two enemy armies within 8 tiles, one in the other's lord's land, stop and
  each walks its half of the shortest way over the land between them; they
  fight where they touch.

#### What?

- The way must be at most twice the straight line, else they pass by (as
  across the sea).
- Acceptance: Given a mountain wall with a gap, When the way round is ≤ 2× the
  line, Then they meet in its middle; else they pass (engine test).

#### Validation

- Confidence: Preliminary.

## D-WAR-4: The woods slow armies

- Status: Accepted
- Owner: Cédric
- Updated: 2026-10-30
- Links: P1, P2

#### Why?

- Outcome: « les arbres il faudra une utilité par exemple ça freine les
  troupes »; « la foret doit donner un malus de vitesses aux troupes ».
- Tradeoff: one more thing to read on the map; the woods are drawn as a mass
  so they read at a glance.

#### What?

- In the woods an army marches at 60 % of its pace and its front takes the
  woods' tiles as much slower (`forestPace`, tunable; a placeholder value).

#### Validation

- Riskiest hypothesis: 60 % is felt without being a wall.
- Method: playtests; the arena's take rate.
- Confidence: Untested.

## D-WAR-5: Castles and their volleys

- Status: Accepted
- Owner: Cédric
- Updated: 2026-10-29

#### What?

- A castle makes the land within 12 tiles hold twice as well and shoots at
  armies in its reach (`RULES.md`, Works and War).

#### Validation

- Confidence: Supported.

## D-WAR-6: Crossing the water from any coast

- Status: Accepted
- Owner: Cédric
- Updated: 2026-10-30
- Links: P1; D-WLD-5, D-ECO-6

#### Why?

- Outcome: « les armées qui traversent l'eau vers une autre rive »; « de
  n'importe quelle tuile comme openfront »; « il faut y aller a la mer dans ce
  cas la » (when the land's way goes far round).
- Evidence: OpenFront's transport ships from any coast.

#### How?

- With no land way, or a land way that goes far round and the sea sooner, the
  army walks to its best coast, sails (seen as a boat under its standard) and
  lands on the shore nearest the click, then strikes from there.

#### What?

- At sea it takes nothing and fights no battle; no port needed.
- Acceptance: Given two lands across a strait, When a lord attacks the other,
  Then his army sails and takes its landing (engine test).

#### Validation

- Confidence: Preliminary. Warships sink them at sea (D-WAR-8).

## D-WAR-7: Encircled land

- Status: Accepted
- Owner: Cédric
- Updated: 2026-10-30

#### Why?

- Outcome: « quand on entoure même par de la mer des zones grises ça les prend
  automatiquement »; then only small pieces, once islands came in (« Ok »).

#### What?

- Land ringed by one lord passes to him whole; the sea counts as a wall only
  round a piece under 200 tiles.

#### Validation

- Confidence: Supported.

## D-WAR-8: Warships

- Status: Accepted
- Owner: Cédric
- Updated: 2026-10-30
- Scope: maps with water; every mode
- Links: P1; D-ECO-5, D-ECO-6, D-WAR-6

#### Why?

- Need: the merchant ships make gold at sea and nothing threatens them; the
  sea has no war of its own.
- Outcome: warships, proposed 30/10; « On peut l'envoyer autre part aussi »;
  « fais comme open front tu choisi une position sur l'eau et il part du port
  le plus proche »; « Oui » to sinking the armies' boats (Cédric, 30/10).
- Evidence: OpenFront's warships, built at a port, patrolling, taking trade
  ships and sinking transports, moved by a click (mechanism read, not
  copied).
- Alternative left: warships carrying armies — the boats of D-WAR-6 already
  do, from any coast.

#### How?

- Chosen in the bar as a work, its price doubling with each, then a click on
  the water: it is built at one's port nearest that point by sea and sails
  there to patrol round it. None if no port of one's own reaches that water.
- Selected, then a click on the water it can reach, it sails there and
  patrols there.
- It takes the merchant ships of lords not allied that pass near: their gold
  goes to its lord, the ship gone. It sinks the boats of enemy armies
  crossing (D-WAR-6), their men lost. It fights the warships of lords not allied
  that it meets, shot for shot, until one sinks.
- Seen on the map as a ship of war under its lord's colours; heard as a shot
  of the guns, the hulls' crash, a bell when a ship is taken (D-SND-1).

#### What?

- Parameters (tunable, `RULES`): its price as a castle's; patrol within 12
  tiles of its point; takes a ship within 3 tiles; 4 shots to sink, one every
  2 s.
- Edge cases: the port it left taken or destroyed, the warship sails on; it
  never leaves the water it was built on; a click on water no port of one's
  own reaches builds nothing and costs nothing.
- Acceptance: Given a merchant ship of an enemy passing within 3 tiles of a
  warship, When the step runs, Then the ship is taken and its gold goes to the
  warship's lord (engine test).

#### Validation

- Riskiest hypothesis: the bots' warships don't make the sea a nuisance where
  merchant ships stop paying.
- Method: arena (gold from ships before and after), then played on Britain
  and the Mediterranean.
- Confidence: Untested.

## D-WAR-9: The standard where the army will be spent

- Status: Accepted
- Owner: Cédric
- Updated: 2026-10-31
- Links: D-WAR-1, P1

#### Why?

- Need: « On pose un porte étendard mais les troupes vont au delà, est ce que
  c'est logique ? » The click gives a direction (28/10, « c'est pour donner une
  direction pas un point d'arret »), but the standard planted on it said
  « my army goes there », a lie a new player reads first.
- Alternatives left: stopping at the standard (« au final c'est pas l'objectif
  de s'arrêter »); widening round it (« si une armée adverse arrive comment on
  fait »); the standard moving with the front.
- Tradeoff: an estimate, the land moving while the army marches; asked again
  each second.

#### How?

- While aiming, the dotted course runs from the entry through the pointer to
  where the army's men will be spent, the ghost of its standard there; short
  of the pointer, the tile aimed at is ringed in red. A small army falls
  short, a large one goes far, a well held lord or a castle pulls it back:
  the army's size is read as its reach, untold.
- On its way, its standard stands at that point, set again each second.
- With it, the free land taken twice as fast: « je sais pas si l'assaut de
  zone vide est satisfaisant, ça peut être long ».

#### What?

- `reachOf` (`engine/reach.ts`): the army's push played over in thought, as
  `war.ts` plays it, on the land as it is: from its entry, across its lord's
  land in its band, each tile at its price (`priceOf`), the cheapest way
  first, until the next is not paid; the reach is the tile taken farthest
  on its line. `freePace` 200 % (tunable).
- Acceptance: Given an army sent over even free land, When its push ends,
  Then it ends within 2 tiles of the reach worked out as it was sent
  (`engine/reach.test.ts`).

#### Validation

- Riskiest hypothesis: the reach moves little enough, as the army marches,
  for the standard to be trusted.
- Method: played; the arena for the game's length with the free land faster
  (4 games of 20 bots, 22 to 26 minutes, all won by share).
- Confidence: Supported (tests, arena), untested in play.
