import { workPx } from './art/works'
import { siteOf } from './marks'
import type { GameState } from '../../engine'
import type { Ground } from './layers/crowd'
import type { Spot } from './roads'

// What the lords' words keep clear of on the map (layers/crowd.ts): each
// lord's works where they stand, read once a tick, as large as they are
// drawn at the zoom (art/works.ts); and whether a point is on his land.

export function groundOf(state: GameState, me: number) {
  let built = { tick: -1, by: new Map<number, Array<Spot>>() }
  const worksOf = (lord: number) => {
    if (built.tick !== state.tick) {
      const by = new Map<number, Array<Spot>>()
      for (const w of state.works)
        by.set(w.owner, [...(by.get(w.owner) ?? []), siteOf(state, w.tile)])
      built = { tick: state.tick, by }
    }
    return built.by.get(lord) ?? []
  }
  return (zoom: number): Ground => ({
    worksOf,
    reach: (lord) => workPx(zoom, lord === me) / zoom / 2,
    holds: (lord, x, y) => {
      const { width, height, size } = state.grid
      const [cx, cy] = [Math.floor(x / size), Math.floor(y / size)]
      if (cx < 0 || cy < 0 || cx >= width || cy >= height) return false
      return state.owner[cy * width + cx] === lord
    },
  })
}
