import { Container, Graphics, GraphicsContext, GraphicsPath } from 'pixi.js'
import { GLYPHS } from '../art/glyphs'
import { TONE, playerColor } from '../palette'
import { siteOf } from '../marks'
import { standing } from '../../../engine'
import type { GameState, Work } from '../../../engine'

// The works on the strategist's map (ground/detail.ts, strategicOf): each a
// flat icon, a parchment disc ringed in its lord's colour, its drawing in
// that colour cut round in ink, so that it stands out on any land, its own
// lord's too; the same size on screen at any zoom, the player's own larger
// and ringed in gold; every lord's, so that from afar the map reads at once.
// A work being built at half ink. Each icon's drawing made once by lord and
// work, shared by all its icons.

/** An icon's disc, in its own units, and its size on screen, in pixels. */
const DISC = 12
const PX = { mine: 24, theirs: 19 }
/** The drawing within the disc, against the glyphs' 24-unit box. */
const GLYPH = 0.62

const contexts = new Map<string, GraphicsContext>()

function iconOf(work: Work, color: number, mine: boolean): GraphicsContext {
  const key = `${work}:${color}:${mine}`
  const known = contexts.get(key)
  if (known) return known
  const c = new GraphicsContext()
  c.circle(0, 0, DISC).fill(TONE.parchment)
  c.circle(0, 0, DISC - 1.6).stroke({ width: 3.2, color })
  c.circle(0, 0, DISC).stroke({
    width: mine ? 2.4 : 1.4,
    color: mine ? TONE.goldDeep : TONE.ink,
  })
  c.setTransform(GLYPH, 0, 0, GLYPH, -12 * GLYPH, -12 * GLYPH)
  for (const part of GLYPHS[work]) {
    c.path(new GraphicsPath(part.d))
    if (!part.open) c.fill(color)
    c.stroke({ width: 2.2, color: TONE.ink, join: 'round', cap: 'round' })
  }
  contexts.set(key, c)
  return c
}

export function makePlan(me: number) {
  const container = new Container()
  // Mine over the others'.
  container.sortableChildren = true
  let key = ''
  /** Each work's icon, in the works' order (the container sorts its own). */
  let icons: Array<Graphics> = []

  return {
    container,
    /** At so many pixels per map unit, `strategic` how much the map is the strategist's. */
    draw(state: GameState, zoom: number, strategic: number) {
      container.visible = strategic > 0
      if (!container.visible) return
      container.alpha = strategic
      const now = state.works
        .map((w) => `${w.tile}:${w.owner}:${w.work}`)
        .join()
      if (now !== key) {
        key = now
        container.removeChildren().forEach((c) => c.destroy())
        icons = state.works.map((work) => {
          const icon = container.addChild(
            new Graphics(
              iconOf(work.work, playerColor(work.owner), work.owner === me),
            ),
          )
          const { x, y } = siteOf(state, work.tile)
          icon.position.set(x, y)
          icon.zIndex = work.owner === me ? 1 : 0
          return icon
        })
      }
      state.works.forEach((work, i) => {
        const icon = icons.at(i)
        if (!icon) return
        const px = work.owner === me ? PX.mine : PX.theirs
        icon.scale.set(px / (2 * DISC) / zoom)
        icon.alpha = standing(state, work) ? 1 : 0.5
      })
    },
  }
}
