import { Container, Graphics } from 'pixi.js'
import { TONE } from '../palette'
import type { World } from '../../../engine'

// The margin round the frame, in ink, drawn once. Past the frame's outer
// rule, a chain of small lozenges and points runs round the map, a lozenge
// over every bar of the frame; then the scribe's ruling, a double hairline
// ruled from edge to edge of the leaf as on a manuscript page, crossing at
// each corner under a small rosette, fading as it goes out into the browned
// parchment. Under the map, at its right, a scale of leagues without words.
// All pale ink: it is the page, not the game.

/** Where the chain runs and the ruling lies, in map units past the map; the gap between the ruling's two lines. */
const CHAIN = 24
const RULE = 34
const PAIR = 4
/** The frame's bars, which the chain follows. */
const BAR = 40
/** How far out the ruling is drawn, and in how many steps it fades. */
const RUN = 1500
const STEPS = 10

/** The chain round the map: a lozenge at every bar, a point between two. */
function chain(g: Graphics, world: World) {
  const { width: W, height: H } = world
  const lozenge = (x: number, y: number, r: number) =>
    g.poly([x, y - r, x + r * 0.7, y, x, y + r, x - r * 0.7, y])
  for (let x = BAR / 2; x < W; x += BAR) {
    lozenge(x, -CHAIN, 3.2)
    lozenge(x, H + CHAIN, 3.2)
  }
  for (let y = BAR / 2; y < H; y += BAR) {
    lozenge(-CHAIN, y, 3.2)
    lozenge(W + CHAIN, y, 3.2)
  }
  g.fill({ color: TONE.ink, alpha: 0.4 })
  for (let x = BAR; x < W; x += BAR) {
    g.circle(x, -CHAIN, 0.9).circle(x, H + CHAIN, 0.9)
  }
  for (let y = BAR; y < H; y += BAR) {
    g.circle(-CHAIN, y, 0.9).circle(W + CHAIN, y, 0.9)
  }
  g.fill({ color: TONE.ink, alpha: 0.4 })
}

/** The ruling: two hairlines along each side, from the corners out to the leaf's edge, paler step by step. */
function ruling(g: Graphics, world: World) {
  const { width: W, height: H } = world
  const across = [-RULE - PAIR, -RULE]
  const down = [H + RULE, H + RULE + PAIR]
  const sideways = [-RULE - PAIR, -RULE]
  const right = [W + RULE, W + RULE + PAIR]
  const line = (ax: number, ay: number, bx: number, by: number) =>
    g.moveTo(ax, ay).lineTo(bx, by)
  // Within the corners, at full strength.
  for (const y of [...across, ...down])
    line(-RULE - PAIR, y, W + RULE + PAIR, y)
  for (const x of [...sideways, ...right])
    line(x, -RULE - PAIR, x, H + RULE + PAIR)
  g.stroke({ color: TONE.ink, alpha: 0.32, pixelLine: true })
  // Past them, out to the leaf's edge, fading.
  for (let k = 0; k < STEPS; k++) {
    const [a, b] = [(k / STEPS) * RUN, ((k + 1) / STEPS) * RUN]
    for (const y of [...across, ...down]) {
      line(-RULE - PAIR - a, y, -RULE - PAIR - b, y)
      line(W + RULE + PAIR + a, y, W + RULE + PAIR + b, y)
    }
    for (const x of [...sideways, ...right]) {
      line(x, -RULE - PAIR - a, x, -RULE - PAIR - b)
      line(x, H + RULE + PAIR + a, x, H + RULE + PAIR + b)
    }
    g.stroke({
      color: TONE.ink,
      alpha: 0.3 * (1 - k / STEPS) ** 1.5,
      pixelLine: true,
    })
  }
}

/** A rosette over each crossing of the ruling: four petals of parchment round a gold heart. */
function rosettes(g: Graphics, world: World) {
  const m = RULE + PAIR / 2
  for (const [x, y] of [
    [-m, -m],
    [world.width + m, -m],
    [-m, world.height + m],
    [world.width + m, world.height + m],
  ]) {
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 + Math.PI / 4
      g.circle(x + Math.cos(a) * 3.4, y + Math.sin(a) * 3.4, 2.8)
    }
    g.fill(TONE.page).stroke({ width: 0.8, color: TONE.ink, alpha: 0.7 })
    g.circle(x, y, 1.7).fill(TONE.gold).stroke({ width: 0.6, color: TONE.ink })
  }
}

/** A scale of leagues under the map: five bars of the frame, ink and parchment, the first cut in four. */
function scale(g: Graphics, world: World) {
  const [x0, y] = [world.width - 5 * BAR, world.height + RULE + PAIR + 22]
  for (let i = 0; i < 5; i++)
    g.rect(x0 + i * BAR, y, BAR, 4).fill(i % 2 ? TONE.page : TONE.ink)
  for (let i = 0; i < 4; i += 2)
    g.rect(x0 + (i * BAR) / 4, y - 4, BAR / 4, 4).fill(TONE.ink)
  g.rect(x0, y - 4, BAR, 8).rect(x0 + BAR, y, 4 * BAR, 4)
  g.stroke({ width: 0.7, color: TONE.ink })
  for (let i = 0; i <= 5; i++)
    g.moveTo(x0 + i * BAR, y - 3).lineTo(x0 + i * BAR, y - 7)
  g.stroke({ width: 0.7, color: TONE.ink })
  g.alpha = 0.75
}

export function makeMargin(world: World): Container {
  const g = new Graphics()
  chain(g, world)
  ruling(g, world)
  rosettes(g, world)
  const bar = new Graphics()
  scale(bar, world)
  const margin = new Container()
  margin.addChild(g, bar)
  return margin
}
