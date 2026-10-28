import { BitmapText, Container, Graphics, TextStyle } from 'pixi.js'
import { drawSoldier } from '../art/soldier'
import { TONE } from '../palette'

// An army's men over it, in a pill of its lord's colour: a soldier and his
// number, and a coin and its gold when men are given a price. Sized on screen.

const SHARP = 8
const LIGHT = 0xfbf4e2
const figures = new TextStyle({
  fontFamily: "'Alegreya Sans', 'Trebuchet MS', sans-serif",
  fontWeight: '900',
  fontSize: 14 * SHARP,
  fill: LIGHT,
  stroke: { color: TONE.ink, width: 3 * SHARP, join: 'round' },
})

/** A coin of gold, centred on (0, 0), 12 units across. */
function drawCoin(g: Graphics) {
  g.circle(0, 0, 6).fill(TONE.gold).stroke({ width: 1.2, color: TONE.ink })
  g.circle(0, 0, 3.6).stroke({ width: 0.9, color: TONE.goldLight })
}

/** A pill of a lord's colour: a soldier and his men, and a coin and its gold when they cost some; centred on (0, 0). */
export function makePill(color: number) {
  const box = new Container()
  const back = box.addChild(new Graphics())
  const mark = box.addChild(new Graphics())
  drawSoldier(mark, LIGHT)
  mark.pivot.set(1.9, -4.5)
  const men = box.addChild(new BitmapText({ text: '', style: figures }))
  men.anchor.set(0, 0.5)
  const coin = box.addChild(new Graphics())
  drawCoin(coin)
  const gold = box.addChild(new BitmapText({ text: '', style: figures }))
  gold.anchor.set(0, 0.5)
  return {
    box,
    show(soldiers: number, price: number | null, zoom: number) {
      const s = 1 / zoom
      men.text = soldiers.toLocaleString('fr-FR')
      men.scale.set(s / SHARP)
      coin.visible = price !== null
      gold.visible = price !== null
      gold.text = String(price ?? '')
      gold.scale.set(s / SHARP)
      const paid = price === null ? 0 : gold.width + 26 * s
      const w = men.width + paid + 40 * s
      back
        .clear()
        .roundRect(-w / 2, -13 * s, w, 26 * s, 13 * s)
        .fill(color)
        .stroke({ width: 1.6 * s, color: TONE.ink })
      mark.scale.set((18 / 14) * s)
      mark.position.set(-w / 2 + 15 * s, 0)
      men.position.set(-w / 2 + 28 * s, 0)
      const right = -w / 2 + 28 * s + men.width
      coin.scale.set(s * 1.25)
      coin.position.set(right + 16 * s, 0)
      gold.position.set(right + 26 * s, 0)
    },
  }
}
