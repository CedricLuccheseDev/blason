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
- Raid 10 % of the peasants, a quarter faster; host 25 %; levy 50 %, a
  quarter slower; mercenaries bought with gold at a market. One army a village
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
- Confidence: Preliminary. Open question: may warships sink armies at sea? —
  Cédric, with the warships (10).

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
