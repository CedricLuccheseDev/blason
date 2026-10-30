import { shootsAt, underFire } from '../../engine'
import { chance } from '../audio/chance'
import { smoothstep } from './ease'
import { siteOf } from './marks'
import type { Cue } from '../audio/cues'
import type { Box } from './camera'
import type { GameState, Strike } from '../../engine'

// The world heard up close (Concept, « La carte qu'on entend »), read each
// tick: two armies at grips, a clash of swords now and then; a castle's
// volley as it is loosed; the archers' coup or a trebuchet's stone come
// down. Only what is on screen, and only coming closer: from afar the map
// is the strategist's, and these are its spectacle. Heard by all, as they
// are seen by all.

/** What the world gives to hear, where (in map units), and how loud, 0 to 1. */
export type Spectacle = { cue: Cue; x: number; y: number; level: number }

/** The pixels a tile covers over which the world comes to be heard. */
const HEARD = [12, 22] as const
/** The chance, each tick, that a battle on screen gives a clash: now and then, never in time. */
const CLASH = 0.3

const on = (view: Box, x: number, y: number) =>
  x >= view.left && x <= view.right && y >= view.top && y <= view.bottom

export function makeSpectacle() {
  let flying = new Set<Strike>()

  /** The coups come down since the last tick, heard where they fell. */
  function fallen(state: GameState): Array<Strike> {
    const gone = [...flying].filter(
      (s) => !state.strikes.includes(s) && state.tick >= s.lands,
    )
    flying = new Set(state.strikes)
    return gone
  }

  return {
    watch(state: GameState, view: Box, perTile: number): Array<Spectacle> {
      const down = fallen(state)
      const level = smoothstep(HEARD[0], HEARD[1], perTile)
      if (level === 0) return []
      const heard: Array<Spectacle> = []
      const hear = (cue: Cue, tile: number) => {
        const { x, y } = siteOf(state, tile)
        if (on(view, x, y)) heard.push({ cue, x, y, level })
      }
      // One clash at most, from one of the battles on screen.
      const battles = state.hosts.filter((h) => {
        if (!h.fighting || h.closing !== 0 || h.edge.length === 0) return false
        const { x, y } = siteOf(state, h.edge[0])
        return on(view, x, y)
      })
      if (battles.length > 0 && chance() < CLASH)
        hear('clash', battles[Math.floor(chance() * battles.length)].edge[0])
      for (const work of state.works)
        if (
          work.work === 'castle' &&
          shootsAt(state, work, state.tick) &&
          underFire(state, work).length > 0
        )
          hear('volley', work.tile)
      for (const strike of down)
        if (strike.coup === 'archers') hear('volley', strike.target)
        else if (strike.coup === 'trebuchet') hear('stone', strike.target)
      return heard
    },
  }
}
