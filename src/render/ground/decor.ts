import { CanvasSource, Container, Sprite, Texture } from 'pixi.js'
import { quality } from '../quality'
import { makeCache } from './cache'
import { fades } from './detail'
import { makeChanges } from './changes'
import { paint } from './paint'
import type { Painted } from './cache'
import type { Ground } from './paint'
import type { Box } from '../camera'

// The ground's decoration on the map: cut into chunks of sixteen tiles a
// side, each painted on a canvas once per level of zoom (a level every half
// power of two, as sharp as the screen) and kept on the graphics card, laid
// over the washes and multiplied into them. A chunk is painted again only
// when the land under it changed hands or the zoom passed to another
// level, a few each frame within a small budget of time (quality.ts), the
// middle of the screen first; meanwhile the nearest level painted stands in,
// and the new one fades in over the old. A chunk already painted at the
// level waits a little before it is painted again, however often a front
// moves through it: its trees on a border linger a moment. The whole fades
// in from mid distance.

/** Tiles a side of a chunk; ms a chunk takes to fade into another; ms a chunk painted waits before it is painted again. */
const SIDE = 16
const FADE_MS = 250
const STALE_MS = 900

type Slot = { now: Sprite; was: Sprite; since: number }

export function makeDecor(ground: Omit<Ground, 'weights' | 'fieldsNear'>) {
  const { grid } = ground
  const container = new Container()
  const changes = makeChanges(ground.grid, ground.terrain, SIDE)
  const cache = makeCache()
  const span = SIDE * grid.size
  const [cols, rows] = [
    Math.ceil(grid.width / SIDE),
    Math.ceil(grid.height / SIDE),
  ]
  const slots = new Map<number, Slot>()
  const density = () => quality().resolution

  function sprite() {
    const s = container.addChild(new Sprite())
    s.blendMode = 'multiply'
    s.eventMode = 'none'
    return s
  }

  function bake(chunk: number, level: number, now: number): Painted {
    const q = 2 ** (level / 2)
    const size = Math.ceil(span * q)
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = size
    const g = canvas.getContext('2d')
    const [x0, y0] = [(chunk % cols) * span, Math.floor(chunk / cols) * span]
    if (g) {
      g.setTransform(q, 0, 0, q, -x0 * q, -y0 * q)
      const px = q / density()
      paint(
        { g, px },
        changes.ground(),
        { x0, y0, x1: x0 + span, y1: y0 + span },
        px * grid.size,
        quality().shadows,
      )
    }
    // Painted for its level, it is never shrunk much: no mipmaps, a third less memory.
    const source = new CanvasSource({ resource: canvas })
    return {
      texture: new Texture({ source }),
      level,
      version: changes.version(chunk),
      pixels: size * size,
      at: now,
    }
  }

  function show(chunk: number, texture: Texture, now: number) {
    let slot = slots.get(chunk)
    if (!slot) {
      slot = { now: sprite(), was: sprite(), since: -Infinity }
      for (const s of [slot.now, slot.was]) {
        s.position.set((chunk % cols) * span, Math.floor(chunk / cols) * span)
      }
      slots.set(chunk, slot)
    }
    if (slot.now.texture !== texture) {
      slot.was.texture = slot.now.texture
      slot.now.texture = texture
      slot.since = now
    }
    for (const s of [slot.now, slot.was]) {
      s.width = span
      s.height = span
    }
    return slot
  }

  /** The chunks a view covers, the middle first. */
  function covered(view: Box) {
    const list: Array<number> = []
    const [c0, c1] = [
      Math.max(0, Math.floor(view.left / span)),
      Math.min(cols - 1, Math.floor(view.right / span)),
    ]
    const [r0, r1] = [
      Math.max(0, Math.floor(view.top / span)),
      Math.min(rows - 1, Math.floor(view.bottom / span)),
    ]
    for (let r = r0; r <= r1; r++)
      for (let c = c0; c <= c1; c++) list.push(r * cols + c)
    const [mx, my] = [
      (view.left + view.right) / 2 / span - 0.5,
      (view.top + view.bottom) / 2 / span - 0.5,
    ]
    const far = (k: number) =>
      Math.hypot((k % cols) - mx, Math.floor(k / cols) - my)
    return list.sort((a, b) => far(a) - far(b))
  }

  return {
    container,
    /** The lands, the works and the roads read again: the chunks whose ground they changed are painted anew. */
    relayout: changes.relayout,
    fieldsNear: (x0: number, y0: number, x1: number, y1: number) =>
      changes.ground().fieldsNear(x0, y0, x1, y1),
    draw(view: Box, zoom: number, now: number) {
      const f = fades(zoom * grid.size)
      container.visible = f.mid > 0
      if (!container.visible) return
      const level = Math.max(
        -4,
        Math.min(10, Math.round(2 * Math.log2(zoom * density()))),
      )
      const shown = new Set<number>()
      const inUse = new Set<Texture>()
      const until = performance.now() + quality().paintMs
      for (const chunk of covered(view)) {
        if (!changes.worth(chunk, f.near > 0)) continue
        let p = cache.get(chunk, level)
        // Missing at this level, or stale and done waiting: painted while the budget lasts, one at least.
        const due =
          !p || (p.version !== changes.version(chunk) && now - p.at > STALE_MS)
        if (due && performance.now() < until) {
          p = bake(chunk, level, now)
          cache.put(chunk, p, inUse)
        }
        p ??= cache.nearest(chunk, level)
        if (!p) continue
        const slot = show(chunk, p.texture, now)
        const t = Math.min(1, (now - slot.since) / FADE_MS)
        slot.now.alpha = f.mid * t
        slot.was.alpha = f.mid * (1 - t)
        slot.now.visible = true
        slot.was.visible = t < 1
        inUse.add(slot.now.texture)
        if (t < 1) inUse.add(slot.was.texture)
        shown.add(chunk)
      }
      for (const [chunk, slot] of slots)
        if (!shown.has(chunk)) {
          slot.now.visible = slot.was.visible = false
          slot.now.texture = slot.was.texture = Texture.EMPTY
        }
      cache.sweep(inUse)
    },
    destroy() {
      cache.destroy()
    },
  }
}
