# 08 — Sound

Code: `src/audio/`; credits: `public/sounds/CREDITS.md`.

## D-SND-1: Every feature with its sound

- Status: Accepted
- Owner: Cédric
- Updated: 2026-10-30
- Links: P3

#### Why?

- Outcome: « a chaque fois aussi qu'on ajoutera des features il faudra penser
  au son qui va avec »; « Je veux que chaque élément du jeu a son son ».

#### What?

- A rule, a piece of the HUD or a new gesture comes with its cue in
  `audio/cues.ts` or bed in `beds.ts`, its bus, and its credited files; the
  tables are typed on the engine's lists, so a work or a coup without its
  sound does not compile.

#### Validation

- Confidence: Preliminary.

## D-SND-2: Short hits that inform, a world heard up close

- Status: Accepted
- Owner: Cédric
- Updated: 2026-10-30

#### Why?

- Outcome: « c'est surtout des hit que l'on veut pour que ça reste digeste »;
  « on entend trop fort les sons très vite avec le zoom ».

#### What?

- Cues that inform are short; the world (battles, oars, hammers, ships) is
  heard only as the camera comes down, slowly; beds of the land (sea, wind,
  woods, villages, markets…) by what is on screen; music between them.

#### Validation

- Confidence: Preliminary.

## D-SND-3: Variety and the mix

- Status: Accepted
- Owner: Cédric
- Updated: 2026-10-30

#### Why?

- Outcome: « les sons sont toujours les mêmes il faut de la variété »; « digne
  d'un jeu vidéo »; the gold's sound removed (« pas besoin de ce son la »).

#### What?

- Each sound a family of takes, never the same twice running, ±3 % in pitch;
  five buses with ducking, a compressor, one room; Opus files; M to mute; the
  music goes on through a land changed in the book.

#### Validation

- Confidence: Preliminary. Open question: a settings sheet with the volumes —
  Cédric, with the profile.
