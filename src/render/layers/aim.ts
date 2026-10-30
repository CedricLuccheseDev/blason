import { Container, Graphics } from 'pixi.js'
import {
  barredBy,
  canBuild,
  canStart,
  freeWorks,
  menFor,
} from '../../../engine'
import { courseNow } from '../course'
import { drawRoad } from '../roads'
import { TONE, playerColor } from '../palette'
import { drawWork } from '../art/works'
import { siteOf } from '../marks'
import { makeCoupAim } from './aimCoup'
import type { Army, GameState, Work } from '../../../engine'
import type { Hand } from '../hand'

// What a click on the tile under the pointer would do. Against another's
// land or free land: the road the army would march from its village (the
// mercenaries from their market) to the border, where it would enter, ringed, and a dotted line from there to
// the tile aimed at, the very course the click sends it by. With a work in hand: its drawing on the
// tile, the circle it reaches (the castle's land held, the market's range of
// trade), red where it may not stand,
// with the works already standing ringed in red. With a coup in hand, the
// disc it would strike and its way there (layers/aimCoup.ts). In the opening:
// a dotted ring where one's standard would be planted, no land drawn; in red
// where another lord's standard is too near, his ringed by the ground it
// holds. Sized on screen.

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
  const coups = makeCoupAim(state, me)
  container.addChild(coups.container)
  const color = playerColor(me)
  let read = { key: '', entry: -1, road: [] as Array<At> }

  /** Whether a click would send the army: a village (or a market) with none out, and men to raise (« si tu peux pas envoyer d'armée ne met pas le chemin du village »). */
  const sendable = (army: Army) =>
    freeWorks(state, me, 0, state.rules.raisedAt[army]).length > 0 &&
    menFor(state, me, army) > 0

  /** Where an army would enter, and the road it would march there from its free village or, for mercenaries, its free market, as drawn: the engine's own course, the one the click sends it by (courseFor); nothing if no army can leave. Read again only when the pointer, the land or the army in hand changes. */
  function entryAt(tile: number, army: Army) {
    const key = `${tile}:${state.tick}:${army}`
    if (key !== read.key) {
      const course = sendable(army) ? courseNow(state, me, tile, army) : null
      const road = course?.road ?? []
      read = {
        key,
        entry: course?.entry ?? -1,
        road: road.length
          ? drawRoad(state, road, (t) => state.owner[t] === me, 0)
          : [],
      }
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

  /**
   * A dotted ring round a point, its dots some twelve pixels apart on
   * screen, sixteen at least; each dot a few straight strokes, no arc: on a
   * phone an arc after a moveTo was drawn from the map's origin (« Le bug
   * long pression », the bundle of lines to the top left, as the works'
   * timer did before its gauge).
   */
  function dotted(p: At, r: number, tone: number, zoom: number) {
    const dots = Math.max(16, Math.round((2 * Math.PI * r * zoom) / 12))
    const at = (a: number) =>
      [p.x + Math.cos(a) * r, p.y + Math.sin(a) * r] as const
    for (let k = 0; k < dots; k++) {
      const a = (k / dots) * Math.PI * 2
      const span = Math.PI / dots
      marks.moveTo(...at(a))
      for (let i = 1; i <= 3; i++) marks.lineTo(...at(a + (span * i) / 3))
    }
    marks.stroke({ width: 2.4 / zoom, color: tone, cap: 'round' })
  }

  /** Where the standard would be planted: a dotted ring round the tile, no land drawn; too near another lord's, the ring in red, and his standard ringed by the ground it holds. */
  function opening(tile: number, zoom: number) {
    if (state.players[me].standard === tile) return
    const barring = barredBy(state, me, tile)
    const ok = canStart(state, me, tile)
    dotted(siteOf(state, tile), 14 / zoom, ok ? color : TONE.fight, zoom)
    const gap = state.rules.standardGap * state.grid.size
    for (const lord of barring)
      dotted(siteOf(state, state.players[lord].standard), gap, TONE.fight, zoom)
  }

  function strike(tile: number, army: Army, zoom: number) {
    const { entry, road } = entryAt(tile, army)
    if (entry < 0) return
    const e = siteOf(state, entry)
    const p = siteOf(state, tile)
    // From the village or the market to the border, the road the army would walk, then on to the tile aimed at.
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
    draw(hovered: number, hand: Hand, zoom: number) {
      marks.clear()
      ghost.clear()
      ghost.visible = false
      coups.clear()
      if (me < 0 || !state.players[me].alive) return
      const opened = state.tick >= state.rules.openingTicks
      // The reach of a coup in hand shows even with the pointer off the land.
      if (opened && hand.coup && hovered < 0) coups.band(hand.coup)
      if (hovered < 0) return
      if (!opened) opening(hovered, zoom)
      else if (hand.coup) coups.draw(hovered, hand.coup, zoom)
      else if (hand.work) building(hovered, hand.work, zoom)
      else strike(hovered, hand.army, zoom)
    },
  }
}
