# 07 — Interface

The HUD system and the map's two scales. Code: `src/components/hud/`
(`CLAUDE.md` holds its tokens).

## D-UI-1: An interface of this world

- Status: Accepted
- Owner: Cédric
- Updated: 2026-10-28
- Links: P3
#### Why?
- Need: the screen belongs to the manuscript, not to a website.
#### What?
- Shields, seals, ribbons, sheets of parchment; Vollkorn for words, Alegreya
  Sans for figures; one button (`Act`), four type sizes, spacing on steps of
  4, one motion curve; never a dark or grey panel.
#### Validation
- Confidence: Preliminary.

## D-UI-2: Icons over words, figures by their colour

- Status: Accepted
- Owner: Cédric
- Updated: 2026-10-30
- Links: P2
#### Why?
- Outcome: « tout dans le jeu doit avoir son icon si possible et si c'est
  efficace, j'aime pas les textes tout seul ça fais pas jeu vidéo »; « les
  mettres d'une police couleur differente vert rouge … oublie pas les icons ».
#### What?
- Every action and label carries its icon where it helps; a figure is green
  when it grows, red when it falls or lacks, white (ink on a sheet) when it
  informs, its icon in the same colour.
- Acceptance: Given any button of the HUD, When it is read, Then an icon says
  what it does before its word.
#### Validation
- Confidence: Preliminary. Revisit trigger: an icon misread in a playtest.

## D-UI-3: Two scales of the map

- Status: Accepted
- Owner: Cédric
- Updated: 2026-10-29
- Links: P2
#### Why?
- Outcome: « map dézoomé = map stratégique … map zoomé = map micro gestion et
  spectacle ».
#### What?
- From 5–9 pixels a tile down: flat icons, standards alone, bold roads, names
  always legible; closer: the drawn works, the men, the life; the two faded
  into each other.
#### Validation
- Confidence: Preliminary.

## D-UI-4: The book of the game

- Status: Accepted
- Owner: Cédric
- Updated: 2026-10-30
- Links: P4
#### Why?
- Outcome: « créer une partie doit envoyer directement dans le lobby »; the
  maps as a list of cards (« comme openfront »), in sections; a fixed size that
  scrolls; « c'est trop le bordel les seigneurs … un systeme simplifié ».
#### What?
- Left: the Earth, the Legends, the Random lands, a card each (its drawing,
  size, lords, « conseillée »). Right: the persons by name, the lords as
  shields by team (a bot's level in dots), the settings as choices side by
  side. Foot: invite (a link), leave, launch; in a game, leave, back, again.
#### Validation
- Confidence: Preliminary.
