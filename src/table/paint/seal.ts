import { chevron, heater } from './drawings'
import { mottle, paint } from './canvas'
import type { Pen } from './canvas'

// The seal's face, three times over: its colour (azure wax, the well the
// matrix pressed, a ring of beads, the shield and its chevron), its relief
// (a bump map, light is high) and its glow (what lights up when pressed).

const S = 1024
const U = S / 200
const MID = S / 2

type Coat = {
  ground: string
  well: [string, string]
  bead: string
  shield: [string, string, string]
}

const COLOUR: Coat = {
  ground: '#2f6db5',
  well: ['#16457f', '#245695'],
  bead: '#e7bd4a',
  shield: ['#1d4a83', '#e7bd4a', '#f0c75a'],
}
const RELIEF: Coat = {
  ground: '#b8b8b8',
  well: ['#6a6a6a', '#8a8a8a'],
  bead: '#dcdcdc',
  shield: ['#7a7a7a', '#e8e8e8', '#f0f0f0'],
}
const GLOW: Coat = {
  ground: '#000',
  well: ['#000', '#000'],
  bead: '#fff',
  shield: ['#000', '#fff', '#fff'],
}

function disc(g: Pen, r: number, fill: string) {
  g.fillStyle = fill
  g.beginPath()
  g.arc(MID, MID, r * U, 0, Math.PI * 2)
  g.fill()
}

function face(coat: Coat, grain: boolean) {
  return paint(S, S, (g) => {
    g.fillStyle = coat.ground
    g.fillRect(0, 0, S, S)
    if (grain)
      mottle(
        g,
        [S, S, 40],
        ['rgba(10,30,70,0.18)', 'rgba(140,180,240,0.08)'],
        41,
      )
    disc(g, 70, coat.well[0])
    disc(g, 64, coat.well[1])
    g.fillStyle = coat.bead
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2
      g.beginPath()
      g.arc(
        MID + Math.cos(a) * 56 * U,
        MID + Math.sin(a) * 56 * U,
        1.9 * U,
        0,
        Math.PI * 2,
      )
      g.fill()
    }
    const [fill, stroke, chev] = coat.shield
    g.setTransform(U, 0, 0, U, MID - 100 * U, MID - 100 * U)
    const p = new Path2D(heater(68, 52, 64, 80))
    g.fillStyle = fill
    g.fill(p)
    g.lineWidth = 4.2
    g.strokeStyle = stroke
    g.lineJoin = 'round'
    g.stroke(p)
    g.fillStyle = chev
    g.fill(new Path2D(chevron(70, 54, 60, 76)))
    g.setTransform(1, 0, 0, 1, 0, 0)
  })
}

/** The seal's colour, relief and glow. */
export function sealCanvases() {
  return {
    color: face(COLOUR, true),
    bump: face(RELIEF, false),
    glow: face(GLOW, false),
  }
}
