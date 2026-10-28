import { BitmapText, Container, Graphics, TextStyle } from 'pixi.js'
import { drawSoldier } from '../art/soldier'
import { BEAT } from '../men'
import { TONE } from '../palette'

// Who holds each land and how strong he is, as in OpenFront: the lord's name
// and, under it, his army in big figures beside a soldier, written at the
// heart of his land; mine in gold. Light letters cut out in ink, readable on
// any wash. Sized on screen, the bigger the land the bigger the words,
// readable at every zoom. Moved and counted again once a second, as the HUD:
// the figures step, they do not run.

/** The fonts are drawn this big, then scaled to their size on screen. */
const SHARP = 64
/** Light letters cut out in ink: they read on any lord's wash. */
const LIGHT = 0xfbf4e2
const CUT = { color: TONE.ink, join: 'round' } as const
/** The name against the army's figures, and never under 13 pixels. */
const NAME = 0.56
const NAME_MIN = 13

type Label = {
  box: Container
  name: BitmapText
  army: BitmapText
  mark: Graphics
  size: number
  at: { x: number; y: number }
  /** Where it is drawn now, gliding towards `at`. */
  shown: { x: number; y: number } | null
  /** The army as counted at the last beat. */
  count: number
}

/** The soldier of the battles, light, beside an army: what the figure counts. */
function soldier(): Graphics {
  const g = new Graphics()
  drawSoldier(g, LIGHT)
  g.pivot.set(1.9, -4.5)
  return g
}

/** Where each lord is written, and how big on screen: the heart of his land, the bigger the land the bigger the words. */
/** Share of the way a label glides each frame towards its new place. */
const GLIDE = 0.05

export type Placement = Map<number, { x: number; y: number; size: number }>

export function makeLabels<TState extends { tick: number }>(
  me: number,
  names: Array<string>,
  /** The figure written under each lord's name: his army, in soldiers. */
  count: (state: TState, lord: number) => number,
  place: (state: TState) => Placement,
) {
  const container = new Container()
  const armyStyle = new TextStyle({
    fontFamily: "'Alegreya Sans', 'Trebuchet MS', sans-serif",
    fontWeight: '900',
    fontSize: SHARP,
    fill: LIGHT,
    stroke: { ...CUT, width: SHARP * 0.2 },
  })
  const nameStyle = new TextStyle({
    fontFamily: "'IM Fell English SC', Georgia, serif",
    fontSize: SHARP,
    fill: LIGHT,
    stroke: { ...CUT, width: SHARP * 0.18 },
  })
  const gilt = (style: TextStyle) => {
    const copy = style.clone()
    copy.fill = TONE.goldLight
    return copy
  }
  const mineArmy = gilt(armyStyle)
  const mineName = gilt(nameStyle)
  const labels = new Map<number, Label>()
  let beat = -1
  let placed = 0

  function labelOf(lord: number): Label {
    let label = labels.get(lord)
    if (label) return label
    const box = container.addChild(new Container())
    const name = box.addChild(
      new BitmapText({
        text: names[lord] ?? '',
        style: lord === me ? mineName : nameStyle,
      }),
    )
    name.anchor.set(0.5, 0.5)
    const army = box.addChild(
      new BitmapText({ text: '', style: lord === me ? mineArmy : armyStyle }),
    )
    army.anchor.set(0, 0.5)
    const mark = box.addChild(soldier())
    label = {
      box,
      name,
      army,
      mark,
      size: 0,
      at: { x: 0, y: 0 },
      shown: null,
      count: -1,
    }
    labels.set(lord, label)
    return label
  }

  /** Each lord written at the heart of his land, sized by it. */
  function settle(state: TState) {
    const places = place(state)
    for (const [lord, label] of labels)
      if (!places.has(lord)) label.box.visible = false
    for (const [lord, { x, y, size }] of places) {
      const label = labelOf(lord)
      label.box.visible = true
      label.at = { x, y }
      label.size = size
      const figure = count(state, lord)
      if (figure !== label.count) {
        label.count = figure
        label.army.text = figure
          .toLocaleString('fr-FR')
          .replace(/\s/g, '\u2006')
      }
    }
  }

  /** Each label a little nearer where it belongs, never a jump; whether any moved. */
  function glide(): boolean {
    let any = false
    for (const label of labels.values()) {
      const to = label.at
      const from = label.shown ?? to
      const dx = to.x - from.x
      const dy = to.y - from.y
      const near = Math.abs(dx) + Math.abs(dy) < 0.05
      label.shown = near
        ? to
        : { x: from.x + dx * GLIDE, y: from.y + dy * GLIDE }
      label.box.position.set(label.shown.x, label.shown.y)
      any ||= !near
    }
    return any
  }

  /** The name over the army and its soldier; sizes in pixels on screen. */
  function layout(zoom: number) {
    for (const label of labels.values()) {
      const big = label.size / zoom
      const small = Math.max(NAME_MIN, label.size * NAME) / zoom
      label.name.scale.set(small / SHARP)
      label.name.position.set(0, -small * 0.62)
      label.army.scale.set(big / SHARP)
      const width = label.army.width
      const mark = big * 0.62
      const row = big * 0.48
      // The soldier is drawn 14 units tall, a little taller than the figures' mark.
      label.mark.scale.set((mark * 1.25) / 14)
      label.mark.position.set(-(width + mark * 1.05) / 2 + mark * 0.35, row)
      label.army.position.set(-(width + mark * 1.05) / 2 + mark * 1.05, row)
    }
  }

  return {
    container,
    update(state: TState, zoom: number) {
      const now = Math.floor(state.tick / BEAT)
      let moved = zoom !== placed
      if (now !== beat) {
        beat = now
        settle(state)
        moved = true
      }
      if (glide()) moved = true
      if (!moved) return
      placed = zoom
      layout(zoom)
    },
  }
}
