import { Container, Graphics } from 'pixi.js'
import { cordBetween } from '../cord'
import { drawCord, drawRibbon } from '../art/cords'
import { drawSnap, snapped } from '../art/snap'
import { playerColor } from '../palette'
import type { GameState } from '../../../engine'
import type { Snap } from '../art/snap'
import type { Spot } from '../cord'

// The alliances on the map, as the diplomacy board's direction A has them:
// between the player's capital and each ally's, a ribbon of green silk
// hemmed in gold, its seal at its middle (laid there by the HUD, which
// reads where from `middleOf`); between two other lords allied together, a
// thin dotted cord of ink and its tiny seal. A capital is where the lord's
// name is written, at the heart of his largest piece (places.ts), and the
// cords stop short of the names. Drawn again only when an alliance is made
// or ends, when the zoom moved, or when a name glided a few pixels away.
// An alliance broken, its breaker marked a traitor for it, snaps before all
// (art/snap.ts), drawn each frame while it does; one left to run out goes.

/** A lord's name as drawn, in map units (layers/labels.ts). */
type Name = { x: number; y: number; half: number; tall: number }
type End = { at: Spot; clear: number }

/** Pixels kept between a name and its cord; pixels a name may glide before the cords follow it. */
const [CLEAR, DRIFT] = [10, 4]

export function makePacts(me: number, nameOf: (lord: number) => Name | null) {
  const container = new Container()
  const theirs = container.addChild(new Graphics())
  const mine = container.addChild(new Graphics())
  const snapping = container.addChild(new Graphics())
  /** Each alliance's cord as last drawn, by its two lords; the snaps under way; when each lord stops being a traitor, a frame ago. */
  const cords = new Map<string, Omit<Snap, 'born'>>()
  let snaps: Array<Snap> = []
  let felons: Array<number> = []
  /** Where the seal of each of my alliances sits, by my ally. */
  const middles = new Map<number, Spot>()
  let drawn = { key: '', zoom: 0, ends: new Map<number, End>() }

  /** Where a lord's capital is, under his name, and how far a cord keeps from it. */
  function endOf(lord: number, k: number): End | null {
    const name = nameOf(lord)
    if (!name) return null
    return {
      at: { x: name.x, y: name.y + name.tall * 0.6 },
      clear: Math.max(name.half, name.tall * 1.4) + CLEAR * k,
    }
  }

  function moved(ends: Map<number, End>, k: number): boolean {
    if (ends.size !== drawn.ends.size) return true
    for (const [lord, end] of ends) {
      const was = drawn.ends.get(lord)
      if (!was) return true
      const d = Math.hypot(end.at.x - was.at.x, end.at.y - was.at.y)
      if (d > DRIFT * k) return true
    }
    return false
  }

  /** Two other lords' alliance: a dotted cord. */
  function cordOf(a: number, b: number, p: End, q: End, k: number) {
    const cord = cordBetween(p.at, q.at, p.clear, q.clear)
    if (!cord) return
    const colors: [number, number] = [playerColor(a), playerColor(b)]
    drawCord(theirs, cord, k, colors)
    cords.set(`${a}:${b}`, { cord, mine: false, colors })
  }

  /** Mine: a ribbon from me to my ally, my half of its seal on my side. */
  function ribbonOf(a: number, b: number, p: End, q: End, k: number) {
    const [from, to, ally] = a === me ? [p, q, b] : [q, p, a]
    const cord = cordBetween(from.at, to.at, from.clear, to.clear)
    middles.set(
      ally,
      cord?.middle ?? {
        x: (from.at.x + to.at.x) / 2,
        y: (from.at.y + to.at.y) / 2,
      },
    )
    if (!cord) return
    drawRibbon(mine, cord, k)
    const colors: [number, number] = [playerColor(me), playerColor(ally)]
    cords.set(`${a}:${b}`, { cord, mine: true, colors })
  }

  function trace(state: GameState, ends: Map<number, End>, k: number) {
    theirs.clear()
    mine.clear()
    middles.clear()
    cords.clear()
    for (const { a, b } of state.alliances) {
      const [p, q] = [ends.get(a), ends.get(b)]
      if (!p || !q) continue
      if (a === me || b === me) ribbonOf(a, b, p, q, k)
      else cordOf(a, b, p, q, k)
    }
  }

  /** The alliances gone since they were drawn whose breaker was just marked a traitor: they snap. */
  function broken(state: GameState, now: number) {
    const holding = new Set(state.alliances.map((x) => `${x.a}:${x.b}`))
    for (const [key, cord] of cords) {
      if (holding.has(key)) continue
      const traitor = key
        .split(':')
        .map(Number)
        .some((lord) => state.players[lord].felonUntil > (felons[lord] ?? 0))
      if (traitor) snaps.push({ ...cord, born: now })
    }
  }

  /** The snaps under way, each frame while there are. */
  function snap(k: number, now: number) {
    if (snaps.length === 0) return
    snaps = snaps.filter((s) => !snapped(now - s.born))
    snapping.clear()
    for (const s of snaps) drawSnap(snapping, s, now - s.born, k)
  }

  return {
    container,
    /** Where the seal of my alliance with a lord sits, in map units; none while we are not allied. */
    middleOf: (ally: number): Spot | null => middles.get(ally) ?? null,
    /** `now` in seconds. */
    draw(state: GameState, zoom: number, now: number) {
      const k = 1 / zoom
      const key = state.alliances.map((x) => `${x.a}:${x.b}`).join()
      if (key !== drawn.key) broken(state, now)
      felons = state.players.map((p) => p.felonUntil)
      snap(k, now)
      const ends = new Map<number, End>()
      for (const { a, b } of state.alliances)
        for (const lord of [a, b]) {
          const end = ends.has(lord) ? null : endOf(lord, k)
          if (end) ends.set(lord, end)
        }
      const same =
        key === drawn.key &&
        Math.abs(zoom / drawn.zoom - 1) < 0.1 &&
        !moved(ends, k)
      if (same) return
      drawn = { key, zoom, ends }
      trace(state, ends, k)
    },
  }
}
