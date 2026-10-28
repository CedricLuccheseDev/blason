import { RIBBON } from '../sizes'
import { heater } from './drawings'
import { mottle, paint, speckle } from './canvas'

// The small things' surfaces: the journal's pages and their edge, the
// ribbon under the seal, the die's faces, a coin, the flame, the leather.

/** A page of the journal, ruled, its gutter shaded on the side `side`. */
export function pageCanvas(side: 1 | -1) {
  return paint(512, 716, (g, W, H) => {
    g.fillStyle = '#f3e8cc'
    g.fillRect(0, 0, W, H)
    const right = side > 0
    mottle(
      g,
      [W, H, 30],
      ['rgba(150,110,50,0.06)', 'rgba(255,255,240,0.05)'],
      right ? 23 : 29,
    )
    speckle(g, W, H, 0.03, right ? 3 : 9)
    g.fillStyle = 'rgba(90,70,50,0.13)'
    for (let y = 120; y < H - 50; y += 30) g.fillRect(36, y, W - 72, 1.5)
    const sx = right ? 0 : W
    const gg = g.createLinearGradient(sx, 0, sx + side * 120, 0)
    gg.addColorStop(0, 'rgba(70,40,10,0.45)')
    gg.addColorStop(1, 'rgba(70,40,10,0)')
    g.fillStyle = gg
    g.fillRect(0, 0, W, H)
  })
}

/** The edge of a block of pages, leaf on leaf. */
export function pageEdgeCanvas() {
  return paint(64, 128, (g) => {
    g.fillStyle = '#efe2c2'
    g.fillRect(0, 0, 64, 128)
    for (let y = 0; y < 128; y += 3) {
      g.fillStyle = y % 6 ? 'rgba(120,90,40,0.18)' : 'rgba(255,255,240,0.3)'
      g.fillRect(0, y, 64, 1)
    }
  })
}

/** The ribbon's cloth, notched at both ends, a gilt thread along each edge. */
export function ribbonCanvas() {
  const W = 1024
  const H = Math.round((W * RIBBON.d) / RIBBON.w)
  const n = (RIBBON.notch / RIBBON.w) * W
  return paint(W, H, (g) => {
    g.beginPath()
    g.moveTo(0, 0)
    g.lineTo(W, 0)
    g.lineTo(W - n, H / 2)
    g.lineTo(W, H)
    g.lineTo(0, H)
    g.lineTo(n, H / 2)
    g.closePath()
    const gr = g.createLinearGradient(0, 0, 0, H)
    gr.addColorStop(0, '#fbf5e4')
    gr.addColorStop(1, '#ead9b4')
    g.fillStyle = gr
    g.fill()
    g.save()
    g.clip()
    speckle(g, W, H, 0.035, 31)
    g.restore()
    g.fillStyle = '#d9a41e'
    g.fillRect(n + 10, 14, W - 2 * n - 20, 3)
    g.fillRect(n + 10, H - 17, W - 2 * n - 20, 3)
  })
}

const PIPS: Record<number, Array<[number, number]>> = {
  1: [[50, 50]],
  2: [
    [28, 28],
    [72, 72],
  ],
  3: [
    [26, 26],
    [50, 50],
    [74, 74],
  ],
  4: [
    [28, 28],
    [72, 28],
    [28, 72],
    [72, 72],
  ],
  5: [
    [26, 26],
    [74, 26],
    [50, 50],
    [26, 74],
    [74, 74],
  ],
  6: [
    [28, 24],
    [72, 24],
    [28, 50],
    [72, 50],
    [28, 76],
    [72, 76],
  ],
}

/** A face of the die, bone with ink pips (the ace in gules). */
export function dieFaceCanvas(n: number) {
  return paint(256, 256, (g, S) => {
    const gr = g.createRadialGradient(
      S * 0.4,
      S * 0.35,
      10,
      S / 2,
      S / 2,
      S * 0.75,
    )
    gr.addColorStop(0, '#fffaf0')
    gr.addColorStop(0.6, '#f1e6c9')
    gr.addColorStop(1, '#ddc9a0')
    g.fillStyle = gr
    g.fillRect(0, 0, S, S)
    speckle(g, S, S, 0.03, n * 7)
    const r = n === 1 ? 30 : 20
    for (const [x, y] of PIPS[n]) {
      const [px, py] = [(x / 100) * S, (y / 100) * S]
      g.fillStyle = n === 1 ? '#b3302a' : '#2b1e12'
      g.beginPath()
      g.arc(px, py, r, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = 'rgba(255,255,255,0.25)'
      g.beginPath()
      g.arc(px - r * 0.2, py + r * 0.35, r * 0.55, 0, Math.PI)
      g.fill()
    }
  })
}

/** A coin's face, struck with a shield: its colour, or its relief. */
export function coinCanvas(relief: boolean) {
  return paint(256, 256, (g, S) => {
    g.fillStyle = relief ? '#9a9a9a' : '#e2b448'
    g.fillRect(0, 0, S, S)
    g.strokeStyle = relief ? '#fff' : '#f7d77a'
    g.lineWidth = 12
    g.beginPath()
    g.arc(S / 2, S / 2, S * 0.43, 0, Math.PI * 2)
    g.stroke()
    g.strokeStyle = relief ? '#555' : '#9a6c14'
    g.lineWidth = 5
    g.beginPath()
    g.arc(S / 2, S / 2, S * 0.33, 0, Math.PI * 2)
    g.stroke()
    g.fillStyle = relief ? '#eee' : '#f4d277'
    g.setTransform(S / 200, 0, 0, S / 200, 0, 0)
    g.fill(new Path2D(heater(76, 64, 48, 60)))
    g.setTransform(1, 0, 0, 1, 0, 0)
  })
}

/** The candle's flame, soft, white at its heart, blue at its root. */
export function flameCanvas() {
  return paint(128, 256, (g) => {
    const path = new Path2D(
      'M64 18 C 80 70 104 130 98 176 C 94 214 80 236 64 236 C 48 236 34 214 30 176 C 24 130 48 70 64 18 Z',
    )
    // norm-ok: the flame is drawn art, soft by nature (the game surface's illustrations).
    g.filter = 'blur(6px)'
    let gr = g.createRadialGradient(64, 190, 4, 64, 170, 120)
    gr.addColorStop(0, 'rgba(255,255,240,1)')
    gr.addColorStop(0.25, 'rgba(255,236,160,1)')
    gr.addColorStop(0.6, 'rgba(255,160,60,0.9)')
    gr.addColorStop(1, 'rgba(255,110,30,0)')
    g.fillStyle = gr
    g.fill(path)
    g.filter = 'blur(3px)'
    gr = g.createRadialGradient(64, 196, 2, 64, 190, 40)
    gr.addColorStop(0, 'rgba(255,255,255,1)')
    gr.addColorStop(1, 'rgba(255,250,220,0)')
    g.fillStyle = gr
    g.beginPath()
    g.ellipse(64, 192, 16, 34, 0, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = 'rgba(60,90,200,0.35)'
    g.beginPath()
    g.ellipse(64, 226, 10, 8, 0, 0, Math.PI * 2)
    g.fill()
  })
}

/** Leather's grain, as a bump. */
export function leatherCanvas() {
  return paint(256, 256, (g) => {
    g.fillStyle = '#888'
    g.fillRect(0, 0, 256, 256)
    mottle(g, [256, 256, 60], ['rgba(0,0,0,0.25)', 'rgba(255,255,255,0.2)'], 51)
    speckle(g, 256, 256, 0.12, 53)
  })
}
