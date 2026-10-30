import { BitmapText, Container, Graphics, TextStyle } from 'pixi.js'
import {
  TICKS_PER_SECOND,
  UNIT,
  capOf,
  sicknessOf,
  standing,
} from '../../../engine'
import { TONE } from '../palette'
import { siteOf } from '../marks'
import { makeArrivals } from '../arrivals'
import type { GameState } from '../../../engine'

// What the player's works bring, written where they bring it: a "+" of gold
// rises from a market when a caravan arrives there, a "+" of peasants from
// the villages each second while they are born, those of the whole land
// shared among them so that their figures add up to the purse's "+N/s"
// (« on voit encore les +1 alors qu'ils génèrent plus »); while there are more than the land and villages
// feed, a red "−" of the sick instead, and a red cross on each
// village, as on a plague house. A work of his taken by
// another is struck out where it stood: red rings spread from it and a red
// seal crossed through beats there for a few seconds, so that a village or a
// market lost in the turmoil is never lost unseen. The player's alone, so
// that the map does not swarm with figures. Sized on screen.

const SHARP = 8
/** How long a figure rises, in seconds, and how high, in pixels: the gold, rarer, longer and higher. */
const LIFE = 1.2
const RISE = 22
const GOLD_LIFE = 2.2
const GOLD_RISE = 34
/** Seconds between two figures over the villages. */
const VILLAGE_EVERY = 1

const styleOf = (fill: number, size = 16) =>
  new TextStyle({
    fontFamily: "'Alegreya Sans', 'Trebuchet MS', sans-serif",
    fontWeight: '900',
    fontSize: size * SHARP,
    fill,
    stroke: { color: TONE.ink, width: (size / 5) * SHARP, join: 'round' },
  })
/** What grows in green, what falls in red, as every figure of the game (« vert rouge gris en fonction de si c'est une croissance décroissance »): a caravan's gold larger, a few times a minute a market, to be seen; the peasants born; the sick. */
const GOLD = styleOf(TONE.gainLight, 22)
const PEASANTS = styleOf(TONE.gainLight)
const SICK = styleOf(TONE.lossLight)

type Tiding = {
  text: BitmapText
  x: number
  y: number
  born: number
  life: number
  rise: number
}
/** How long a lost work stays struck out, in seconds, and its seal's radius on screen. */
const STRUCK = 5
const SEAL = 10

export function makeTidings(me: number) {
  const container = new Container()
  const live: Array<Tiding> = []
  const arrivals = makeArrivals(me)
  let tick = -1
  let lastVillages = 0
  /** The births not yet written, in peasants, and the village the next share goes to first. */
  let owed = 0
  let turn = 0
  const marks = container.addChild(new Graphics())
  /** My works at the last tick, by tile; those I lost, where and when. */
  let held = new Map<number, string>()
  const lost: Array<{ x: number; y: number; born: number }> = []

  function say(
    state: GameState,
    tile: number,
    words: string,
    style: TextStyle,
  ) {
    const text = container.addChild(new BitmapText({ text: words, style }))
    text.anchor.set(0.5, 1)
    const { x, y } = siteOf(state, tile)
    const gold = style === GOLD
    live.push({
      text,
      x,
      y,
      born: performance.now() / 1000,
      life: gold ? GOLD_LIFE : LIFE,
      rise: gold ? GOLD_RISE : RISE,
    })
  }

  /** Over each of my villages, what it fed in the last seconds, while my peasants grow. */
  function births(state: GameState, seconds: number) {
    if (seconds - lastVillages < VILLAGE_EVERY) return
    lastVillages = seconds
    const lord = state.players[me]
    // A village still being built feeds no one yet (« y'a des +1 alors que le village est pas créé »).
    const villages = state.works.filter(
      (w) => w.owner === me && w.work === 'village' && standing(state, w),
    )
    if (!lord.alive || villages.length === 0) return
    const { rules } = state
    const sick = sicknessOf(state, me)
    if (sick > 0) {
      const dying = (sick * TICKS_PER_SECOND * VILLAGE_EVERY) / UNIT
      const each = Math.max(1, Math.round(dying / villages.length))
      for (const v of villages) say(state, v.tile, `\u2212${each}`, SICK)
      return
    }
    const cap = capOf(state, me)
    if (lord.peasants >= cap) {
      owed = 0
      return
    }
    // The whole births of the second, shared out whole: the first villages
    // in turn take one more, so that every figure written is a true one.
    owed += (cap * VILLAGE_EVERY) / rules.fillSeconds / UNIT
    const born = Math.floor(owed)
    owed -= born
    const n = villages.length
    turn = (turn + 1) % n
    villages.forEach((v, i) => {
      const each =
        Math.floor(born / n) + ((i - turn + n) % n < born % n ? 1 : 0)
      if (each > 0) say(state, v.tile, `+${each}`, PEASANTS)
    })
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

  /** While my peasants are sick, a red cross on each of my villages. */
  function plague(state: GameState, zoom: number) {
    if (sicknessOf(state, me) === 0) return
    const s = 1 / zoom
    for (const w of state.works) {
      if (w.owner !== me || w.work !== 'village') continue
      const { x, y } = siteOf(state, w.tile)
      const [cy, r] = [y - 16 * s, 4 * s]
      marks
        .moveTo(x, cy - r)
        .lineTo(x, cy + r)
        .moveTo(x - r, cy)
        .lineTo(x + r, cy)
        .stroke({ width: 4 * s, color: TONE.ink, cap: 'round' })
        .stroke({ width: 2.2 * s, color: TONE.fight, cap: 'round' })
    }
  }

  return {
    container,
    draw(state: GameState, zoom: number) {
      const seconds = performance.now() / 1000
      if (me >= 0 && state.tick !== tick) {
        for (const { tile, gold } of arrivals.read(state, state.tick - tick))
          say(state, tile, `+${gold}`, GOLD)
        tick = state.tick
        births(state, seconds)
        losses(state, seconds)
      }
      strike(zoom, seconds)
      if (me >= 0) plague(state, zoom)
      for (let i = live.length - 1; i >= 0; i--) {
        const { text, x, y, born, life, rise } = live[i]
        const t = (seconds - born) / life
        if (t >= 1) {
          text.destroy()
          live.splice(i, 1)
          continue
        }
        text.scale.set(1 / zoom / SHARP)
        text.position.set(x, y - (8 + rise * t) / zoom)
        text.alpha = t < 0.7 ? 1 : (1 - t) / 0.3
      }
    },
  }
}
