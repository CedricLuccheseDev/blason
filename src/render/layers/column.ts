import { Container, Graphics, Sprite } from 'pixi.js'
import { UNIT, marching } from '../../../engine'
import { playerColor } from '../palette'
import { siteOf } from '../marks'
import { rankOf } from './melee'
import type { GameState, Host } from '../../../engine'
import type { Stamps } from '../textures'

// An army on its road: a column of soldiers in its lord's colour walks from
// its barracks to the front, smoothly between two ticks, and what is left of
// its road is dotted before it, then on to the tile clicked, so that the lord
// it marches on sees it coming. At the land's scale, as the battles.

/** World units for each size of a soldier, as in the battles. */
const WORLD = 0.2
/** A soldier's height, and as drawn in his stamp. */
const TALL = 22
const DRAWN = 13
/** Tiles between two men of the column, and between two dots of the road. */
const STRIDE = 1
const DOTS = 2

/** How far along its road an army's head is, in tiles, so far into the next tick. */
export function headOf(state: GameState, host: Host, between: number) {
  const end = host.road.length - 1
  const moved = host.fighting ? 0 : state.rules.marchPace * between
  return Math.min(end, (host.along + moved) / 1000)
}

/** A point of a road, so many tiles along it, and whether it goes right there. */
export function pointOn(state: GameState, road: Array<number>, at: number) {
  const clamped = Math.max(0, Math.min(road.length - 1, at))
  const i = Math.min(road.length - 2, Math.floor(clamped))
  if (i < 0) return { ...siteOf(state, road[0]), right: true }
  const a = siteOf(state, road[i])
  const b = siteOf(state, road[i + 1])
  const t = clamped - i
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    right: b.x >= a.x,
  }
}

export function makeColumns(stamps: Stamps) {
  const container = new Container()
  const paths = container.addChild(new Graphics())
  const troops = container.addChild(new Container())
  troops.sortableChildren = true
  const pool: Array<Sprite> = []
  let used = 0

  function man(color: number): Sprite {
    const sprite = pool[used] ?? troops.addChild(new Sprite())
    pool[used++] = sprite
    const stamp = stamps.soldier(color)
    sprite.texture = stamp.texture
    sprite.anchor.set(stamp.anchor.x, stamp.anchor.y)
    sprite.visible = true
    return sprite
  }

  /** The road left before the army, then straight on to the tile clicked, dotted. */
  function dot(state: GameState, host: Host, head: number, zoom: number) {
    const r = 0.9 / zoom + 0.3
    for (let at = Math.ceil(head + 1); at < host.road.length; at += DOTS) {
      const p = siteOf(state, host.road[at])
      paths.circle(p.x, p.y, r)
    }
    const from = siteOf(state, host.road.at(-1) ?? host.entry)
    const to = siteOf(state, host.aim)
    const tiles = Math.hypot(to.x - from.x, to.y - from.y) / state.grid.size
    for (let d = DOTS; d < tiles; d += DOTS) {
      const t = d / tiles
      paths.circle(
        from.x + (to.x - from.x) * t,
        from.y + (to.y - from.y) * t,
        r,
      )
    }
    paths.fill({ color: playerColor(host.owner), alpha: 0.75 })
  }

  /** Its men one behind the other on the road, each stepping on his own beat. */
  function walk(state: GameState, host: Host, head: number, seconds: number) {
    const n = rankOf(host.men / UNIT / 4)
    const k = WORLD
    for (let i = 0; i < n; i++) {
      const p = pointOn(state, host.road, head - i * STRIDE)
      const step = host.fighting
        ? 0
        : Math.abs(Math.sin(seconds * 9 + i * 1.3)) * 1.8 * k
      const sprite = man(playerColor(host.owner))
      sprite.position.set(p.x, p.y - step)
      const facing = p.right ? 1 : -1
      sprite.scale.set((facing * TALL * k) / DRAWN, (TALL * k) / DRAWN)
      sprite.zIndex = p.y
    }
  }

  return {
    container,
    draw(state: GameState, zoom: number, between: number) {
      const seconds = performance.now() / 1000
      paths.clear()
      used = 0
      for (const host of state.hosts) {
        if (!marching(host)) continue
        const head = headOf(state, host, between)
        dot(state, host, head, zoom)
        walk(state, host, head, seconds)
      }
      for (let i = used; i < pool.length; i++) pool[i].visible = false
    },
  }
}
