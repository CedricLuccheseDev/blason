# 04 — Economy and trade

Peasants make armies; gold makes works and mercenaries. Figures:
`docs/RULES.md` (Peasants and gold, Works, Merchants).

## D-ECO-1: Two resources, peasants and gold

- Status: Accepted
- Owner: Cédric
- Updated: 2026-10-28
- Links: P1
#### Why?
- Need: a choice between growing and fighting, without bookkeeping.
- Evidence: gold paid by the second, and men paid in gold, stalled games past
  forty minutes (arena) — removed.
- Tradeoff: no third resource; trade must carry the economy's variety.
#### How?
- The land and villages feed peasants up to a cap; armies are raised from
  them for free; gold comes from trade alone.
#### What?
- Cap: 40 on 600 tiles as the square root of the land, +60 a village; fills in
  60 s; over it, a tenth a second die (sickness).
#### Validation
- Confidence: Supported (arena).

## D-ECO-2: Works laid freely, their price doubling

- Status: Accepted
- Owner: Cédric
- Updated: 2026-10-30
#### Why?
- Outcome: « poser librement comme sur openfront des villages / champs /
  château … ça encourage encore + le joueur à bien cliquer au bon endroit ».
#### What?
- Village and market: the first free, then 100 gold, doubling, three doublings
  at most; castle 200, doubling likewise.
#### Validation
- Open question: « pourquoi les prix des constructions n'augmentent pas » —
  the cap at three doublings makes prices flat mid-game; raise the cap or make
  it +25 % without end? — Cédric, decide after a played game.
- Confidence: Preliminary.

## D-ECO-3: Caravans as OpenFront's trains

- Status: Accepted
- Owner: Cédric
- Updated: 2026-10-30
- Links: P1, P3; D-ECO-4
#### Why?
- Outcome: « les marchands comme sur openfront »; « On fait comme OpenFront ? »
  — « go faire ça » (30/10).
#### How?
- Markets within 40 tiles are joined by roads; a market sends caravans along
  the network to another lord's market; they cross any land but a lord's at
  war with theirs; arriving, they pay both markets.
#### What?
- 0.15 gold a tile of road to each, twice between allies, half between one's
  own; an enemy holding the road ahead takes the caravan.
#### Validation
- Confidence: Supported (arena, 24 bots).

## D-ECO-4: Villages as relays

- Status: Accepted
- Owner: Cédric
- Updated: 2026-10-30
#### Why?
- Need: a reason to build on the roads, and for alliances to pay.
- Evidence: OpenFront's stations pay both the train's owner and the
  station's at each stop; a toll was rejected because it would tax allies
  (who are the only strangers' caravans that crossed one's land).
#### What?
- A village within 2 tiles of a caravan's road pays, once a caravan, its lord
  and the caravan's: 3.5 gold between allies, 2.5 between others, 1 for one's
  own. Nothing is taken from the merchant.
- Acceptance: Given a third lord's village by the road, When a caravan passes,
  Then both he and the caravan's lord gain 2.5 (engine test).
#### Validation
- Confidence: Untested in play.

## D-ECO-5: Ports, markets on the coast

- Status: Accepted
- Owner: Cédric
- Updated: 2026-10-30
#### Why?
- Outcome: « si tu pose le marché sur terre c'est un marché ou sur la cote ça
  devient un port », « ça évite de faire 2 boutons ».
#### What?
- A market laid on a tile by the water is a port: drawn as a quay with a cog,
  trading by land as any market and by sea (D-ECO-6).

## D-ECO-6: Merchant ships

- Status: Accepted
- Owner: Cédric
- Updated: 2026-10-30
- Links: D-ECO-5; warships (10)
#### Why?
- Outcome: « il faut faire les bateaux marchands comme sur openfront ».
#### How?
- Every 15 s a port may send a ship to another lord's port the same water
  reaches (not at war), the far and the allies' more often; it sails the
  shortest way and pays both ports on arrival.
#### What?
- 0.15 gold a tile of its way to each, twice between allies; 8 tiles a
  second; nothing takes it yet.
- Acceptance: Given two ports across a strait, When a ship arrives, Then both
  lords gain its gold (engine test).
#### Validation
- Riskiest hypothesis: sea trade does not swamp land trade.
- Method: the arena with maps of the Earth (gold by source).
- Confidence: Untested.
