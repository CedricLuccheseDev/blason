import { Container, Graphics, Sprite } from 'pixi.js'
import { jitter } from '../art/melee'
import { TONE } from '../palette'
import type { Point } from '../../../engine'
import type { Stamps } from '../textures'

// A battle as the player watches it: two ranks in their lords' colours face
// each other across the border, soldiers against soldiers, or soldiers
// against the peasants who hold the land with their pitchforks, each man
// lunging in and stepping back on his own beat, in a cloud of dust struck
// with sparks.
// The ranks grow with the armies by orders of magnitude: a handful of men
// for a skirmish, a wall of them for a great battle. Drawn at the map's
// scale: they grow and shrink with the zoom, in proportion to the land.

/** World units for each of the sizes below: a soldier stands about two tiles tall. */
const WORLD = 0.55
/** A soldier's height, and as drawn in his stamp. */
const TALL = 22
const DRAWN = 13
/** Room between two men of a rank, and from the border to the front row. */
const SPACING = 10
const GAP = 7
const DUST = 0xb59a72

/** Men in a rank for an army of this many soldiers: two to nine, by orders of magnitude. */
export const rankOf = (count: number) =>
  Math.max(2, Math.min(9, 2 + Math.floor(Math.log2(1 + (count * 10) / 6))))

/** What a side of a fight is made of: an army's soldiers, or the peasants who hold their land. */
export type Kind = 'soldier' | 'peasant'

export type Clash = {
  at: Point
  /** From the defended land towards the attacker, of length one. */
  out: Point
  colors: [attacker: number, defender: number]
  ranks: [attacker: number, defender: number]
  kinds: [attacker: Kind, defender: Kind]
  /** How far it has faded in, 0 to 1: a fight comes and goes, it never blinks. */
  alpha: number
  seed: number
}

/** `scale`: world units for each of the sizes above, smaller on a land of small cells. */
export function makeMelee(stamps: Stamps, scale = WORLD) {
  const container = new Container()
  const dust = container.addChild(new Graphics())
  const troops = container.addChild(new Container())
  const sparks = container.addChild(new Graphics())
  troops.sortableChildren = true
  const pool: Array<Sprite> = []
  let used = 0

  function man(color: number, kind: Kind, alpha: number): Sprite {
    const sprite = pool[used] ?? troops.addChild(new Sprite())
    pool[used++] = sprite
    const stamp = stamps[kind](color)
    sprite.alpha = alpha
    sprite.texture = stamp.texture
    sprite.anchor.set(stamp.anchor.x, stamp.anchor.y)
    sprite.visible = true
    return sprite
  }

  /** One side's rank, on its side of the border, facing the other. */
  function rank(clash: Clash, side: 0 | 1, seconds: number) {
    const { at, out, seed } = clash
    const sign = side === 0 ? 1 : -1
    const along: Point = [-out[1], out[0]]
    const n = clash.ranks[side]
    const facing = out[0] * -sign >= 0 ? 1 : -1
    const k = scale
    for (let i = 0; i < n; i++) {
      const phase = seed * 1.7 + i * 2.3 + side * 1.1
      const lunge = Math.max(0, Math.sin(seconds * 5 + phase)) * 5
      const depth = GAP + (i % 2) * SPACING * 0.7 - lunge
      const lateral = (i - (n - 1) / 2) * SPACING
      const sprite = man(clash.colors[side], clash.kinds[side], clash.alpha)
      const x = at[0] + (out[0] * sign * depth + along[0] * lateral) * k
      const y = at[1] + (out[1] * sign * depth + along[1] * lateral) * k
      const step = Math.abs(Math.sin(seconds * 9 + phase)) * 1.8 * k
      sprite.position.set(x, y - step)
      sprite.scale.set((facing * TALL * k) / DRAWN, (TALL * k) / DRAWN)
      sprite.zIndex = y
    }
  }

  /** The dust raised along the line, drifting, and sparks where iron meets iron. */
  function air(clash: Clash, seconds: number) {
    const { at, out, seed } = clash
    const along: Point = [-out[1], out[0]]
    const width = Math.max(...clash.ranks) * SPACING
    const k = scale
    for (let d = 0; d < 6; d++) {
      const drift = ((seconds * 0.35 + d / 6) % 1) * 2 - 1
      const x =
        at[0] +
        (along[0] * drift * width * 0.6 + jitter(seed + d, seconds / 8) * 4) * k
      const y =
        at[1] + (along[1] * drift * width * 0.6 - (1 - Math.abs(drift)) * 6) * k
      dust.circle(x, y, (7 + (d % 3) * 3) * k)
    }
    dust.fill({ color: DUST, alpha: 0.16 * clash.alpha })
    for (let s = 0; s < 3; s++) {
      const u = jitter(seed * 3 + s, seconds) * width * 0.5
      const v = jitter(seed * 5 - s, seconds) * 3
      const x = at[0] + (along[0] * u + out[0] * v) * k
      const y = at[1] + (along[1] * u + out[1] * v) * k - 9 * k
      const r = (2 + (s % 2)) * k
      sparks
        .moveTo(x - r, y)
        .lineTo(x + r, y)
        .moveTo(x, y - r)
        .lineTo(x, y + r)
    }
    sparks.stroke({
      width: 1.1 * k,
      color: TONE.goldLight,
      cap: 'round',
      alpha: clash.alpha,
    })
  }

  return {
    container,
    draw(clashes: Array<Clash>, seconds: number) {
      used = 0
      dust.clear()
      sparks.clear()
      for (const clash of clashes) {
        air(clash, seconds)
        rank(clash, 0, seconds)
        rank(clash, 1, seconds)
      }
      for (let i = used; i < pool.length; i++) pool[i].visible = false
    },
  }
}
