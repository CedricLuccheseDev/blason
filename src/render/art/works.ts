import { TONE } from '../palette'
import type { Graphics } from 'pixi.js'
import type { Work } from '../../../engine'

// The works as the boards draw them, small ink drawings at the land's
// scale, centred on (0, 0), some twenty map units across: a village of
// houses round its church amid its fields, a castle's curtain wall with its
// towers and keep, a market's two stalls and its heaped gold.

const LINE = { color: TONE.outline, width: 0.3 } as const

/** Six patches of fields round the village, furrows across. */
function fields(g: Graphics) {
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.4
    const cx = Math.cos(a) * 11
    const cy = Math.sin(a) * 8
    // Furrows along the ring, four lines a patch.
    const ux = -Math.sin(a)
    const uy = Math.cos(a)
    for (let j = 0; j < 4; j++) {
      const off = -1.5 + j
      const px = cx + Math.cos(a) * off
      const py = cy + Math.sin(a) * off
      g.moveTo(px - ux * 3.4, py - uy * 3.4).lineTo(
        px + ux * 3.4,
        py + uy * 3.4,
      )
    }
  }
  g.stroke({ color: TONE.ink, alpha: 0.45, width: 0.45 })
}

const HOUSES: ReadonlyArray<[number, number, number, number]> = [
  [-4.6, -2.6, 3.4, 2.3],
  [5.6, -1.2, 3.2, 2.2],
  [-6.2, 1, 3.8, 2.5],
  [-1.6, 1.4, 3.9, 2.6],
  [3.4, 1.9, 3.5, 2.4],
]

function village(g: Graphics) {
  fields(g)
  g.ellipse(0, 1, 9.5, 2.66).fill({ color: TONE.ink, alpha: 0.16 })
  // The church behind, then the houses from the back to the front.
  g.rect(-0.4, -8.6, 2.2, 6.4).fill(TONE.stone).stroke(LINE)
  g.poly([-0.7, -8.6, 0.7, -12, 2.1, -8.6]).fill(TONE.slate).stroke(LINE)
  ;[...HOUSES]
    .sort((a, b) => a[1] - b[1])
    .forEach(([x, y, w, h], n) => {
      g.rect(x - w / 2, y - h, w, h)
        .fill(TONE.wall)
        .stroke(LINE)
      g.poly([
        x - w / 2 - 0.4,
        y - h,
        x - w / 2 + 0.8,
        y - h - h * 0.9,
        x + w / 2 - 0.8,
        y - h - h * 0.9,
        x + w / 2 + 0.4,
        y - h,
      ])
        .fill(TONE.roofs[n % TONE.roofs.length])
        .stroke(LINE)
    })
}

function castle(g: Graphics) {
  const r = 5.6
  g.ellipse(0, 4.6, 7.5, 2).fill({ color: TONE.ink, alpha: 0.16 })
  g.ellipse(0, 0, r, r * 0.8).stroke({ color: TONE.ink, width: 2.4 })
  g.ellipse(0, 0, r, r * 0.8).stroke({ color: TONE.rampart, width: 1.5 })
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3
    g.rect(Math.cos(a) * r - 1.3, Math.sin(a) * r * 0.8 - 1.6, 2.6, 2.8)
      .fill(TONE.rampart)
      .stroke({ color: TONE.ink, width: 0.45 })
  }
  g.rect(-2, -4.4, 4, 5)
    .fill(TONE.rampart)
    .stroke({ color: TONE.ink, width: 0.5 })
  g.poly([-2.4, -4.4, 0, -7, 2.4, -4.4])
    .fill(TONE.slate)
    .stroke({ color: TONE.ink, width: 0.45 })
}

function stall(g: Graphics, x: number, y: number) {
  g.rect(x - 2.4, y - 1.8, 4.8, 2.2)
    .fill(TONE.wall)
    .stroke({ color: TONE.ink, width: 0.35 })
  g.poly([x - 3, y - 1.8, x - 2, y - 3.8, x + 2, y - 3.8, x + 3, y - 1.8])
    .fill(TONE.loss)
    .stroke({ color: TONE.ink, width: 0.35 })
}

const COINS: ReadonlyArray<[number, number]> = [
  [-1.6, 3.2],
  [0.6, 3.6],
  [2.6, 3],
  [-0.4, 2.2],
  [1.6, 2],
]

function market(g: Graphics) {
  g.ellipse(0, 4.4, 7, 1.8).fill({ color: TONE.ink, alpha: 0.16 })
  stall(g, -3.6, -0.6)
  stall(g, 3.4, -1.4)
  for (const [x, y] of COINS)
    g.circle(x, y, 1.2).fill(TONE.gold).stroke({ color: TONE.ink, width: 0.3 })
}

/** Two tents and a pennant on its pole: where the armies are raised and sent from. */
function barracks(g: Graphics) {
  g.ellipse(0, 4.4, 7, 1.8).fill({ color: TONE.ink, alpha: 0.16 })
  for (const x of [-3.2, 3]) {
    g.poly([x - 2.8, 3.2, x, -2.2, x + 2.8, 3.2])
      .fill(TONE.wall)
      .stroke({ color: TONE.ink, width: 0.4 })
    g.moveTo(x, 3.2).lineTo(x, 0.4).stroke({ color: TONE.ink, width: 0.35 })
  }
  g.moveTo(0, 3.4).lineTo(0, -6.6).stroke({ color: TONE.ink, width: 0.5 })
  g.poly([0, -6.6, 3.6, -5.6, 0, -4.6])
    .fill(TONE.loss)
    .stroke({ color: TONE.ink, width: 0.3 })
}

const DRAWINGS: Record<Work, (g: Graphics) => void> = {
  village,
  market,
  barracks,
  castle,
}

/** A work drawn as on the boards, centred on (0, 0). */
export function drawWork(g: Graphics, work: Work): void {
  DRAWINGS[work](g)
}
