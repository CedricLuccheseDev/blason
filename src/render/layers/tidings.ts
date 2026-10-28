import { BitmapText, Container, Graphics, TextStyle } from 'pixi.js'
import { UNIT, capOf } from '../../../engine'
import { TONE } from '../palette'
import { siteOf } from '../marks'
import type { Caravan, GameState } from '../../../engine'

// What the player's works bring, written where they bring it: a "+" of gold
// rises from a market when a caravan arrives there, a "+" of peasants from
// each village every second while they are born. A work of his taken by
// another is struck out where it stood: red rings spread from it and a red
// seal crossed through beats there for a few seconds, so that a village or a
// market lost in the turmoil is never lost unseen. The player's alone, so
// that the map does not swarm with figures. Sized on screen.

const SHARP = 8
/** How long a figure rises, in seconds, and how high, in pixels. */
const LIFE = 1.2
const RISE = 22
/** Seconds between two figures over the villages. */
const VILLAGE_EVERY = 1

const styleOf = (fill: number) =>
  new TextStyle({
    fontFamily: "'Alegreya Sans', 'Trebuchet MS', sans-serif",
    fontWeight: '900',
    fontSize: 16 * SHARP,
    fill,
    stroke: { color: TONE.ink, width: 3 * SHARP, join: 'round' },
  })
const GOLD = styleOf(TONE.gold)
/** A light green, read on the ink of its stroke. */
const PEASANTS = styleOf(0x8fd19e)

type Tiding = { text: BitmapText; x: number; y: number; born: number }
/** How long a lost work stays struck out, in seconds, and its seal's radius on screen. */
const STRUCK = 5
const SEAL = 10

export function makeTidings(me: number) {
  const container = new Container()
  const live: Array<Tiding> = []
  /** Each caravan out at the last tick, and how far it was. */
  let seen = new Map<Caravan, number>()
  let tick = -1
  let lastVillages = 0
  const marks = container.addChild(new Graphics())
  /** My works at the last tick, by tile; those I lost, where and when. */
  let held = new Map<number, string>()
  const lost: Array<{ x: number; y: number; born: number }> = []

  function say(state: GameState, tile: number, words: string, gold: boolean) {
    const text = container.addChild(
      new BitmapText({ text: words, style: gold ? GOLD : PEASANTS }),
    )
    text.anchor.set(0.5, 1)
    const { x, y } = siteOf(state, tile)
    live.push({ text, x, y, born: performance.now() / 1000 })
  }

  /** The caravans gone since the last tick that had reached the end of their road. */
  function arrivals(state: GameState, ticks: number) {
    const out = new Set(state.caravans)
    for (const [caravan, along] of seen) {
      if (out.has(caravan)) continue
      const last = caravan.road.length - 1
      if (along + state.rules.caravanPace * ticks < last * 1000) continue
      const gold = `+${Math.floor(caravan.gold / UNIT)}`
      if (caravan.owner === me) say(state, caravan.road[0], gold, true)
      if (caravan.to === me) say(state, caravan.road[last], gold, true)
    }
    seen = new Map(state.caravans.map((c) => [c, c.along]))
  }

  /** Over each of my villages, what it fed in the last seconds, while my peasants grow. */
  function births(state: GameState, seconds: number) {
    if (seconds - lastVillages < VILLAGE_EVERY) return
    lastVillages = seconds
    const lord = state.players[me]
    const villages = state.works.filter(
      (w) => w.owner === me && w.work === 'village',
    )
    if (!lord.alive || villages.length === 0) return
    const { rules } = state
    if (lord.peasants >= capOf(state, me)) return
    const each = Math.floor(
      (rules.peasants.village * VILLAGE_EVERY) / rules.fillSeconds,
    )
    for (const v of villages) say(state, v.tile, `+${each}`, false)
  }

  /** My works taken since the last tick, struck out where they stood. */
  function losses(state: GameState, seconds: number) {
    for (const work of state.works)
      if (held.get(work.tile) === work.work && work.owner !== me)
        lost.push({ ...siteOf(state, work.tile), born: seconds })
    held = new Map(
      state.works.filter((w) => w.owner === me).map((w) => [w.tile, w.work]),
    )
  }

  /** Each lost work: red rings spreading, a red seal crossed through. */
  function strike(zoom: number, seconds: number) {
    marks.clear()
    const s = 1 / zoom
    for (let i = lost.length - 1; i >= 0; i--) {
      const { x, y, born } = lost[i]
      const age = seconds - born
      if (age > STRUCK) {
        lost.splice(i, 1)
        continue
      }
      const fade = Math.min(1, (STRUCK - age) / 1.5)
      const t = (age / 1.2) % 1
      marks
        .circle(x, y, SEAL * s * (1 + 2.2 * t))
        .stroke({ width: 2.5 * s, color: TONE.fight, alpha: (1 - t) * fade })
      marks
        .circle(x, y, SEAL * s)
        .fill({ color: TONE.fight, alpha: fade })
        .stroke({ width: 1.5 * s, color: TONE.ink, alpha: fade })
      const r = SEAL * s * 0.5
      marks
        .moveTo(x - r, y - r)
        .lineTo(x + r, y + r)
        .moveTo(x + r, y - r)
        .lineTo(x - r, y + r)
        .stroke({
          width: 2.2 * s,
          color: TONE.parchment,
          alpha: fade,
          cap: 'round',
        })
    }
  }

  return {
    container,
    draw(state: GameState, zoom: number) {
      const seconds = performance.now() / 1000
      if (me >= 0 && state.tick !== tick) {
        arrivals(state, state.tick - tick)
        tick = state.tick
        births(state, seconds)
        losses(state, seconds)
      }
      strike(zoom, seconds)
      for (let i = live.length - 1; i >= 0; i--) {
        const { text, x, y, born } = live[i]
        const t = (seconds - born) / LIFE
        if (t >= 1) {
          text.destroy()
          live.splice(i, 1)
          continue
        }
        text.scale.set(1 / zoom / SHARP)
        text.position.set(x, y - (8 + RISE * t) / zoom)
        text.alpha = t < 0.7 ? 1 : (1 - t) / 0.3
      }
    },
  }
}
