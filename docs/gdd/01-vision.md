# 01 — Vision

## The experience

A medieval real-time strategy game in the browser. Up to twenty-four lords,
persons and bots, share a land drawn anew for each game (or a map of the
Earth, or of legend) and take it from one another tile by tile. Peasants hold
the land and march out as armies; gold builds villages, markets and castles
laid freely; alliances are short and traitors are marked for all to see;
merchants and ships carry the gold. A game lasts some twenty minutes.

A player should feel, within a minute, that he is a lord on an old map: his
colour washing over the parchment as he takes it, his armies seen marching,
the sound of the world around him; and within a game, that his choices of
where to strike, build and ally decided it.

## Players and context

- Players who know OpenFront or io-strategy games, and players who like the
  great strategy games but lack their hours: one sitting, no install.
- Played first on a computer, in the browser; installable as an app on a
  phone, in either orientation; online with friends, or alone against bots.
- Assumption (untested): a game of 15–25 minutes is the length these
  players come back to. Evidence so far: the arena's games end in 19–30
  minutes; no playtest of the length yet.

## D-VIS-1: The doctrine

- Status: Accepted
- Owner: Cédric
- Updated: 2026-10-30
- Scope: every system and screen
- Links: P1–P4

#### Why?

- Need: a direction every decision can be judged against, for a team.
- Intended outcome: « un jeu qui prend plusieurs briques des rts complexes,
  mais en simplifié rapide et fun. Et agréable visuellement » (Cédric,
  28/10).
- Evidence: OpenFront shows a simple territorial loop holds players;
  the great strategy games show depth players want; neither alone is the aim.
- Alternatives: a full RTS (units, micro) — too slow for one sitting; a pure
  io land-grab — too thin.
- Tradeoff: every brick borrowed is cut down to its one decision; depth comes
  from bricks meeting, not from any one being deep.

#### How?

- Each rule offers one clear choice (where, when, with whom) and resolves
  itself; the player never manages a unit by hand.

#### What?

- A rule or a screen enters only if it can be told in one sentence and read
  on the map without a tooltip.
- Acceptance: Given a new player, When he plays his first game, Then he can
  take land, raise an army, build and ally without reading a manual.
- Exclusions: unit micro-management, tech trees, resource juggling beyond
  peasants and gold.

#### Validation

- Riskiest hypothesis: simplified bricks still add up to depth.
- Method: playtests with new and seasoned players; the arena for pace.
- Confidence: Preliminary (played on dev by the team).
- Open question: none — it is the yardstick.
- Revisit trigger: players find games samey after a few sessions.

## The pillars

### P1 — The great strategy games' bricks, made simple and fast

Peasants and gold, levies and mercenaries, works laid freely, alliances and
betrayal, trade and ports, naval crossings: each kept to its one decision.

### P2 — Read at a glance, at two scales

« map dézoomée = map stratégique : tout doit être compréhensible super
rapidement … map zoomée = map micro-gestion et spectacle » (29/10). From
afar only what decides; up close detail and life. Icons over words (« j'aime
pas les textes tout seul ça fais pas jeu vidéo », 30/10); figures coloured by
what they say.

### P3 — A manuscript map that lives

Ink on parchment, each lord's wash, an interface of objects of this world
(shields, seals, ribbons), never web panels; « Je veux que le jeu soit
vivant » (30/10): every element has its sound, the land its beds and music.

### P4 — Play together, now

One click from the home into the public game, no waiting room; private rooms
by a link; bots to fill a game alone; the same game on every machine.

## What Blason is not

- Not a copy of OpenFront: it is read for its mechanisms, never copied
  (AGPL-3.0, built from zero).
- Not a game of units: no selecting soldiers, no formations to command.
- Not pay-to-win: no business model is decided (see [10](10-roadmap.md)).
