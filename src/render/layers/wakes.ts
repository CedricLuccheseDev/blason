import { Graphics } from 'pixi.js'

// The wakes behind every boat (« laisse des traces derrières les bateau qui
// s'efface petit a petit »): each boat leaves a point where it passes, every
// so far; the points make two pale lines that open behind it in a V and fade
// as they age, until they are gone. The merchant ships, the warships and the
// armies' boats all leave theirs here, under them.

/** How long a wake lasts, in ms. */
const LIFE = 2600
/** How far a boat sails between two points of its wake, in map units. */
const STEP = 4
/** How far each line of the V stands from the way, fresh and at its end, in map units. */
const [OPEN, WIDE] = [1.2, 6]
/** The wake's foam, and how strong it is fresh. */
const FOAM = 0xf6efdc
const STRONG = 0.75

type Point = { x: number; y: number; nx: number; ny: number; t: number }

export function makeWakes() {
  const graphics = new Graphics()
  const trails = new Map<object, Array<Point>>()

  return {
    graphics,
    /** A boat seen where it is this frame, by what it is. */
    pass(key: object, x: number, y: number, now: number) {
      let trail = trails.get(key)
      if (!trail) {
        trail = []
        trails.set(key, trail)
      }
      const last = trail.at(-1)
      if (!last) {
        trail.push({ x, y, nx: 0, ny: 0, t: now })
        return
      }
      const [dx, dy] = [x - last.x, y - last.y]
      const far = Math.hypot(dx, dy)
      if (far < STEP) return
      // Across the way, for the V to open on either side of it.
      trail.push({ x, y, nx: -dy / far, ny: dx / far, t: now })
    },
    /** The wakes as they are now, the old points let go. */
    draw(now: number) {
      graphics.clear()
      for (const [key, trail] of trails) {
        while (trail.length > 0 && now - trail[0].t > LIFE) trail.shift()
        if (trail.length === 0) {
          trails.delete(key)
          continue
        }
        for (let i = 1; i < trail.length; i++) {
          const [a, b] = [trail[i - 1], trail[i]]
          const age = (now - a.t) / LIFE
          const alpha = STRONG * (1 - age) ** 1.5
          const open = OPEN + (WIDE - OPEN) * age
          const near = OPEN + (WIDE - OPEN) * ((now - b.t) / LIFE)
          for (const side of [-1, 1])
            graphics
              .moveTo(a.x + side * open * b.nx, a.y + side * open * b.ny)
              .lineTo(b.x + side * near * b.nx, b.y + side * near * b.ny)
              .stroke({ color: FOAM, width: 0.9, alpha, cap: 'round' })
        }
      }
    },
  }
}
