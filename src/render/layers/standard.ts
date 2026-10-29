import { BitmapText, Container, Graphics, Sprite, TextStyle } from 'pixi.js'
import { RES } from '../art/men/atlas'
import { WALK } from '../art/men/pose'
import { makeFigure, shadowOf, sheetOf } from '../figures'
import { TONE } from '../palette'
import type { Look } from '../figures'

// An army's standard: its bearer, one of its own men, a rider for a raid,
// stands among them on his shadow, walks with them, and holds high a banner
// of his lord's colour, the light chevron of his arms across its head and
// the army's men written under it; the cloth ends in two tails. Sized on
// screen, so that it reads at any zoom; its foot at (0, 0).

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
/** On screen, in pixels: the pole's height over a man on foot's hands, the banner's height, its tails, its least width. */
const HIGH = 50
const CLOTH = 30
const TAIL = 7
const NARROW = 26
/** On screen, in pixels: the bearer's height on foot. */
const BEARER = 20
/** The drawings' height of a man on foot, and where his hands hold the pole. */
const MAN = 11.5
const HANDS = 6.4
/** Steps of the bearer's walk a second, on the march: a rider trots faster. */
const CADENCE: Record<Look, number> = {
  raid: 3.4,
  host: 2.6,
  ban: 2.4,
  peasant: 2.4,
}

export function makeStandard(color: number, look: Look) {
  const sheet = sheetOf(look)
  const box = new Container()
  const shadow = box.addChild(new Sprite(shadowOf()))
  shadow.anchor.set(0.5)
  shadow.blendMode = 'multiply'
  const pole = box.addChild(new Graphics())
  const banner = box.addChild(new Graphics())
  const men = box.addChild(new BitmapText({ text: '', style: figures }))
  men.anchor.set(0.5, 0.5)
  const bearer = makeFigure()
  box.addChild(bearer.box)
  let drawn = { width: -1, zoom: 0 }
  /** How much higher the pole stands than over a man on foot, in the drawings' units: a rider's hands are higher. */
  const lift = Math.max(0, -sheet.pole[1] - HANDS)

  /** The pole from the bearer's hands, its crossbar, the cloth with its tails, the chevron of the arms. */
  function draw(width: number, s: number, top: number, low: number) {
    const [left, right] = [-width / 2, width / 2]
    pole
      .clear()
      .moveTo(0, low)
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

  /** The bearer at his frame, his hands on the pole, his shadow under him. */
  function stand(u: number, face: 1 | -1, frame: number) {
    bearer.show(sheet, sheet.men, face, frame, color)
    bearer.box.scale.set(u / RES)
    bearer.box.position.set(-face * sheet.pole[0] * u, 0)
    const { x, rx, ry } = sheet.shadow
    shadow.position.set(bearer.box.x + (x * face + 0.5) * u, 0.15 * u)
    shadow.width = rx * 2 * u
    shadow.height = ry * 2 * u
  }

  return {
    box,
    /** `shown`: how much its figure shows, faded out when the land grows too small for it; the bearer walking or standing, facing his army's way. */
    show(
      count: number,
      zoom: number,
      shown = 1,
      march: { walking: boolean; face: 1 | -1; seconds: number } = {
        walking: false,
        face: 1,
        seconds: 0,
      },
    ) {
      const s = 1 / zoom
      const u = (BEARER * s) / MAN
      const top = -HIGH * s - lift * u
      men.text = count.toLocaleString('fr-FR')
      men.alpha = shown
      men.scale.set(s / SHARP)
      const width = Math.max(NARROW * s, men.width + 12 * s)
      if (Math.abs(width - drawn.width) > 0.01 * s || zoom !== drawn.zoom) {
        drawn = { width, zoom }
        draw(width, s, top, (sheet.pole[1] + 3) * u)
      }
      men.position.set(0, top + (CLOTH * s) / 2 + 4 * s)
      const step = Math.floor(march.seconds * CADENCE[look] * WALK) % WALK
      stand(u, march.face, march.walking ? 1 + step : 0)
    },
  }
}
