import { BitmapText, Container, TextStyle } from 'pixi.js'
import { UNIT, capOf } from '../../../engine'
import { TONE } from '../palette'
import { siteOf } from '../marks'
import type { Caravan, GameState } from '../../../engine'

// What the player's works bring, written where they bring it: a "+" of gold
// rises from a market when a caravan arrives there, a "+" of peasants from
// each village every second while they are born. The player's alone,
// so that the map does not swarm with figures. Sized on screen.

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

export function makeTidings(me: number) {
  const container = new Container()
  const live: Array<Tiding> = []
  /** Each caravan out at the last tick, and how far it was. */
  let seen = new Map<Caravan, number>()
  let tick = -1
  let lastVillages = 0

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

  return {
    container,
    draw(state: GameState, zoom: number) {
      const seconds = performance.now() / 1000
      if (me >= 0 && state.tick !== tick) {
        arrivals(state, state.tick - tick)
        tick = state.tick
        births(state, seconds)
      }
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
