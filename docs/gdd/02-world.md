# 02 — The world

The land a game is played on, and how a game begins on it. Figures:
`docs/RULES.md` (The land, The opening).

## D-WLD-1: A land drawn anew, at three sizes

- Status: Accepted
- Owner: Cédric
- Updated: 2026-10-30
- Scope: solo, private and public games
- Links: P1, P2; D-WLD-2

#### Why?

- Need: each game a new situation to read, so no opening is learnt by heart.
- Outcome: « Je veux qu'elle fasse des vrais map unique avec des mers »;
  « Fais 3 map inventé petite moyenne grosse » (30/10).
- Evidence: OpenFront's fixed maps are replayed for their known spots; a
  seed gives the same land on every machine for free.
- Alternatives: fixed maps only — learnt by heart; one size — fits no count.
- Tradeoff: a random land may be dull; families of shape keep it varied.

#### How?

- A seed and a size draw the land: one of six families of shape (a continent,
  a coast, an inland sea, two lands and a neck, a strip between two seas,
  fjords), peninsulas, lakes, rivers, high mountains in ranges with passes.

#### What?

- Sizes: small (half the land, 2–8 lords), middling (2–16), great (twice,
  10–24); huge (four times) by address only. Each size draws its own family
  from the seed. A click on the chosen random land draws another.
- Acceptance: Given a seed and a size, When two machines draw the land, Then
  it is the same, tile for tile (engine tests).

#### Validation

- Riskiest hypothesis: random lands are as fair as fixed ones.
- Method: the arena (who wins by start), playtests.
- Confidence: Preliminary.
- Open question: is the small land's start too cramped for 8? — Cédric,
  playtest, before release.

## D-WLD-2: Maps of the Earth, each its own size

- Status: Accepted
- Owner: Cédric
- Updated: 2026-10-30
- Scope: the book's list, the public games
- Links: P1, P3; D-WLD-3, D-WAR-6

#### Why?

- Need: lands players know and argue over; history's fronts for free.
- Outcome: « faire des maps de la vrai terre », « Fais pas de mode carte
  moyenne grosse tout ça, chaque carte a sa propre taille » (30/10).
- Evidence: ETOPO 2022 heights and Natural Earth's lakes, rivers and
  countries are public domain.
- Tradeoff: the Earth's coasts are coarse at our scale; straits kept open by
  hand.

#### How?

- `scripts/atlas.ts` bakes a frame of the Earth's heights into the engine; the
  generator lays its cells on it; ranges and straits are drawn on by name.

#### What?

- Maps: the British Isles (small), France (middling), the Mediterranean and
  Europe (large), the World (huge, 85° S to 80° N). Each says the lords it
  suits; the book marks the ones that suit the game.
- Acceptance: Given Europe, When it is drawn, Then Ireland, Britain, Corsica,
  Sardinia and Sicily are islands and the Pyrenees stand (atlas test).

#### Validation

- Riskiest hypothesis: the World plays smoothly with 24 lords.
- Method: a played game on the World; performance measured.
- Confidence: Preliminary (Europe played; the World untested in a full game).
- Open question: the World's 690,000 tiles — Claude, measure a full game,
  before the World goes to the public rotation in prod.

## D-WLD-3: Dead land

- Status: Accepted
- Owner: Cédric
- Updated: 2026-10-30
- Scope: maps of some lands only (France, the British Isles)
- Links: P2; D-WLD-2

#### Why?

- Need: a map of France is a game of France.
- Outcome: « Il faut instaurer des dead space … Sinon la France y'a pas que
  la France »; « il faut mettre en marron noir les lands dead » (30/10).
- Alternatives: cropping to France — loses the neighbours' context.
- Tradeoff: a playable border that is no coast nor mountain may read oddly.

#### How?

- The baked map marks the land of other countries dead: drawn brown-black and
  hatched, no one's, as the high mountains.

#### What?

- No army enters dead land, no work stands there, it counts for nothing in
  the race; a crumb of dead land on the playable coast is given back to it.
- Acceptance: Given France, When the opening ends, Then no lord holds a tile
  outside France and Corsica.

#### Validation

- Confidence: Preliminary. Revisit trigger: players read dead land as sea.

## D-WLD-4: Lands of legend

- Status: Accepted (provisional on rights)
- Owner: Cédric
- Updated: 2026-10-30
- Scope: the book's Legends section
- Links: P3

#### Why?

- Outcome: « pour la légende je veux seigneur des anneaux, game of thrones »;
  « Westeros et essos » (30/10).
- Evidence and risk: those maps and names belong to their authors; ours are
  drawn by our own hand (`scripts/legends/`), never traced.
- Tradeoff: a takedown request could remove them; they are one entry each.

#### What?

- Middle-earth (large), Westeros and Essos (huge).

#### Validation

- Open question: keep them when the repository and the production go public?
  — Cédric, before the public release.

## D-WLD-5: Islands in the game

- Status: Accepted
- Owner: Cédric
- Updated: 2026-10-30
- Links: D-WAR-6, D-WAR-7

#### Why?

- Need: the boats reach them, so they belong to the game.

#### What?

- Every piece of land the water touches is in the game; a piece closed by
  mountains all round, or under 20 tiles, is not. A large free island is
  taken tile by tile (D-WAR-7).

#### Validation

- Confidence: Preliminary.

## D-WLD-6: The opening, a standard planted freely

- Status: Accepted
- Owner: Cédric
- Updated: 2026-10-29
- Scope: every game
- Links: P1, P4

#### Why?

- Outcome: « pour le starting il faut pouvoir poser son étendard de manière
  libre » (29/10).
- Evidence: OpenFront's spawn choice is the game's first decision.

#### What?

- 10 s alone (30 s online, 10–60 s in the book): each lord plants his standard
  anywhere, never within 20 tiles of another's; at the end, the land within 14
  tiles is his, his first village on the standard.
- Acceptance: Given two standards 25 tiles apart, When the opening ends, Then
  each overlapping tile goes to the nearer standard.

#### Validation

- Confidence: Supported (arena: every bot placed, games start even).

## D-WLD-7: The rivers are water

- Status: Accepted
- Owner: Cédric
- Updated: 2026-10-31
- Links: D-WAR-6, D-ECO-5

#### Why?

- Need: « Les fleuves rivières et lac sont de la vrai eau il faut les manage
  comme tel … Fais pas juste des rivière toutes fine juste pour le style »;
  « Les fleuves doivent être des vrais points d'eaux pour ajouter des ports
  traverser tout ça ».
- Alternative left: fords where armies cross on foot (« A », no ford): one
  rule more; a river is always turned by its spring, and a boat crosses a
  narrow one fast.
- Tradeoff: fronts along rivers hold better; a land may take a crossing.

#### How?

- Every tile of land under a river's course is water: armies cross it by
  boat from any bank (D-WAR-6), or walk round by the spring when sooner; no
  one holds it; ports stand by it and ships sail it (D-ECO-5).
- Drawn as the sea (« fais le même design que la mer »): the water's wash
  between banks in the coast's ink, a shore line along each bank, the mouth
  open on the sea, at every distance.

#### What?

- `riverTiles` (`engine/map/streams.ts`), laid by `makeGrid`: a tile is water
  when its middle lies within the river's half width of its course, 0.75
  tile at the spring to 1.5 at the mouth (tunable); land only.
- Acceptance: Given a map with rivers, When its grid is made, Then the tiles
  under each course are water and no land.

#### Validation

- Riskiest hypothesis: the bots still find their way across.
- Method: the arena (game length, lands taken); played.
- Confidence: Untested.
