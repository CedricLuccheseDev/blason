import { TONE, playerColor } from '../palette'
import { drawArrow, drawFlame } from '../art/coups'
import { endsOf } from '../flight'
import type { At } from '../flight'
import type { Graphics } from 'pixi.js'
import type { GameState, Strike } from '../../../engine'

// What a coup does as it ends, drawn a few seconds where it ended (layers/
// strikes.ts): a volley falls as a rain of arrows on the land it strikes,
// which stay planted there a moment; Greek fire bursts in flames and smoke;
// the land a troublemaker raises flares in his lord's colour; a
// troublemaker met by an army is struck out where he stood, his torch
// dying. The men a volley kills fall with their armies (layers/fallen.ts);
// what stays after, the rebels and the ashes, is layers/scars.ts.

/** A strike just ended: when, whether it fell where it was sent or was stopped, and where it was. */
export type Fallen = { strike: Strike; born: number; fell: boolean; at: At }

/** How long each ending shows, in seconds. */
const LASTS = { archers: 2.6, fire: 2.2, troublemaker: 1.6, stopped: 2.5 }
const RAIN = 24
const FLAMES = 12

/** A number from 0 to 1, the same for the same strike and index. */
function scatter(seed: number, i: number) {
  const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453
  return x - Math.floor(x)
}

/** A point within a radius round a centre, the same for the same strike and index. */
function spot(c: At, radius: number, seed: number, i: number): At {
  const r = radius * Math.sqrt(scatter(seed, i))
  const a = scatter(seed, i + 101) * Math.PI * 2
  return { x: c.x + Math.cos(a) * r, y: c.y + Math.sin(a) * r }
}

function rain(
  g: Graphics,
  c: At,
  radius: number,
  s: Strike,
  age: number,
  zoom: number,
) {
  const long = Math.max(2.5, 12 / zoom)
  const fade = Math.min(1, (LASTS.archers - age) / 1)
  const angle = Math.PI / 2 - 0.35
  for (let i = 0; i < RAIN; i++) {
    const k = (age - (i / RAIN) * 0.45) / 0.25
    if (k <= 0) continue
    const p = spot(c, radius, s.target, i)
    const drop = long * 4 * Math.max(0, 1 - k)
    const x = p.x - Math.cos(angle) * drop
    const y = p.y - Math.sin(angle) * drop
    // Planted, half its shaft in the earth.
    const shown = k >= 1 ? long * 0.6 : long
    drawArrow(g, x, y, angle, shown, fade)
  }
  g.circle(c.x, c.y, radius).stroke({
    width: 1.4 / zoom,
    color: TONE.ink,
    alpha: 0.35 * fade,
  })
}

function blaze(
  g: Graphics,
  c: At,
  radius: number,
  s: Strike,
  age: number,
  zoom: number,
) {
  const k = age / LASTS.fire
  g.circle(c.x, c.y, radius * Math.min(1, age / 0.35)).stroke({
    width: 3 / zoom,
    color: TONE.ember,
    alpha: Math.max(0, 1 - age / 0.7),
  })
  for (let i = 0; i < FLAMES; i++) {
    const p = spot(c, radius * 0.85, s.target, i)
    const life = Math.sin(
      Math.PI * Math.min(1, k * (1 + scatter(s.target, i + 7) * 0.5)),
    )
    if (life <= 0) continue
    const flicker = 0.5 + 0.5 * Math.sin(age * 20 + i)
    drawFlame(g, p.x, p.y, Math.max(2.5, 9 / zoom) * life, flicker)
    g.circle(
      p.x,
      p.y - radius * 0.3 * k,
      Math.max(1.5, 5 / zoom) * (0.6 + k),
    ).fill({
      color: TONE.slate,
      alpha: 0.25 * (1 - k),
    })
  }
}

function rising(
  g: Graphics,
  c: At,
  radius: number,
  s: Strike,
  age: number,
  zoom: number,
) {
  const k = age / LASTS.troublemaker
  g.circle(c.x, c.y, radius * Math.min(1, k * 2.5)).stroke({
    width: 3 / zoom,
    color: playerColor(s.owner),
    alpha: 1 - k,
  })
  drawFlame(
    g,
    c.x,
    c.y,
    Math.max(3, 12 / zoom) * (1 - k),
    0.5 + 0.5 * Math.sin(age * 18),
  )
}

function stopped(g: Graphics, at: At, age: number, zoom: number) {
  const k = age / LASTS.stopped
  const w = Math.max(3, 9 / zoom)
  g.moveTo(at.x - w, at.y - w)
    .lineTo(at.x + w, at.y + w)
    .moveTo(at.x + w, at.y - w)
    .lineTo(at.x - w, at.y + w)
    .stroke({ width: 3 / zoom, color: TONE.fight, alpha: 1 - k, cap: 'round' })
  if (k < 0.5) drawFlame(g, at.x, at.y, w * (1 - 2 * k), 0.3)
}

/** A coup's ending at its age; false once it is over. */
export function drawFallen(
  g: Graphics,
  state: GameState,
  ended: Fallen,
  seconds: number,
  zoom: number,
): boolean {
  const { strike } = ended
  const age = seconds - ended.born
  const lasts = ended.fell ? LASTS[strike.coup] : LASTS.stopped
  if (age > lasts) return false
  const { b } = endsOf(state, strike)
  const radius = state.rules.coups[strike.coup].radius * state.grid.size
  if (!ended.fell) stopped(g, ended.at, age, zoom)
  else if (strike.coup === 'archers') rain(g, b, radius, strike, age, zoom)
  else if (strike.coup === 'fire') blaze(g, b, radius, strike, age, zoom)
  else rising(g, b, radius, strike, age, zoom)
  return true
}
