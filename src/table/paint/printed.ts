import { BOARD, LID } from '../sizes'
import { mottle, outline, paint, speckle } from './canvas'
import type { Pen } from './canvas'

// What the game's box has printed on it: the board's gules frame round the
// map, with its gilt and its cartouche, and the lid, azure, with the shield,
// the name and the line under it.

const GILT = '#d9a41e'

/** A gilt flourish in a corner of the board, turned to its corner. */
function corner(g: Pen, x: number, y: number, sx: number, sy: number) {
  g.save()
  g.translate(x, y)
  g.scale(sx, sy)
  g.strokeStyle = GILT
  g.lineWidth = 5
  g.beginPath()
  g.moveTo(10, 120)
  g.lineTo(10, 46)
  g.quadraticCurveTo(10, 10, 46, 10)
  g.lineTo(120, 10)
  g.stroke()
  g.lineWidth = 2.5
  g.beginPath()
  g.moveTo(28, 110)
  g.lineTo(28, 54)
  g.quadraticCurveTo(28, 28, 54, 28)
  g.lineTo(110, 28)
  g.stroke()
  g.fillStyle = '#f4d277'
  g.beginPath()
  g.arc(22, 22, 9, 0, Math.PI * 2)
  g.fill()
  g.restore()
}

/** The board's top: gules, gilt lines and corners, the band round the map, the cartouche. */
export function boardTopCanvas(mark: string) {
  const W = 2048
  const H = Math.round((W * BOARD.d) / BOARD.w)
  const k = W / BOARD.w
  return paint(W, H, (g) => {
    const gr = g.createLinearGradient(0, 0, W, H)
    gr.addColorStop(0, '#80251b')
    gr.addColorStop(0.6, '#5d1712')
    gr.addColorStop(1, '#4d120e')
    g.fillStyle = gr
    g.fillRect(0, 0, W, H)
    mottle(g, [W, H, 90], ['rgba(20,0,0,0.12)', 'rgba(255,200,160,0.05)'])
    speckle(g, W, H, 0.05)
    const e = 0.42 * k
    outline(g, [e, e, W - 2 * e, H - 2 * e, 12], 7, GILT)
    outline(
      g,
      [e + 15, e + 15, W - 2 * e - 30, H - 2 * e - 30, 12],
      3,
      'rgba(217,164,30,0.7)',
    )
    const m = e + 22
    corner(g, m, m, 1, 1)
    corner(g, W - m, m, -1, 1)
    corner(g, W - m, H - m, -1, -1)
    corner(g, m, H - m, 1, -1)
    // Round the map: the parchment band, its gilt and its ink.
    const mx = ((BOARD.w - BOARD.mapW) / 2) * k
    const mz = ((BOARD.d - BOARD.mapD) / 2) * k
    const mw = BOARD.mapW * k
    const mh = BOARD.mapD * k
    g.fillStyle = GILT
    g.fillRect(mx - e, mz - e, mw + 2 * e, mh + 2 * e)
    g.fillStyle = '#e8d7ae'
    g.fillRect(mx - 0.36 * k, mz - 0.36 * k, mw + 0.72 * k, mh + 0.72 * k)
    g.fillStyle = '#2b1e12'
    g.fillRect(mx - 4, mz - 4, mw + 8, mh + 8)
    // The cartouche: the game's name in small capitals.
    g.font = `${0.92 * k}px 'IM Fell English SC', Georgia, serif`
    g.letterSpacing = `${0.32 * k}px`
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillStyle = 'rgba(20,4,0,0.6)'
    g.fillText(mark, W / 2 + 0.16 * k, H - mz / 2 + 4)
    g.fillStyle = '#f4d277'
    g.fillText(mark, W / 2 + 0.16 * k, H - mz / 2)
    // The fold.
    g.fillStyle = 'rgba(0,0,0,0.35)'
    g.fillRect(W / 2 - 3, 0, 3, H)
    g.fillStyle = 'rgba(255,220,180,0.18)'
    g.fillRect(W / 2, 0, 2, H)
  })
}

/** The lid's top: azure, gilt lines, the shield, the name in gold and the line under it. */
export function lidCanvas(
  shield: HTMLImageElement | null,
  name: string,
  line: string,
) {
  const W = 2048
  const H = Math.round((W * LID.d) / LID.w)
  const k = W / LID.w
  return paint(W, H, (g) => {
    const gr = g.createRadialGradient(
      W * 0.4,
      H * 0.35,
      0,
      W * 0.4,
      H * 0.35,
      W * 0.75,
    )
    gr.addColorStop(0, '#2a5793')
    gr.addColorStop(0.55, '#183865')
    gr.addColorStop(1, '#0e2242')
    g.fillStyle = gr
    g.fillRect(0, 0, W, H)
    mottle(g, [W, H, 120], ['rgba(0,0,20,0.14)', 'rgba(160,190,255,0.05)'], 11)
    speckle(g, W, H, 0.05, 5)
    const e = 0.62 * k
    outline(g, [e, e, W - 2 * e, H - 2 * e, 16], 9, GILT)
    outline(
      g,
      [e + 20, e + 20, W - 2 * e - 40, H - 2 * e - 40, 10],
      3.5,
      'rgba(217,164,30,0.75)',
    )
    if (shield) {
      g.save()
      g.shadowColor = 'rgba(0,0,0,0.55)'
      g.shadowBlur = 18
      g.shadowOffsetY = 10
      g.drawImage(shield, W / 2 - 1.15 * k, 2.1 * k, 2.3 * k, 2.8 * k)
      g.restore()
    }
    g.textAlign = 'center'
    g.textBaseline = 'alphabetic'
    g.font = `${5.4 * k}px 'IM Fell English', Georgia, serif`
    g.letterSpacing = `${0.06 * k}px`
    const by = 12.6 * k
    g.fillStyle = 'rgba(6,14,32,0.9)'
    g.fillText(name, W / 2, by + 0.16 * k)
    const tg = g.createLinearGradient(0, by - 4 * k, 0, by + 0.6 * k)
    for (const [at, c] of [
      [0, '#fff1bf'],
      [0.28, '#f4d277'],
      [0.55, GILT],
      [0.8, '#8a5f0f'],
      [1, '#c9952a'],
    ] as const)
      tg.addColorStop(at, c)
    g.fillStyle = tg
    g.fillText(name, W / 2, by)
    g.letterSpacing = '0px'
    g.font = `italic ${1.02 * k}px 'IM Fell English', Georgia, serif`
    g.fillStyle = '#e9d8a8'
    g.fillText(line, W / 2, 15.7 * k)
  })
}

/** The lid's sides: azure deepening, a gilt band. */
export function lidSideCanvas() {
  return paint(512, 128, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, 128)
    gr.addColorStop(0, '#1d4477')
    gr.addColorStop(1, '#0a1830')
    g.fillStyle = gr
    g.fillRect(0, 0, 512, 128)
    g.fillStyle = GILT
    g.fillRect(0, 26, 512, 5)
    g.fillRect(0, 38, 512, 2)
    speckle(g, 512, 128, 0.05)
  })
}
