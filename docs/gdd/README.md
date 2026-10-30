# Blason — Game Design Document

The shared specification of the experience Blason means to give and of the
rules, content, presentation and services that produce it. It follows the
team's game design methodology: every normative statement belongs to a
**decision record** that answers **Why / How / What**, keeps evidence,
assumptions and open questions apart, and says how it will be validated.

This document is the design's one authoritative home. `docs/RULES.md` keeps
the rules as the engine plays them, with their figures (a record links to it
rather than copying its numbers twice); `docs/ARCHITECTURE.md` keeps the
code. A rule changes here first, as a record **Proposed**, then **Accepted**,
then coded; the record, `RULES.md` and the code change in the same commit.

## How to read a record

```
### D-<area>-<n>: <title>
- Status: Proposed | Accepted | Superseded | Rejected
- Owner: <one accountable person or role>
- Updated: <YYYY-MM-DD>
- Scope: <systems, modes, players>
- Links: <pillars, dependencies, related records>

#### Why?   need · intended outcome · evidence & assumptions · alternatives · tradeoff
#### How?   mechanism · player actions, information, feedback · interactions · failure modes
#### What?  exact rules · parameters (value, unit, source, tunable) · edge cases · acceptance (Given/When/Then) · exclusions
#### Validation   riskiest hypothesis · method · success/failure criteria · evidence · confidence · open questions · revisit trigger · history
```

**Confidence**: *Untested* (designed, not yet played), *Preliminary* (played
on the dev build by the team, no structured test), *Supported* (a playtest
or the arena gave evidence for it), *Contradicted*.

**Evidence** used here: the owner's decisions as he worded them (quoted in
French, dated, from the design vault), the **arena** (`npm run arena`, games
of bots without a screen: length, pace, ending), the **reference games**
(`engine/golden.test.ts`), the engine's tests, and OpenFront, read for its
mechanisms (never copied). A comparable game is evidence that a mechanism
can work, not that it suits our players.

## The pillars

Every record's *Why* names the pillars it serves (see
[01 — Vision](01-vision.md)):

- **P1 — The great strategy games' bricks, made simple and fast.**
- **P2 — Read at a glance, at two scales.**
- **P3 — A manuscript map that lives.**
- **P4 — Play together, now.**

## Sections

| | Section | What it decides |
|---|---|---|
| 01 | [Vision](01-vision.md) | the experience, the players, the pillars, what Blason is not |
| 02 | [The world](02-world.md) | the maps: random, of the Earth, of legend; dead land; islands; the opening |
| 03 | [War](03-war.md) | armies, combat, battles, the woods, crossing the water, encirclement |
| 04 | [Economy and trade](04-economy.md) | peasants, gold, works, caravans, relays, ports and ships |
| 05 | [Diplomacy](05-diplomacy.md) | alliances, traitors, offerings, teams |
| 06 | [Coups and victory](06-coups-victory.md) | the coups, the race, how a game ends |
| 07 | [Interface](07-interface.md) | the HUD system, icons and figures, the book, the two scales |
| 08 | [Sound](08-sound.md) | cues, beds, music, the mix |
| 09 | [Online](09-online.md) | the relay, the public game, private rooms, watching it |
| 10 | [Open questions and roadmap](10-roadmap.md) | what is undecided, what comes next |

## Owners

- **Game design, art direction, final say**: Cédric (owner of the project).
- **Engineering**: the team; Claude implements and keeps the records in step
  with the code.
