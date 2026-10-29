import { Container, Graphics } from 'pixi.js'
import { UNIT, coupPrice, launchSite } from '../../../engine'
import { TONE, playerColor } from '../palette'
import { siteOf } from '../marks'
import { dots, wayOf } from '../flight'
import type { Coup, GameState } from '../../../engine'

// A coup in hand, aimed (layers/aim.ts): at the pointer, the disc it would
// strike, in the lord's colour where a click launches it, in red where it
// may not go or cannot be paid; from the tile of his it would leave from,
// ringed, its way there, dotted: the troublemaker's straight walk, the arc
// of a volley or a trebuchet's stone. For the archers and the trebuchet, which reach
// only so far from the border, that reach laid as a faint band along it,
// so that the player sees where he may aim before he aims. Sized on screen.

export function makeCoupAim(state: GameState, me: number) {
  const container = new Container()
  const band = container.addChild(new Graphics())
  const marks = container.addChild(new Graphics())
  const color = playerColor(me)
  let banded = ''
  let read = { key: '', site: -1 }

  /** The tiles beyond my land within a coup's reach of it, laid again each second. */
  function reachOf(coup: Coup) {
    const { reach } = state.rules.coups[coup]
    const key = `${coup}:${Math.floor(state.tick / 10)}`
    if (key === banded) return
    banded = key
    band.clear()
    if (reach === null) return
    layRuns(band, state, nearOf(state, me, reach), me)
    band.fill({ color, alpha: 0.16 })
  }

  /** Where the coup would leave from, read again only when the pointer or the land moves. */
  function siteAt(tile: number, coup: Coup) {
    const key = `${tile}:${coup}:${state.tick}`
    if (key !== read.key)
      read = { key, site: launchSite(state, me, tile, coup) }
    return read.site
  }

  return {
    container,
    clear() {
      marks.clear()
      band.visible = false
    },
    /** The reach alone, the pointer off the land. */
    band(coup: Coup) {
      reachOf(coup)
      band.visible = true
    },
    draw(tile: number, coup: Coup, zoom: number) {
      reachOf(coup)
      band.visible = true
      const site = siteAt(tile, coup)
      const paid = state.players[me].gold >= coupPrice(state, me, coup) * UNIT
      const tone = site >= 0 && paid ? color : TONE.fight
      const p = siteOf(state, tile)
      const radius = state.rules.coups[coup].radius * state.grid.size
      marks
        .circle(p.x, p.y, radius)
        .fill({ color: tone, alpha: 0.14 })
        .stroke({ width: 2 / zoom, color: tone })
      if (site < 0) return
      const s = siteOf(state, site)
      const flies = state.rules.coups[coup].flight !== null
      dots(marks, wayOf(s, p, flies), 4 / zoom)
      marks.stroke({ width: 2.2 / zoom, color: tone, cap: 'round' })
      marks
        .circle(s.x, s.y, 6 / zoom)
        .fill(tone)
        .stroke({ width: 1.6 / zoom, color: TONE.ink })
    },
  }
}

/** Whether a tile of the map, by its column and row, is the lord's. */
function holds(state: GameState, lord: number, x: number, y: number) {
  const { width, height } = state.grid
  if (x < 0 || y < 0 || x >= width || y >= height) return false
  return state.owner[y * width + x] === lord
}

/** The tiles within so many tiles of the lord's border, marked 1. */
function nearOf(state: GameState, lord: number, reach: number) {
  const { width, height } = state.grid
  const near = new Uint8Array(width * height)
  const round: Array<[number, number]> = []
  for (let dy = -reach; dy <= reach; dy++)
    for (let dx = -reach; dx <= reach; dx++)
      if (dx * dx + dy * dy <= reach * reach) round.push([dx, dy])
  const inner = (x: number, y: number) =>
    holds(state, lord, x + 1, y) &&
    holds(state, lord, x - 1, y) &&
    holds(state, lord, x, y + 1) &&
    holds(state, lord, x, y - 1)
  state.owner.forEach((o, t) => {
    const [x, y] = [t % width, Math.floor(t / width)]
    // Only the border's tiles: the nearest of his to any tile beyond is one.
    if (o !== lord || inner(x, y)) return
    for (const [dx, dy] of round) {
      const [u, v] = [x + dx, y + dy]
      if (u >= 0 && v >= 0 && u < width && v < height) near[v * width + u] = 1
    }
  })
  return near
}

/** The tiles marked near, of land and not the lord's, laid in runs along each row, so that the band is a few shapes. */
function layRuns(
  g: Graphics,
  state: GameState,
  near: Uint8Array,
  lord: number,
) {
  const { width, height, size, land } = state.grid
  const inside = (x: number, y: number) => {
    const t = y * width + x
    return x < width && near[t] === 1 && land[t] && !holds(state, lord, x, y)
  }
  for (let y = 0; y < height; y++) {
    let start = -1
    for (let x = 0; x <= width; x++) {
      const on = inside(x, y)
      if (on && start < 0) start = x
      if (!on && start >= 0) {
        g.rect(start * size, y * size, (x - start) * size, size)
        start = -1
      }
    }
  }
}
