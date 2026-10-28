import { Container, Graphics } from 'pixi.js'
import {
  canBuild,
  canStart,
  entryFor,
  freeVillages,
  roadTo,
} from '../../../engine'
import { drawRoad } from '../roads'
import { TONE, playerColor } from '../palette'
import { drawWork } from '../art/works'
import { siteOf } from '../marks'
import type { GameState, Work } from '../../../engine'

// What a click on the tile under the pointer would do. Against another's
// land or free land: the road the army would march from its village to
// the border, where it would enter, ringed, and a dotted line from there to
// the tile aimed at. With a work in hand: its drawing on the
// tile, the circle it reaches (the castle's land held, the market's range of
// trade), red where it may not stand,
// with the works already standing ringed in red. In the opening:
// the free domain one would start on, whole. Sized on screen.

type At = { x: number; y: number }

/** How far a work reaches, in tiles, for those that reach: a castle holds its land, a market trades. */
const REACH: Partial<Record<Work, (state: GameState) => number>> = {
  castle: (state) => state.rules.castleRadius,
  market: (state) => state.rules.tradeRange,
}

export function makeAim(state: GameState, me: number) {
  const container = new Container()
  const marks = container.addChild(new Graphics())
  const ghost = container.addChild(new Graphics())
  ghost.alpha = 0.85
  const color = playerColor(me)
  let read = { key: '', entry: -1, road: [] as Array<At> }

  /** The road the army would march from the free village nearest the front, as it would be drawn; none if no village is free. */
  function roadOf(entry: number): Array<At> {
    if (entry < 0) return []
    for (const village of freeVillages(state, me, entry)) {
      const road = roadTo(state, me, village, entry)
      if (road) return drawRoad(state, road, (t) => state.owner[t] === me, 0)
    }
    return []
  }

  /** Where an army would enter, and its road there, read again only when the pointer or the land moves. */
  function entryAt(tile: number) {
    const key = `${tile}:${state.tick}`
    if (key !== read.key) {
      const entry = entryFor(state, me, tile)
      read = { key, entry, road: roadOf(entry) }
    }
    return read
  }

  function line(a: At, b: At, zoom: number) {
    const d = Math.hypot(b.x - a.x, b.y - a.y)
    const step = 7 / zoom
    for (let s = 0; s + step / 2 < d; s += step) {
      const t0 = s / d
      const t1 = Math.min(1, (s + step / 2) / d)
      marks
        .moveTo(a.x + (b.x - a.x) * t0, a.y + (b.y - a.y) * t0)
        .lineTo(a.x + (b.x - a.x) * t1, a.y + (b.y - a.y) * t1)
    }
    marks.stroke({ width: 2.2 / zoom, color, cap: 'round' })
  }

  function building(tile: number, work: Work, zoom: number) {
    const p = siteOf(state, tile)
    const ok = canBuild(state, me, tile, work)
    const tone = ok ? color : TONE.fight
    const reach = REACH[work]
    if (reach)
      marks
        .circle(p.x, p.y, reach(state) * state.grid.size)
        .fill({ color: tone, alpha: 0.1 })
        .stroke({ width: 1.6 / zoom, color: tone })
    drawWork(ghost, work)
    ghost.tint = ok ? 0xffffff : TONE.fight
    ghost.position.set(p.x, p.y)
    ghost.visible = true
  }

  /** The tiles of a domain, gathered again only when the pointer enters another. */
  let domain = { realm: Number.NaN, tiles: [] as Array<number> }
  function tilesOf(realm: number) {
    if (domain.realm !== realm) {
      const tiles: Array<number> = []
      state.realm.forEach((r, t) => {
        if (r === realm) tiles.push(t)
      })
      domain = { realm, tiles }
    }
    return domain.tiles
  }

  function opening(tile: number) {
    if (state.players[me].tiles > 0 || !canStart(state, tile)) return
    const s = state.grid.size
    for (const t of tilesOf(state.realm[tile])) {
      const p = siteOf(state, t)
      marks.rect(p.x - s / 2, p.y - s / 2, s, s)
    }
    marks.fill({ color, alpha: 0.35 })
  }

  function strike(tile: number, zoom: number) {
    const { entry, road } = entryAt(tile)
    if (entry < 0) return
    const e = siteOf(state, entry)
    const p = siteOf(state, tile)
    // From the village to the border, the road the army would walk, then on to the tile aimed at.
    for (let i = 1; i < road.length; i++) line(road[i - 1], road[i], zoom)
    if (road.length > 0) line(road[road.length - 1], e, zoom)
    line(e, p, zoom)
    marks
      .circle(e.x, e.y, 7 / zoom)
      .fill(color)
      .stroke({ width: 1.6 / zoom, color: TONE.ink })
    marks
      .circle(p.x, p.y, 6 / zoom)
      .stroke({ width: 2 / zoom, color: TONE.ink })
  }

  return {
    container,
    draw(hovered: number, work: Work | null, zoom: number) {
      marks.clear()
      ghost.clear()
      ghost.visible = false
      if (hovered < 0 || me < 0 || !state.players[me].alive) return
      if (state.tick < state.rules.openingTicks) opening(hovered)
      else if (work) building(hovered, work, zoom)
      else strike(hovered, zoom)
    },
  }
}
