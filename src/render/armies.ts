import { Container } from 'pixi.js'
import { UNIT } from '../../engine'
import { makeColumns } from './layers/column'
import { makeFallen } from './layers/fallen'
import { makeMelee, rankOf } from './layers/melee'
import { makePill } from './layers/pill'
import { TONE, playerColor } from './palette'
import { makeTracks } from './tracks'
import { makeWarning } from './layers/warning'
import type { GameState } from '../../engine'
import type { Clash } from './layers/melee'
import type { Stamps } from './textures'
import type { Track } from './tracks'

// The armies, followed from frame to frame (tracks.ts) so that none ever
// jumps or blinks. On its road from its barracks, an army walks in a column
// (layers/column.ts); at the front, its soldiers face the peasants who hold
// the land, pitchforks against spears; where two armies meet, their soldiers
// face each other. Men fall as they are lost, on both sides (layers/fallen.ts).
// An enemy army coming for the player is shown from afar (layers/warning.ts).
// Over each army, its men in a pill of its lord's colour, gliding with it.
// Sized on screen; the soldiers at the land's scale.

/** World units for each size of the melee: small soldiers on a fine land. */
const MELEE = 0.2
/** Fights drawn at once at most. */
const CLASHES = 60
/** Men lost for each body drawn, and bodies at most a tick on each side. */
const PER_BODY = 12
const MOST_BODIES = 2
/** How far behind its rank, and how wide, a side's dead lie, in sizes of the melee. */
const DEPTH = 14
const WIDTH = 40

/** Where the dead lie, scattered without a pattern: the screen's own draws, the game's never touched. */
let seed = 1
function scatter(): number {
  seed = (seed * 16807) % 2147483647
  return seed / 2147483647
}

/** The colour of the peasants who hold a land: their lord's, or the free land's. */
const peasantColor = (owner: number) =>
  owner >= 0 ? playerColor(owner) : TONE.neutralPill

/** A fight between two armies near each other, halfway between them. */
function battle(a: Track, b: Track): Clash {
  const d = Math.hypot(a.x - b.x, a.y - b.y)
  return {
    at: [(a.x + b.x) / 2, (a.y + b.y) / 2],
    out: d > 0 ? [(a.x - b.x) / d, (a.y - b.y) / d] : [1, 0],
    colors: [playerColor(a.host.owner), playerColor(b.host.owner)],
    ranks: [rankOf(a.host.men / UNIT / 4), rankOf(b.host.men / UNIT / 4)],
    kinds: ['soldier', 'soldier'],
    alpha: Math.min(a.alpha, b.alpha),
    seed: a.host.from + b.host.from,
  }
}

/** An army against the peasants of the land it takes, where its front stands. */
function bite(state: GameState, track: Track): Clash {
  const { host } = track
  const held =
    host.target >= 0 ? state.players[host.target].peasants / UNIT / 20 : 2
  return {
    at: [track.x, track.y],
    out: [track.back.x, track.back.y],
    colors: [playerColor(host.owner), peasantColor(host.target)],
    ranks: [rankOf(host.men / UNIT / 4), rankOf(held)],
    kinds: ['soldier', 'peasant'],
    alpha: track.alpha * (1 - track.march),
    seed: host.from,
  }
}

/** The pairs of armies fighting each other, each army once. */
function battles(tracks: Array<Track>): Array<[Track, Track]> {
  const fighting = tracks.filter((t) => t.host.fighting && !t.gone)
  const pairs: Array<[Track, Track]> = []
  const paired = new Set<Track>()
  for (const a of fighting) {
    if (paired.has(a)) continue
    const b = fighting
      .filter((t) => t !== a && !paired.has(t) && t.host.owner !== a.host.owner)
      .sort(
        (p, q) =>
          Math.hypot(p.x - a.x, p.y - a.y) - Math.hypot(q.x - a.x, q.y - a.y),
      )
      .at(0)
    if (!b) continue
    paired.add(a)
    paired.add(b)
    pairs.push([a, b])
  }
  return pairs
}

export function makeArmies(stamps: Stamps, me: number) {
  const container = new Container()
  const columns = makeColumns(stamps)
  const fallen = makeFallen(stamps, MELEE)
  const melee = makeMelee(stamps, MELEE)
  const warning = makeWarning(me)
  container.addChild(
    warning.container,
    fallen.container,
    columns.container,
    melee.container,
  )
  const pills = new Map<Track, ReturnType<typeof makePill>>()
  let drawn: Array<Track> = []
  let current: GameState

  /** Men lost: some fall where the army fights, and the peasants it killed on the other side. */
  function bury(state: GameState, track: Track, men: number) {
    const { host } = track
    const lost = Math.min(MOST_BODIES, Math.round(men / UNIT / PER_BODY))
    // Against an army, its own dead fall on its own track; against the land, peasants fall too.
    const killed = host.fighting
      ? 0
      : (lost * 100) / state.rules.combat.peasants
    const spread = (
      side: number,
      n: number,
      color: number,
      kind: 'soldier' | 'peasant',
    ) => {
      for (let i = 0; i < Math.min(MOST_BODIES, Math.round(n)); i++) {
        const lateral = (scatter() - 0.5) * WIDTH * MELEE
        const depth = (6 + scatter() * DEPTH) * MELEE * side
        const x = track.x + track.back.x * depth - track.back.y * lateral
        const y = track.y + track.back.y * depth + track.back.x * lateral
        fallen.fall(x, y, color, kind, track.back.x * side >= 0 ? -1 : 1)
      }
    }
    spread(1, lost, playerColor(host.owner), 'soldier')
    spread(-1, killed, peasantColor(host.target), 'peasant')
  }
  const tracks = makeTracks((track, men) => bury(current, track, men))

  /** Each army's men in a pill over where it stands, faded in and out with it. */
  function count(all: Array<Track>, zoom: number) {
    for (const [track, pill] of pills) {
      if (all.includes(track)) continue
      pill.box.destroy({ children: true })
      pills.delete(track)
    }
    for (const track of all) {
      let pill = pills.get(track)
      if (!pill) {
        pill = makePill(playerColor(track.host.owner))
        pills.set(track, pill)
        container.addChild(pill.box)
      }
      pill.box.alpha = track.alpha
      pill.box.position.set(track.x, track.y - 16 / zoom)
      pill.show(Math.floor(track.men / UNIT), null, zoom)
    }
  }

  return {
    container,
    draw(state: GameState, zoom: number, between = 0) {
      current = state
      const seconds = performance.now() / 1000
      drawn = tracks.update(state, between)
      const walking = drawn
        .filter((t) => t.march > 0)
        .map((t) => ({ host: t.host, head: t.head, alpha: t.alpha * t.march }))
      warning.draw(state, drawn, zoom)
      columns.draw(state, walking, zoom, seconds)
      const pairs = battles(drawn)
      const paired = new Set(pairs.flat())
      const fights = [
        ...pairs.map(([a, b]) => battle(a, b)),
        ...drawn
          .filter((t) => t.march < 1 && !paired.has(t))
          .map((t) => bite(state, t)),
      ]
      melee.draw(fights.slice(0, CLASHES), seconds)
      fallen.draw(seconds)
      count(drawn, zoom)
    },
  }
}
