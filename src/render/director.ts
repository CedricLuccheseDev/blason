import { siteOf } from './marks'
import type { Application, Container } from 'pixi.js'
import type { GameState, Host } from '../../engine'

// The spectator's camera, as a director: every few seconds it picks the
// fiercest fight on the land and glides to it, following its front as it
// moves, the land breathing a little under it; in the opening it shows the
// whole land, and when no one fights, the realm of the first. What it looks
// at stays in the part of the screen a menu leaves free, on the left or
// at the bottom. Under
// reduced motion it holds the whole land, still.

/** How often it looks for a fiercer fight, and how long it stays at least. */
const [EVERY, DWELL] = [9000, 3000]
/** Share of the way covered in a sixtieth of a second: a slow glide. */
const GLIDE = 0.018
/** World units kept around a fight; the closest it comes, against the whole land. */
const [ROOM, CLOSEST] = [150, 4]

type Shot = { x: number; y: number; k: number }

/** What a menu covers of the screen, in pixels. */
export type Room = { left: number; bottom: number }

export function makeDirector(
  app: Application,
  world: Container,
  size: { width: number; height: number },
  state: GameState,
  /** The room the menu takes, in pixels: on the left, and at the bottom. */
  room: () => Room,
) {
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  // The menu's width as the camera sees it, eased when the menu comes or goes.
  let inset = room()
  const free = () => Math.max(1, app.screen.width - inset.left)
  const high = () => Math.max(1, app.screen.height - inset.bottom)
  const fit = () => Math.min(free() / size.width, high() / size.height) * 0.94
  const whole = (): Shot => ({
    x: size.width / 2,
    y: size.height / 2,
    k: fit(),
  })
  /** The shot that frames a box of the world. */
  const framing = (x0: number, y0: number, x1: number, y1: number): Shot => ({
    x: (x0 + x1) / 2,
    y: (y0 + y1) / 2,
    k: Math.max(
      fit(),
      Math.min(
        CLOSEST * fit(),
        free() / (x1 - x0 + ROOM),
        high() / (y1 - y0 + ROOM),
      ),
    ),
  })

  let shot = whole()
  let goal = shot
  let followed: Host | null = null
  let since = EVERY

  /** Where a fight is now: round the tiles it took last, or from its entry to its aim. */
  function front(host: Host): Shot {
    const tiles = host.edge.length > 0 ? host.edge : [host.entry, host.aim]
    let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity]
    for (const tile of tiles) {
      const { x, y } = siteOf(state, tile)
      x0 = Math.min(x0, x)
      y0 = Math.min(y0, y)
      x1 = Math.max(x1, x)
      y1 = Math.max(y1, y)
    }
    return framing(x0, y0, x1, y1)
  }

  /** The realm of the lord who holds the most, framed whole. */
  function leader(): Shot {
    const held = state.players.map((p) => p.tiles)
    const first = held.indexOf(Math.max(...held))
    let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity]
    state.owner.forEach((o, t) => {
      if (o !== first) return
      const { x, y } = siteOf(state, t)
      x0 = Math.min(x0, x)
      y0 = Math.min(y0, y)
      x1 = Math.max(x1, x)
      y1 = Math.max(y1, y)
    })
    return x0 === Infinity ? whole() : framing(x0, y0, x1, y1)
  }

  function choose() {
    since = 0
    followed = null
    if (still || state.tick < state.rules.openingTicks) {
      goal = whole()
      return
    }
    for (const host of state.hosts)
      if (host.men > (followed?.men ?? 0)) followed = host
    goal = followed ? front(followed) : leader()
  }

  return {
    /** One frame: choose again when it is time, follow the fight, glide. */
    step(ms: number) {
      since += ms
      const over = followed !== null && !state.hosts.includes(followed)
      if (since >= EVERY || (over && since >= DWELL)) choose()
      else if (followed && !over) goal = front(followed)
      const t = 1 - (1 - GLIDE) ** (ms / (1000 / 60))
      const to = room()
      const ease = Math.min(1, t * 4)
      inset = {
        left: inset.left + (to.left - inset.left) * ease,
        bottom: inset.bottom + (to.bottom - inset.bottom) * ease,
      }
      shot = {
        x: shot.x + (goal.x - shot.x) * t,
        y: shot.y + (goal.y - shot.y) * t,
        k: shot.k + (goal.k - shot.k) * t,
      }
      // The land breathes: a slow sway of a few units, never still.
      const seconds = performance.now() / 1000
      const sway = still ? 0 : 6
      const x = shot.x + Math.sin(seconds * 0.11) * sway
      const y = shot.y + Math.cos(seconds * 0.07) * sway
      world.scale.set(shot.k)
      world.x = inset.left + free() / 2 - x * shot.k
      world.y = high() / 2 - y * shot.k
    },
  }
}
