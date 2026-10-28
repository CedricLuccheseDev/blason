import { Container, Graphics } from 'pixi.js'
import { TONE } from '../palette'
import { makeLeaf } from './leaf'
import { makeMargin } from './margin'
import type { World } from '../../../engine'

// The page of the manuscript the map is drawn on: the map sits in an inked
// frame, two rules and a band of ink and parchment between, a gold lozenge
// at each corner; past it the leaf goes on, browning and foxed (leaf.ts),
// with its margin in pale ink (margin.ts). A compass rose lies in the open
// sea.

/** How far the page is drawn past the map, in world units: farther than the widest zoom shows. */
export const REACH = 6000
const BAND = 9
const BAR = 40

function frame(world: World): Graphics {
  const { width: W, height: H } = world
  const g = new Graphics()
  g.rect(-BAND, -BAND, W + 2 * BAND, H + 2 * BAND).stroke({
    width: BAND,
    color: TONE.ink,
  })
  for (let x = 0; x < W; x += 2 * BAR) {
    g.rect(x, -BAND * 0.78, Math.min(BAR, W - x), BAND * 0.56)
    if (x + BAR < W)
      g.rect(x + BAR, H + BAND * 0.22, Math.min(BAR, W - x - BAR), BAND * 0.56)
  }
  for (let y = 0; y < H; y += 2 * BAR) {
    if (y + BAR < H)
      g.rect(-BAND * 0.78, y + BAR, BAND * 0.56, Math.min(BAR, H - y - BAR))
    g.rect(W + BAND * 0.22, y, BAND * 0.56, Math.min(BAR, H - y))
  }
  g.fill(TONE.page)
  g.rect(-BAND - 5, -BAND - 5, W + 2 * BAND + 10, H + 2 * BAND + 10).stroke({
    width: 1,
    color: TONE.ink,
  })
  for (const [x, y] of [
    [-BAND, -BAND],
    [W + BAND, -BAND],
    [-BAND, H + BAND],
    [W + BAND, H + BAND],
  ]) {
    g.rect(x - 9, y - 9, 18, 18)
      .fill(TONE.page)
      .stroke({ width: 1.6, color: TONE.ink })
    g.poly([x, y - 6, x + 6, y, x, y + 6, x - 6, y])
      .fill(TONE.gold)
      .stroke({ width: 1, color: TONE.ink })
  }
  return g
}

/** The sea's open water farthest from any land, and how far it is. */
function openSea(world: World) {
  let best = { x: 0, y: 0, d: 0 }
  for (const c of world.map.sea) {
    let d = Infinity
    for (const f of world.map.land)
      d = Math.min(d, Math.hypot(f.x - c.x, f.y - c.y))
    if (d > best.d) best = { x: c.x, y: c.y, d }
  }
  return best
}

function rose(world: World): Graphics | null {
  const { x, y, d } = openSea(world)
  if (d < 60) return null
  const r = Math.min(46, d * 0.55)
  const g = new Graphics()
  g.circle(x, y, r * 0.72).stroke({ width: 0.8, color: TONE.ink, alpha: 0.85 })
  g.circle(x, y, r * 0.66).stroke({ width: 0.5, color: TONE.ink, alpha: 0.85 })
  const ray = (a: number, length: number, half: number, shaded: boolean) => {
    const [c, s] = [Math.cos(a), Math.sin(a)]
    const [n, m] = [Math.cos(a + Math.PI / 2), Math.sin(a + Math.PI / 2)]
    const tip = [x + c * length, y + s * length]
    g.poly([x, y, x + n * half, y + m * half, ...tip])
      .fill(shaded ? TONE.page : TONE.ink)
      .stroke({ width: 0.7, color: TONE.ink })
    g.poly([x, y, x - n * half, y - m * half, ...tip])
      .fill(shaded ? TONE.ink : TONE.page)
      .stroke({ width: 0.7, color: TONE.ink })
  }
  for (let i = 0; i < 4; i++)
    ray(((i * 90 + 45) * Math.PI) / 180, r * 0.62, r * 0.12, false)
  for (let i = 0; i < 4; i++)
    ray((i * Math.PI) / 2 - Math.PI / 2, r, r * 0.16, true)
  g.alpha = 0.85
  return g
}

export function makePage(world: World) {
  const container = new Container()
  const leaf = makeLeaf(world)
  container.addChild(leaf.container, makeMargin(world))
  const compass = rose(world)
  return { container, frame: frame(world), compass, destroy: leaf.destroy }
}
