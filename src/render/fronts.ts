import { marching } from '../../engine'
import { siteOf } from './marks'
import { headOf, pathOf } from './layers/column'
import { pointOn } from './roads'
import type { GameState, Host } from '../../engine'

// Where each army stands and which way it faces, read from the game every
// frame. On the march, its head on its road. At the front, the point its
// attack has reached on the straight line from where it entered to the tile
// clicked: the simulation takes the tiles nearest that line first, so the
// front moves along it and never back, however the bulge widens. In a battle,
// its side of the ground halfway between it and the enemy army, facing it:
// the two armies charge into each other there.

export type Spot = { x: number; y: number }

export type Front = {
  host: Host
  phase: 'march' | 'front' | 'battle'
  /** Where its men gather, the way they face (of length one), and how far along its road its head is. */
  at: Spot
  facing: Spot
  head: number
  /** Where the fight is, its front line or the middle of its battle; none on the march. */
  line: Spot | null
  /** In a battle, the army it fights. */
  foe: Host | null
}

/** How far before the front line an army stands, and the peasants after it, in map units. */
export const GAP = 5

const unit = (x: number, y: number): Spot => {
  const d = Math.hypot(x, y) || 1
  return { x: x / d, y: y / d }
}

/** The pairs of enemy armies fighting each other, each army once, the nearest together. */
function pairs(state: GameState, anchor: (h: Host) => Spot) {
  const fighting = state.hosts.filter((h) => h.fighting)
  const paired = new Map<Host, Host>()
  const apart = (a: Host, b: Host) => {
    const [p, q] = [anchor(a), anchor(b)]
    return Math.hypot(p.x - q.x, p.y - q.y)
  }
  for (const a of fighting) {
    if (paired.has(a)) continue
    const b = fighting
      .filter((h) => h !== a && !paired.has(h) && h.owner !== a.owner)
      .sort((p, q) => apart(a, p) - apart(a, q))
      .at(0)
    if (!b) continue
    paired.set(a, b)
    paired.set(b, a)
  }
  return paired
}

export function makeFronts() {
  /** How far along its line each army's attack has gone, in map units: it never goes back. */
  const reached = new Map<Host, number>()

  /** The line of an attack: from where it entered, towards the tile clicked. */
  function axis(state: GameState, host: Host) {
    const from = siteOf(state, host.entry)
    const to = siteOf(state, host.aim)
    const length = Math.hypot(to.x - from.x, to.y - from.y)
    const road = pathOf(state, host).at(-1) ?? from
    const dir =
      length > 0
        ? unit(to.x - from.x, to.y - from.y)
        : unit(from.x - road.x, from.y - road.y)
    return { from, dir, length }
  }

  /** The point an attack has reached on its line. */
  function front(state: GameState, host: Host): Spot {
    const { from, dir, length } = axis(state, host)
    let far = reached.get(host) ?? 0
    for (const t of host.edge) {
      const p = siteOf(state, t)
      far = Math.max(far, (p.x - from.x) * dir.x + (p.y - from.y) * dir.y)
    }
    far = Math.min(far, length)
    reached.set(host, far)
    return { x: from.x + dir.x * far, y: from.y + dir.y * far }
  }

  return {
    /** Every army's place this frame. */
    read(state: GameState, between: number): Map<Host, Front> {
      const anchors = new Map<Host, Spot>()
      const anchor = (h: Host) => anchors.get(h) as Spot
      for (const host of state.hosts) {
        const head = headOf(state, host, between)
        anchors.set(
          host,
          marching(host)
            ? pointOn(pathOf(state, host), head)
            : front(state, host),
        )
      }
      for (const host of reached.keys())
        if (!anchors.has(host)) reached.delete(host)
      const foes = pairs(state, anchor)
      const fronts = new Map<Host, Front>()
      for (const host of state.hosts) {
        const head = headOf(state, host, between)
        const here = anchor(host)
        const foe = foes.get(host) ?? null
        if (foe) {
          const there = anchor(foe)
          const mid = { x: (here.x + there.x) / 2, y: (here.y + there.y) / 2 }
          const back = unit(here.x - there.x, here.y - there.y)
          const at = { x: mid.x + back.x * GAP, y: mid.y + back.y * GAP }
          const facing = { x: -back.x, y: -back.y }
          fronts.set(host, {
            host,
            phase: 'battle',
            at,
            facing,
            head,
            line: mid,
            foe,
          })
        } else if (marching(host)) {
          const path = pathOf(state, host)
          const next = pointOn(path, head + 1)
          const facing = unit(next.x - here.x, next.y - here.y)
          fronts.set(host, {
            host,
            phase: 'march',
            at: here,
            facing,
            head,
            line: null,
            foe,
          })
        } else {
          const { dir } = axis(state, host)
          const at = { x: here.x - dir.x * GAP, y: here.y - dir.y * GAP }
          fronts.set(host, {
            host,
            phase: 'front',
            at,
            facing: dir,
            head,
            line: here,
            foe,
          })
        }
      }
      return fronts
    },
  }
}
