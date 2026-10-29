import { Container, Sprite } from 'pixi.js'
import { glint, hoer, puff, sails } from '../art/life'
import { GLINTS } from '../art/market'
import { CHIMNEYS, HUB } from '../art/village'
import {
  WORK_SPAN,
  canvasFor,
  textureOf,
  workLod,
  workScale,
} from '../art/works'
import { fades, still } from '../ground/detail'
import { siteOf } from '../marks'
import { quality } from '../quality'
import type { Texture } from 'pixi.js'
import type { Field } from '../ground/fields'
import type { Box } from '../camera'
import type { GameState, Work } from '../../../engine'

// What lives on the land, only for what is on screen and only from mid
// distance, slow and small: the mills' sails turning, and up close the
// chimneys' smoke, the peasants hoeing their fields, the gold glinting on
// the markets. Still under reduced motion, held as it stands; when the
// frames run long (quality.ts), only the sails, and at the least still.

/** Peasant poses, from upright to bent to the hoe. */
const POSES = 8

type Stamp = { texture: Texture; ax: number; ay: number }
const stamps = new Map<string, Stamp>()

/** A drawing of the life's, made the first time: centred on (0, 0) in a box so wide and high round it, at so many pixels a unit. */
function stamp(
  name: string,
  half: number,
  px: number,
  draw: Parameters<typeof canvasFor>[1],
): Stamp {
  let s = stamps.get(name)
  if (!s) {
    const box = { left: -half, top: -half, width: half * 2, height: half * 2 }
    s = { texture: textureOf(canvasFor(px, draw, box)), ax: 0.5, ay: 0.5 }
    stamps.set(name, s)
  }
  return s
}

export function makeLife(fieldsNear: (view: Box) => Array<Field>) {
  const container = new Container()
  const pool: Array<Sprite> = []
  let used = 0

  /** A sprite of the pool, laid at a point, so large, so strong. */
  function lay(
    s: Stamp,
    x: number,
    y: number,
    scale: number,
    alpha: number,
    rotation = 0,
  ) {
    const sprite = (pool[used] ??= container.addChild(new Sprite()))
    used++
    sprite.texture = s.texture
    sprite.anchor.set(s.ax, s.ay)
    sprite.position.set(x, y)
    sprite.scale.set((scale * 2) / s.texture.width)
    sprite.rotation = rotation
    sprite.alpha = alpha
    sprite.visible = true
    return sprite
  }

  function village(
    x: number,
    y: number,
    k: number,
    lod: 1 | 2,
    t: number,
    near: number,
  ) {
    const sail = stamp(`sails${lod}`, 6.5, lod === 2 ? 9 : 4.4, (p) =>
      sails(p, 0, lod),
    )
    lay(sail, x + HUB[0] * k, y + HUB[1] * k, 6.5 * k, 1, t * 0.9 + x)
    if (lod < 2 || !quality().bustle) return
    const smoke = stamp('puff', 0.6, 9, puff)
    CHIMNEYS.forEach(([cx, cy], i) => {
      for (let p = 0; p < 5; p++) {
        const u = (t * 0.22 + p / 5 + i * 0.37) % 1
        const px = cx + u * 2.4 + Math.sin(u * 6 + i) * 0.35
        lay(
          smoke,
          x + px * k,
          y + (cy - u * 5.2) * k,
          k * (0.384 + 1.26 * u),
          0.42 * (1 - u) * near,
        )
      }
    })
  }

  function market(x: number, y: number, k: number, t: number) {
    const shine = stamp('glint', 0.6, 9, glint)
    GLINTS.forEach(([gx, gy], i) => {
      const a = Math.max(0, Math.sin(t * 1.7 + i * 2.1)) ** 3
      if (a >= 0.02)
        lay(shine, x + gx * k, y + gy * k, 0.6 * k * 0.9 * a * 2, a)
    })
  }

  /** The life of a work: a village's, a market's up close. */
  function at(
    work: Work,
    x: number,
    y: number,
    k: number,
    lod: 1 | 2,
    t: number,
    near: number,
  ) {
    if (work === 'village') village(x, y, k, lod, t, near)
    else if (work === 'market' && lod === 2 && quality().bustle)
      market(x, y, k, t)
  }

  /** A peasant hoeing his field, bent to it and up again. */
  function peasant(fd: Field, t: number, near: number) {
    const pose = Math.floor(
      (Math.sin(t * 2.4 + fd.x) * 0.5 + 0.5) * (POSES - 1) + 0.5,
    )
    const man = stamp(`hoer${pose}`, 3, 12, (p) => hoer(p, pose / (POSES - 1)))
    lay(man, fd.x, fd.y + 1, 3 * 1.5, near)
  }

  return {
    container,
    draw(state: GameState, view: Box, zoom: number, now: number) {
      used = 0
      const f = fades(zoom * state.grid.size)
      const { turning, bustle } = quality()
      const t = still() || !turning ? 0 : now / 1000
      const k = workScale(zoom)
      const lod = workLod(WORK_SPAN * zoom * k)
      const seen = (x: number, y: number, m: number) =>
        x > view.left - m &&
        x < view.right + m &&
        y > view.top - m &&
        y < view.bottom + m
      if (f.mid > 0 && lod > 0)
        for (const work of state.works) {
          const { x, y } = siteOf(state, work.tile)
          if (seen(x, y, 24 * k))
            at(work.work, x, y, k, lod as 1 | 2, t, f.near)
        }
      if (f.near > 0 && bustle)
        fieldsNear(view).forEach((fd, i) => {
          if (i % 4 === 1 && seen(fd.x, fd.y, 4)) peasant(fd, t, f.near)
        })
      for (let i = used; i < pool.length; i++) pool[i].visible = false
    },
  }
}
