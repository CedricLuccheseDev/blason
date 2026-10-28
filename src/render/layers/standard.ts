import { BitmapText, Container, Graphics, TextStyle } from 'pixi.js'
import { drawSoldier } from '../art/soldier'
import { TONE } from '../palette'

// An army's standard: its bearer stands among its men and holds high a
// banner of his lord's colour, the light chevron of his arms across its
// head and the army's men written under it; the cloth ends in two tails.
// Sized on screen, so that it reads at any zoom; its foot at (0, 0).

const SHARP = 8
const LIGHT = 0xfbf4e2
const figures = new TextStyle({
  fontFamily: "'Alegreya Sans', 'Trebuchet MS', sans-serif",
  fontWeight: '900',
  fontSize: 13 * SHARP,
  fill: LIGHT,
  stroke: { color: TONE.ink, width: 3 * SHARP, join: 'round' },
})
const POLE = 0x65492f
/** On screen, in pixels: the pole's height, the banner's height, its tails, its least width. */
const HIGH = 50
const CLOTH = 30
const TAIL = 7
const NARROW = 26

export function makeStandard(color: number) {
  const box = new Container()
  const pole = box.addChild(new Graphics())
  const banner = box.addChild(new Graphics())
  const men = box.addChild(new BitmapText({ text: '', style: figures }))
  men.anchor.set(0.5, 0.5)
  const bearer = box.addChild(new Graphics())
  drawSoldier(bearer, color)
  let drawn = { width: -1, zoom: 0 }

  /** The pole, its crossbar, the cloth with its tails, the chevron of the arms. */
  function draw(width: number, s: number) {
    const top = -HIGH * s
    const [left, right] = [-width / 2, width / 2]
    pole
      .clear()
      .moveTo(0, 0)
      .lineTo(0, top - 4 * s)
      .moveTo(left - 2 * s, top)
      .lineTo(right + 2 * s, top)
      .stroke({ width: 2 * s, color: POLE, cap: 'round' })
      .circle(0, top - 5 * s, 2.2 * s)
      .fill(TONE.gold)
      .stroke({ width: 0.8 * s, color: TONE.ink })
    const bottom = top + CLOTH * s
    banner
      .clear()
      .poly([
        left,
        top,
        right,
        top,
        right,
        bottom + TAIL * s,
        right / 2,
        bottom,
        left / 2,
        bottom,
        left,
        bottom + TAIL * s,
      ])
      .fill(color)
      .stroke({ width: 1.4 * s, color: TONE.ink, join: 'round' })
      .moveTo(left + 4 * s, top + 9 * s)
      .lineTo(0, top + 4 * s)
      .lineTo(right - 4 * s, top + 9 * s)
      .stroke({ width: 2.4 * s, color: LIGHT, cap: 'round', join: 'round' })
  }

  return {
    box,
    show(count: number, zoom: number) {
      const s = 1 / zoom
      men.text = count.toLocaleString('fr-FR')
      men.scale.set(s / SHARP)
      const width = Math.max(NARROW * s, men.width + 12 * s)
      if (Math.abs(width - drawn.width) > 0.01 * s || zoom !== drawn.zoom) {
        drawn = { width, zoom }
        draw(width, s)
      }
      men.position.set(0, -HIGH * s + (CLOTH * s) / 2 + 4 * s)
      bearer.scale.set(1.4 * s)
      bearer.position.set(-3 * s, 0)
    },
  }
}
