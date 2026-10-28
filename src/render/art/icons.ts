import { GraphicsPath } from 'pixi.js'
import { TONE } from '../palette'
import { GLYPHS } from './glyphs'
import type { Icon, Part } from './glyphs'
import type { Graphics } from 'pixi.js'

// The icons set in a white badge beside a lord's name (places.ts): an ally's
// links, a traitor's broken shield. The colour never carries the meaning,
// the shape does.

/** An icon in its white badge, centred on (0, 0), 24 units across. */
export function drawIcon(g: Graphics, icon: Icon): void {
  g.circle(0, 0, 17.3).fill(TONE.white).stroke({ width: 1.9, color: TONE.ink })
  g.translateTransform(-12, -12)
  const line = {
    width: 1.6,
    color: TONE.ink,
    join: 'round',
    cap: 'round',
  } as const
  const parts: Array<Part> = GLYPHS[icon]
  for (const part of parts) {
    g.path(new GraphicsPath(part.d))
    if (!part.open) g.fill(TONE.parchment)
    g.stroke(line)
  }
}
