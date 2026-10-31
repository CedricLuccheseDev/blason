import { GraphicsPath } from 'pixi.js'
import { TONE } from '../palette'
import { GLYPHS } from './glyphs'
import type { Icon, Part } from './glyphs'
import type { Graphics } from 'pixi.js'

// The icons set in a badge beside a lord's name (places.ts): an ally's
// links, a traitor's broken shield. The shape carries the meaning, the
// colour says it again, the same as in the HUD (components/hud/Emblem.tsx,
// StandingBadge): an ally's badge ringed in the alliance's green, his links
// drawn in it; a traitor's on gules.

/** Each badge's colours: its ground, its rim, and the drawing's fill and stroke. */
const LOOKS: Partial<
  Record<Icon, { ground: number; rim: number; fill: number; stroke: number }>
> = {
  links: {
    ground: TONE.white,
    rim: TONE.pact,
    fill: TONE.parchment,
    stroke: TONE.pact,
  },
  felon: {
    ground: TONE.gules,
    rim: TONE.ink,
    fill: TONE.parchment,
    stroke: TONE.ink,
  },
}

const PLAIN = {
  ground: TONE.white,
  rim: TONE.ink,
  fill: TONE.parchment,
  stroke: TONE.ink,
}

/** An icon in its badge, centred on (0, 0), 24 units across. */
/** An icon on its disc; `bare`, its drawing alone, light cut round in ink, to lie over a gauge that fills the disc (« rajoute une ptite icon d'alliance par dessus le vert »). */
export function drawIcon(g: Graphics, icon: Icon, bare = false): void {
  const look = LOOKS[icon] ?? PLAIN
  if (!bare)
    g.circle(0, 0, 17.3)
      .fill(look.ground)
      .stroke({ width: 2.6, color: look.rim })
  g.translateTransform(-12, -12)
  const line = {
    width: bare ? 2.6 : 2,
    color: bare ? TONE.ink : look.stroke,
    join: 'round',
    cap: 'round',
  } as const
  const parts: Array<Part> = GLYPHS[icon]
  for (const part of parts) {
    g.path(new GraphicsPath(part.d))
    if (!part.open) g.fill(bare ? TONE.parchment : look.fill)
    g.stroke(line)
  }
}
