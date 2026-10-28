import { Container, Graphics, Sprite } from 'pixi.js'
import { jitter } from '../art/melee'
import { TONE } from '../palette'
import type { Spot } from '../fronts'
import type { Squad } from '../squads'
import type { Stamps } from '../textures'

// The men of every fight as the player watches them: soldiers in their
// lords' colours, peasants with their pitchforks, each drawn where he stands
// (squads.ts), stepping as he runs, lunging on his own beat once he faces
// the enemy; along each fight's line, dust drifting and sparks where iron
// meets iron. Drawn at the land's scale: they grow and shrink with the zoom.

/** World units for each size: a man stands about a tile tall. */
const SCALE = 0.2
/** A man's height, and as drawn in his stamp. */
const TALL = 22
const DRAWN = 13
const DUST = 0xb59a72

/** A side drawn: its men, and whether they fight or walk. */
export type Drawn = { squad: Squad; fighting: boolean }
/** A fight's line: where, across which way, how wide, how faded in. */
export type Line = {
  at: Spot
  across: Spot
  width: number
  alpha: number
  seed: number
}

export function makeTroops(stamps: Stamps) {
  const container = new Container()
  const dust = container.addChild(new Graphics())
  const bodies = container.addChild(new Container())
  const sparks = container.addChild(new Graphics())
  bodies.sortableChildren = true
  const pool: Array<Sprite> = []
  let used = 0

  function sprite(): Sprite {
    const s = pool[used] ?? bodies.addChild(new Sprite())
    pool[used++] = s
    s.visible = true
    return s
  }

  function side({ squad, fighting }: Drawn, seconds: number) {
    const stamp = stamps[squad.kind](squad.color)
    const k = SCALE
    for (const man of squad.men) {
      const s = sprite()
      s.texture = stamp.texture
      s.anchor.set(stamp.anchor.x, stamp.anchor.y)
      const beat = seconds + man.seed * 0.37
      const step = man.moving ? Math.abs(Math.sin(beat * 9)) * 1.8 * k : 0
      const lunge =
        fighting && !man.moving ? Math.max(0, Math.sin(beat * 5)) * 1.2 : 0
      s.position.set(man.x + man.facing * lunge, man.y - step)
      s.scale.set((man.facing * TALL * k) / DRAWN, (TALL * k) / DRAWN)
      s.alpha = man.alpha * squad.alpha
      s.zIndex = man.y
    }
  }

  /** The dust raised along a line, drifting, and sparks where iron meets iron. */
  function air(line: Line, seconds: number) {
    const { at, across, width, seed, alpha } = line
    for (let d = 0; d < 7; d++) {
      const drift = ((seconds * 0.35 + d / 7) % 1) * 2 - 1
      const x =
        at.x +
        across.x * drift * width * 0.6 +
        jitter(seed + d, seconds / 8) * 0.8
      const y =
        at.y + across.y * drift * width * 0.6 - (1 - Math.abs(drift)) * 1.2
      dust.circle(x, y, 1.6 + (d % 3) * 0.6)
    }
    dust.fill({ color: DUST, alpha: 0.2 * alpha })
    for (let s = 0; s < 4; s++) {
      const u = jitter(seed * 3 + s, seconds) * width * 0.5
      const x = at.x + across.x * u
      const y = at.y + across.y * u - 2
      const r = 0.5 + (s % 2) * 0.2
      sparks
        .moveTo(x - r, y)
        .lineTo(x + r, y)
        .moveTo(x, y - r)
        .lineTo(x, y + r)
    }
    sparks.stroke({ width: 0.25, color: TONE.goldLight, cap: 'round', alpha })
  }

  return {
    container,
    draw(sides: Array<Drawn>, lines: Array<Line>, seconds: number) {
      used = 0
      dust.clear()
      sparks.clear()
      for (const line of lines) air(line, seconds)
      for (const drawn of sides) side(drawn, seconds)
      for (let i = used; i < pool.length; i++) pool[i].visible = false
    },
  }
}
