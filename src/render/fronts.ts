import { apart, marching, meet, positionOf, wayBetween } from '../../engine'
import { siteOf } from './marks'
import { headOf, pathOf } from './layers/column'
import { pointOn } from './roads'
import type { GameState, Host } from '../../engine'

// Where each army stands and which way it faces, read from the game every
// frame. On the march, its head on its road. At the front, the tile its
// attack has taken furthest towards the click, the click a direction and no
// halt: the front moves on with the land taken, past the click if the army
// goes on, and never stands on land the army does not hold. In a battle,
// its half of the way over the land between the two armies, round what
// stands between, walked while they close, then its side of the ground in
// its middle (battle.ts, wayBetween), facing the other: the two armies
// charge into each other there, on land.

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

/** A battle as it is drawn: its two armies, the ground they met on, the way back to each side, each army's half of the way to it and the ticks they took to walk it. */
type Battle = {
  a: Host
  b: Host
  site: Spot
  back: Spot
  quiet: number
  halves: Map<Host, Array<Spot>>
  closing: number
}

/** Ticks a battle is kept once neither army fights: a pause is not its end. */
const QUIET = 10

export function makeFronts() {
  /** The tile each army's attack has reached furthest, while it holds it. */
  const reached = new Map<Host, number>()
  /** The battles going on, each army in one at most, each kept on the ground where it began. */
  const battles = new Map<Host, Battle>()
  let tick = -1

  /** The line of an attack: from where it entered, towards the tile clicked, a direction and no halt. */
  function axis(state: GameState, host: Host) {
    const from = siteOf(state, host.entry)
    const to = siteOf(state, host.aim)
    const road = pathOf(state, host).at(-1) ?? from
    const dir =
      Math.hypot(to.x - from.x, to.y - from.y) > 0
        ? unit(to.x - from.x, to.y - from.y)
        : unit(from.x - road.x, from.y - road.y)
    return { from, dir }
  }

  /**
   * The point an attack has reached: of the tiles it took, the one furthest
   * towards the click, a little less if it lies far aside; always one it
   * still holds, so that its men never stand on land it does not have.
   */
  function front(state: GameState, host: Host): Spot {
    const { from, dir } = axis(state, host)
    const score = (t: number) => {
      const p = siteOf(state, t)
      const [dx, dy] = [p.x - from.x, p.y - from.y]
      return dx * dir.x + dy * dir.y - 0.5 * Math.abs(dx * dir.y - dy * dir.x)
    }
    let best = reached.get(host)
    if (best !== undefined && state.owner[best] !== host.owner) best = undefined
    for (const t of host.edge)
      if (
        state.owner[t] === host.owner &&
        (best === undefined || score(t) > score(best))
      )
        best = t
    // All it took lost a moment, it stands where it last stood, not at its entry.
    const at = best ?? reached.get(host)
    if (at === undefined) return siteOf(state, host.entry)
    reached.set(host, at)
    return siteOf(state, at)
  }

  /** Battles kept while their armies stand and fight, or pause a moment; new ones joined by armies free of any, each with the nearest army the game makes it fight, on their ground. */
  function judge(state: GameState) {
    const standing = new Set(state.hosts)
    for (const battle of new Set(battles.values())) {
      const { a, b } = battle
      const over = !standing.has(a) || !standing.has(b)
      battle.quiet = a.fighting || b.fighting ? 0 : battle.quiet + 1
      if (!over && battle.quiet <= QUIET) continue
      battles.delete(a)
      battles.delete(b)
    }
    const free = state.hosts.filter((h) => h.fighting && !battles.has(h))
    for (const a of free) {
      if (battles.has(a)) continue
      const near = (h: Host) => apart(state.grid, positionOf(a), positionOf(h))
      const b = free
        .filter((h) => !battles.has(h) && meet(state, a, h))
        .sort((p, q) => near(p) - near(q))
        .at(0)
      if (!b) continue
      // The way over the land between them, round what stands between
      // (battle.ts): each walks his half of it to the ground in its middle.
      const way = (
        wayBetween(state, positionOf(a), positionOf(b)) ?? [
          positionOf(a),
          positionOf(b),
        ]
      ).map((t) => siteOf(state, t))
      const mid = Math.floor(way.length / 2)
      const site = way[mid]
      const from = way[Math.max(0, mid - 1)]
      const to = way[Math.min(way.length - 1, mid + 1)]
      const back = unit(from.x - to.x, from.y - to.y)
      const halves = new Map([
        [a, way.slice(0, mid + 1)],
        [b, way.slice(mid).reverse()],
      ])
      const closing = Math.max(1, a.closing, b.closing)
      const battle = { a, b, site, back, quiet: 0, halves, closing }
      battles.set(a, battle)
      battles.set(b, battle)
    }
  }

  /** An army in a battle: walking its half of the way to the ground, then on its side of it, facing the other (« ils se rencontrent quand ils se touchent »). */
  function fight(host: Host, battle: Battle, head: number): Front {
    const sign = battle.a === host ? 1 : -1
    const back = { x: battle.back.x * sign, y: battle.back.y * sign }
    const { site } = battle
    const half = battle.halves.get(host) ?? []
    if (host.closing > 0 && half.length > 1) {
      const along = (1 - host.closing / battle.closing) * (half.length - 1)
      const at = pointOn(half, along)
      const ahead = pointOn(half, Math.min(half.length - 1, along + 1))
      return {
        host,
        phase: 'battle',
        at,
        facing: unit(ahead.x - at.x, ahead.y - at.y),
        head,
        line: null,
        foe: battle.a === host ? battle.b : battle.a,
      }
    }
    return {
      host,
      phase: 'battle',
      at: { x: site.x + back.x * GAP, y: site.y + back.y * GAP },
      facing: { x: -back.x, y: -back.y },
      head,
      line: site,
      foe: battle.a === host ? battle.b : battle.a,
    }
  }

  /** An army on the march, or at its front. */
  function stand(
    state: GameState,
    host: Host,
    here: Spot,
    head: number,
  ): Front {
    if (marching(host)) {
      const next = pointOn(pathOf(state, host), head + 1)
      const facing = unit(next.x - here.x, next.y - here.y)
      return {
        host,
        phase: 'march',
        at: here,
        facing,
        head,
        line: null,
        foe: null,
      }
    }
    const { dir } = axis(state, host)
    const at = { x: here.x - dir.x * GAP, y: here.y - dir.y * GAP }
    return {
      host,
      phase: 'front',
      at,
      facing: dir,
      head,
      line: here,
      foe: null,
    }
  }

  return {
    /** Every army's place this frame. */
    read(state: GameState, between: number): Map<Host, Front> {
      const anchors = new Map<Host, Spot>()
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
      if (state.tick !== tick) {
        tick = state.tick
        judge(state)
      }
      const fronts = new Map<Host, Front>()
      for (const host of state.hosts) {
        const head = headOf(state, host, between)
        const battle = battles.get(host)
        fronts.set(
          host,
          battle
            ? fight(host, battle, head)
            : stand(state, host, anchors.get(host) as Spot, head),
        )
      }
      return fronts
    },
  }
}
