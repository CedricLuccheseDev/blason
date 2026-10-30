# 09 — Online

Code: `server/`, `net/protocol.ts`.

## D-ONL-1: A relay in lockstep

- Status: Accepted
- Owner: the team
- Updated: 2026-10-28
- Links: P4
#### Why?
- Need: the same game on every machine, a server that stays small.
- Evidence: OpenFront's relay passes orders in turns; our engine is
  deterministic (tests: the same turns give the same game).
#### What?
- The relay passes each turn's orders to all; every browser plays the game.
#### Validation
- Confidence: Supported (tests).

## D-ONL-2: The public game, no waiting room, every map in turn

- Status: Accepted
- Owner: Cédric
- Updated: 2026-10-30
#### Why?
- Outcome: « comme dans openfront ne fait pas de lobby en attente »; « en ligne
  il faut 0 bot »; « les parties publiques fait les tourné avec toutes les
  maps pas que les random ».
#### What?
- One public game always in its opening (30 s); « Jouer » sits at once; no
  bot; empty seats stay empty; alone when the doors close, it begins again;
  the next opens on the next land of the rotation (random sizes and every map).
#### Validation
- Open question: the World and the legends in the public rotation — heavy for
  weak machines? — Claude, measure before prod.

## D-ONL-3: Private rooms by a link

- Status: Accepted
- Owner: Cédric
- Updated: 2026-10-30
#### What?
- The host's book opens a room; « Inviter » copies a link that sits a friend
  at once; a code can be pasted whole.

## D-ONL-4: No ghost games, and watching the relay

- Status: Accepted
- Owner: the team
- Updated: 2026-10-30
#### Why?
- Outcome: « il faut bien gérer le fait que quand y'a plus de joueur connecté
  sur une game il faut supprimer la game »; « fais un /admin qui monitoring ».
#### What?
- Every 30 s the relay asks each player; one silent since the last asking is
  cut, and a game with no one left closes. `/admin`, behind the relay's key,
  shows every room, its land, turn, players and whether they answer.
#### Validation
- Confidence: Preliminary.
