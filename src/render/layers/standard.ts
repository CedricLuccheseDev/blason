import { BitmapText, Container, Graphics, TextStyle } from 'pixi.js'
import { drawSoldier } from '../art/soldier'
import { CLOTH, HIGH, LIGHT, drawBanner } from '../art/banner'
import { TONE } from '../palette'

// An army's standard: its bearer stands among its men and holds high a
// banner of his lord's colour (art/banner.ts), the army's men written
// across it. Sized on screen, so that it reads at any zoom; its foot at
// (0, 0).

const SHARP = 8
const figures = new TextStyle({
  fontFamily: "'Alegreya Sans', 'Trebuchet MS', sans-serif",
  fontWeight: '900',
  fontSize: 13 * SHARP,
  fill: LIGHT,
  stroke: { color: TONE.ink, width: 3 * SHARP, join: 'round' },
})
/** On screen, in pixels: the banner's least width. */
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

  return {
    box,
    /** `shown`: how much its figure shows, faded out when the land grows too small for it. */
    show(count: number, zoom: number, shown = 1) {
      const s = 1 / zoom
      men.text = count.toLocaleString('fr-FR')
      men.alpha = shown
      men.scale.set(s / SHARP)
      const width = Math.max(NARROW * s, men.width + 12 * s)
      if (Math.abs(width - drawn.width) > 0.01 * s || zoom !== drawn.zoom) {
        drawn = { width, zoom }
        drawBanner(pole, banner, color, width, s)
      }
      men.position.set(0, -HIGH * s + (CLOTH * s) / 2 + 4 * s)
      bearer.scale.set(1.4 * s)
      bearer.position.set(-3 * s, 0)
    },
  }
}
