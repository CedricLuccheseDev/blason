import { afloat, positionOf, shootsAt, underFire } from '../../engine'
import { chance } from '../audio/chance'
import { smoothstep } from './ease'
import { siteOf } from './marks'
import type { Cue } from '../audio/cues'
import type { Box } from './camera'
import type { Coup, GameState, Host, Strike } from '../../engine'

// The world heard up close (Concept, « La carte qu'on entend »), read each
// tick, over the beds of render/ambience.ts: an army fighting, a clash of
// swords now and then, more often where two armies are at grips than where
// one takes a land, and its men's cries; an army fallen to its last man; a
// castle's volley as it is loosed; each coup as it sets out and as it comes
// down; a work rising, a blow of a hammer. Only what is on screen, and only
// coming closer: from afar the map is the strategist's, and these are its
// spectacle. Heard by all, as they are seen by all. Typed on the coups, so
// that a coup more does not compile without its sounds.

/** What the world gives to hear, where (in map units), and how loud, 0 to 1. */
export type Spectacle = { cue: Cue; x: number; y: number; level: number }

/** Each coup heard as it sets out, from its lord's border, and as it comes down. */
const COUPS: Record<Coup, { launch: Cue; land: Cue }> = {
  archers: { launch: 'volley', land: 'volley' },
  troublemaker: { launch: 'torch', land: 'shout' },
  trebuchet: { launch: 'launch', land: 'stone' },
}

/** The pixels a tile covers over which the world comes to be heard: from mid distance (« On entend pas les bruits des armées tout ça quand on zoom »). */
const HEARD = [5, 30] as const
/** The chances, each tick, of a clash, a cry, a hammer's blow, an oar's stroke from what is on screen: now and then, never in time; two armies at grips more than one taking a land. */
const ODDS = {
  battle: 0.3,
  front: 0.12,
  shout: 0.05,
  hammer: 0.08,
  oars: 0.1,
  sail: 0.04,
}

const on = (view: Box, x: number, y: number) =>
  x >= view.left && x <= view.right && y >= view.top && y <= view.bottom

const any = <T>(list: ReadonlyArray<T>): T =>
  list[Math.floor(chance() * list.length)]

export function makeSpectacle() {
  let flying = new Set<Strike>()
  let hosts = new Set<Host>()

  /** The coups set out and come down since the last tick. */
  function strikes(state: GameState) {
    const now = new Set(state.strikes)
    const out = state.strikes.filter((s) => !flying.has(s))
    const down = [...flying].filter((s) => !now.has(s) && state.tick >= s.lands)
    flying = now
    return { out, down }
  }

  /** The armies gone since the last tick while they fought: fallen to their last man. */
  function fallen(state: GameState): Array<Host> {
    const now = new Set(state.hosts)
    const gone = [...hosts].filter((h) => !now.has(h) && h.edge.length > 0)
    hosts = now
    return gone
  }

  return {
    watch(state: GameState, view: Box, perTile: number): Array<Spectacle> {
      const { out, down } = strikes(state)
      const lost = fallen(state)
      // Rising slowly as the camera comes down, its full voice only up close
      // (« on entend trop fort les sons très vite avec le zoom »).
      const level = smoothstep(HEARD[0], HEARD[1], perTile) ** 2
      if (level === 0) return []
      const heard: Array<Spectacle> = []
      const hear = (cue: Cue, tile: number) => {
        const { x, y } = siteOf(state, tile)
        if (on(view, x, y)) heard.push({ cue, x, y, level })
      }
      const seen = (tile: number) => {
        const { x, y } = siteOf(state, tile)
        return on(view, x, y)
      }
      fights(state, seen, hear)
      for (const host of lost) hear('fall', host.edge[0])
      volleys(state, hear)
      const rising = state.works.filter(
        (w) => w.ready !== undefined && w.ready > state.tick && seen(w.tile),
      )
      if (rising.length > 0 && chance() < ODDS.hammer)
        hear('hammer', any(rising).tile)
      const rowing = state.hosts.filter(
        (h) => afloat(state, h) && seen(positionOf(h)),
      )
      if (rowing.length > 0 && chance() < ODDS.oars)
        hear('oars', positionOf(any(rowing)))
      const sailing = state.ships.filter((s) =>
        seen(s.way[Math.min(s.way.length - 1, Math.floor(s.along / 1000))]),
      )
      if (sailing.length > 0 && chance() < ODDS.sail) {
        const ship = any(sailing)
        hear(
          'sail',
          ship.way[
            Math.min(ship.way.length - 1, Math.floor(ship.along / 1000))
          ],
        )
      }
      for (const strike of out) hear(COUPS[strike.coup].launch, strike.from)
      for (const strike of down) hear(COUPS[strike.coup].land, strike.target)
      return heard
    },
  }
}

type Hear = (cue: Cue, tile: number) => void

/** One clash and one cry at most, from the armies fighting on screen. */
function fights(state: GameState, seen: (tile: number) => boolean, hear: Hear) {
  const fighting = state.hosts.filter(
    (h) => h.men > 0 && h.edge.length > 0 && h.closing <= 0 && seen(h.edge[0]),
  )
  if (fighting.length === 0) return
  const odds = fighting.some((h) => h.fighting) ? ODDS.battle : ODDS.front
  if (chance() < odds) hear('clash', any(fighting).edge[0])
  if (chance() < ODDS.shout) hear('shout', any(fighting).edge[0])
}

/** Each castle loosing at an army in its reach this tick. */
function volleys(state: GameState, hear: Hear) {
  for (const work of state.works)
    if (
      work.work === 'castle' &&
      shootsAt(state, work, state.tick) &&
      underFire(state, work).length > 0
    )
      hear('volley', work.tile)
}
