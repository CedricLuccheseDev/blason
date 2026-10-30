import { Container, Graphics } from 'pixi.js'
import { TONE, playerColor } from '../palette'
import { siteOf } from '../marks'
import { toldShown, workPx, workScale } from '../art/works'
import { standing } from '../../../engine'
import type { GameState } from '../../../engine'

// Over each village, a small seal says where the army it levies is: ready to
// march, a chevron raised; out, crossed swords in red. The player's own ready
// villages in his own colour, at every zoom, so that he sees at once where he can levy
// (« on voit mal quand nos villages sont prêts à envoyer nos troupes »); the
// other lords' in their colour, a matter of the close game, coming as one
// zooms in (art/works.ts). Hung where the village is drawn, never too small
// to see.

/** The seal's radius, and where it hangs from the village's middle as drawn at the map's scale, in map units; never smaller on screen than so many pixels. */
const R = 3.4
const [DX, DY] = [6, -11]
const SEEN = 7

/** A chevron raised, ready to march, centred on (x, y). */
function ready(g: Graphics, x: number, y: number, k: number) {
  const r = 1.7 * k
  g.moveTo(x - r, y + 0.6 * r)
    .lineTo(x, y - 0.6 * r)
    .lineTo(x + r, y + 0.6 * r)
}

/** Crossed swords, centred on (x, y). */
function swords(g: Graphics, x: number, y: number, k: number) {
  const r = 1.8 * k
  g.moveTo(x - r, y - r)
    .lineTo(x + r, y + r)
    .moveTo(x + r, y - r)
    .lineTo(x - r, y + r)
}

/** One village's seal at (x, y): out, red with its swords; ready, the chevron, in its lord's colour, mine too. */
function seal(
  on: Graphics,
  x: number,
  y: number,
  k: number,
  { owner, own, away }: { owner: number; own: boolean; away: boolean },
) {
  // Mine in my own colour, as my shield (« les blasons pour dire qu'il peut
  // envoyer doit etre de la meme couleur que le blason du joueur »).
  const fill = away ? TONE.fight : playerColor(owner)
  on.circle(x, y, R * k * (own ? 1.25 : 1))
    .fill(fill)
    .stroke({ width: 0.6 * k, color: TONE.ink })
  if (away) swords(on, x, y, k)
  else ready(on, x, y, k)
  on.stroke({
    width: 0.55 * k,
    color: TONE.parchment,
    cap: 'round',
    join: 'round',
  })
}

export function makeLevySeals(me: number) {
  const container = new Container()
  const g = container.addChild(new Graphics())
  const mine = container.addChild(new Graphics())
  let seen = { tick: -1, zoom: 0 }

  return {
    container,
    /** Drawn again with a tick or the zoom: nothing else moves them. */
    draw(state: GameState, zoom: number) {
      if (state.tick === seen.tick && zoom === seen.zoom) return
      seen = { tick: state.tick, zoom }
      g.clear()
      mine.clear()
      g.alpha = toldShown(workPx(zoom))
      const k = Math.max(1, SEEN / zoom / R)
      const hung = workScale(zoom)
      const out = new Set(state.hosts.map((h) => h.from))
      for (const work of state.works) {
        if (work.work !== 'village' || !standing(state, work)) continue
        const own = work.owner === me
        // The others' only as one zooms in; mine always.
        if (!own && g.alpha <= 0) continue
        const { x, y } = siteOf(state, work.tile)
        seal(own ? mine : g, x + DX * hung, y + DY * hung, k, {
          owner: work.owner,
          own,
          away: out.has(work.tile),
        })
      }
    },
  }
}
