import { Container, Graphics, Sprite } from 'pixi.js'
import { jitter } from '../art/melee'
import { TONE } from '../palette'
import { hash } from '../pen'
import { quality } from '../quality'
import { SIZE, frameAt, makeFigure, pixel, shadowOf, sheetOf } from '../figures'
import { GAP } from '../fronts'
import { middle } from '../squads'
import type { Box } from '../camera'
import type { Front, Spot } from '../fronts'
import type { Host } from '../../../engine'
import type { Look } from '../figures'
import type { Man, Squad } from '../squads'

// The men of every fight as the player watches them, little painted
// miniatures standing on their shadows: riders, men-at-arms, the levy and
// the peasants with their forks, each drawn where he stands (squads.ts),
// walking on the march and fighting on his own beat once he faces the
// enemy, his size and his looks his own; along each fight's line, dust
// drifting and sparks where iron meets iron. Drawn at the land's scale: they
// grow and shrink with the zoom.

const DUST = 0xb59a72
/**
 * Map units a stride, a step of each foot: a little longer than the legs
 * cover, so that the march's quick pace does not set them racing; the
 * horse's trot longer still.
 */
const STRIDE: Record<Look, number> = {
  raid: 8,
  host: 6,
  ban: 5.5,
  peasant: 5.5,
}
/** How much a man's size may differ from his fellows': the levy most. */
const SIZES: Record<Look, number> = {
  raid: 0.05,
  host: 0.05,
  ban: 0.14,
  peasant: 0.1,
}
/** The shadow pushed away from the light, to the lower right, in the drawings' units. */
const CAST = 0.5
/** Map units round the screen a man may stand in and still be laid: he is some four tall. */
const MARGIN = 8

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

/** Who a man is among his look's men, how tall, how dark his base: his own, kept from frame to frame. */
export function traits(look: Look, seed: number, men: number) {
  const grey = Math.round(255 * (0.9 + 0.1 * hash(seed, 7, 2)))
  return {
    man: Math.floor(hash(seed, 1, 0) * men),
    size: 1 + (hash(seed, 3, 1) - 0.5) * 2 * SIZES[look],
    tint: (grey << 16) | (grey << 8) | grey,
  }
}

type Body = { figure: ReturnType<typeof makeFigure>; shadow: Sprite }

/** How much of a man shows under the woods' canopy (« Les unités marchent sur les arbres c'est bizarre »): glimpsed through it, his standard over the trees. */
const UNDER_WOODS = 0.35

export function makeTroops(
  /** Whether a point of the map lies under the woods. */
  underWoods: (x: number, y: number) => boolean = () => false,
) {
  const container = new Container()
  const dust = container.addChild(new Graphics())
  const shadows = container.addChild(new Container())
  const bodies = container.addChild(new Container())
  const sparks = container.addChild(new Graphics())
  bodies.sortableChildren = true
  const pool: Array<Body> = []
  let used = 0

  function next(): Body {
    let found = pool[used] as Body | undefined
    if (!found) {
      const shadow = shadows.addChild(new Sprite(shadowOf()))
      shadow.anchor.set(0.5)
      shadow.blendMode = 'multiply'
      const figure = makeFigure()
      bodies.addChild(figure.box)
      found = { figure, shadow }
      pool.push(found)
    }
    used++
    found.figure.box.visible = true
    found.shadow.visible = true
    return found
  }

  function one(squad: Squad, man: Man, fighting: boolean, seconds: number) {
    const figures = sheetOf(squad.look)
    const t = traits(squad.look, man.seed, figures.men)
    const { figure, shadow } = next()
    const frame = frameAt(seconds, man, fighting, STRIDE[squad.look])
    figure.show(figures, t.man, man.facing, frame, squad.color)
    figure.tone(t.tint)
    figure.box.scale.set(pixel(t.size))
    figure.box.position.set(man.x, man.y)
    const veiled = underWoods(man.x, man.y) ? UNDER_WOODS : 1
    figure.box.alpha = man.alpha * squad.alpha * veiled
    figure.box.zIndex = man.y
    const s = figures.shadow
    const unit = SIZE * t.size
    shadow.position.set(
      man.x + (s.x * man.facing + CAST) * unit,
      man.y + CAST * 0.3 * unit,
    )
    shadow.width = s.rx * 2 * unit
    shadow.height = s.ry * 2 * unit
    shadow.alpha = man.alpha * squad.alpha * (veiled < 1 ? 0 : 1)
  }

  /** A side's men on screen: those off it are not laid at all. */
  function side({ squad, fighting }: Drawn, seconds: number, view: Box) {
    for (const man of squad.men)
      if (
        man.x > view.left - MARGIN &&
        man.x < view.right + MARGIN &&
        man.y > view.top - MARGIN &&
        man.y < view.bottom + MARGIN
      )
        one(squad, man, fighting, seconds)
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
    draw(sides: Array<Drawn>, lines: Array<Line>, seconds: number, view: Box) {
      used = 0
      // When the frames run long, the men stand without their shadows (quality.ts).
      shadows.visible = quality().footing
      dust.clear()
      sparks.clear()
      for (const line of lines) air(line, seconds)
      for (const drawn of sides) side(drawn, seconds, view)
      for (let i = used; i < pool.length; i++) {
        pool[i].figure.box.visible = false
        pool[i].shadow.visible = false
      }
    },
  }
}

/** The lines where men fight: each front, each battle once, the dust rising before the men where they stand, who never jump. */
export function linesOf(
  armies: Map<Host, { troops: Squad; front: Front | null; gone: boolean }>,
): Array<Line> {
  const drawn: Array<Line> = []
  const told = new Set<Host>()
  for (const [host, army] of armies) {
    const { front } = army
    if (!front?.line || army.gone || told.has(host)) continue
    if (front.foe) told.add(front.foe)
    const men = middle(army.troops.men)
    if (!men) continue
    drawn.push({
      at: { x: men.x + front.facing.x * GAP, y: men.y + front.facing.y * GAP },
      across: { x: -front.facing.y, y: front.facing.x },
      width: Math.ceil(army.troops.men.length / 2) * 3.6,
      alpha: army.troops.alpha,
      seed: host.from,
    })
  }
  return drawn
}
