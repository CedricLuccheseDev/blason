import { UNIT } from './units'
import { isqrt } from './numbers'
import { apart, overLand } from './grid'
import { isAllied } from './diplomacy'
import { setOwner } from './land'
import { positionOf } from './muster'
import { heal } from './scars'
import { NEUTRAL } from './types'
import type { Coup } from './rules'
import type { GameState, Strike } from './types'

// The coups that may turn a game, each its own deed (docs/RULES.md): the
// troublemaker takes land, walking from his lord's border to any land of
// another lord, where the land round him rises and turns free, held by
// rebels, unless an army of that lord meets him on his way; a volley of
// arrows kills troops, falling a moment after on the enemy armies near the
// border; Greek fire ruins an economy, falling on the works round where it
// is thrown, which burn, and on the land, where no one may build until the
// ashes cool. Each is dear, dearer with each launched, and seen coming.

/** A coup's price for a lord now, in gold: doubled with each he launched, so many times at most. */
export function coupPrice(state: GameState, lord: number, coup: Coup): number {
  const launched = state.players[lord].coups[coup] ?? 0
  const doublings = Math.min(launched, state.rules.coupDoublings)
  return state.rules.coups[coup].price * (1 << doublings)
}

/** The tiles round a tile within a radius, on the map. */
function disc(state: GameState, tile: number, radius: number) {
  const { width, height } = state.grid
  const [cx, cy] = [tile % width, Math.floor(tile / width)]
  const found: Array<number> = []
  for (let y = Math.max(0, cy - radius); y <= cy + radius && y < height; y++)
    for (let x = Math.max(0, cx - radius); x <= cx + radius && x < width; x++)
      if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= radius * radius)
        found.push(y * width + x)
  return found
}

/** The lord's tile nearest a tile, or -1 if he holds none. */
function nearestOf(state: GameState, lord: number, tile: number): number {
  let best = -1
  let far = Infinity
  state.owner.forEach((o, t) => {
    if (o !== lord) return
    const d = apart(state.grid, t, tile)
    if (d < far) {
      far = d
      best = t
    }
  })
  return best
}

/** Whom a coup at a tile strikes: the tile's lord, an enemy; for arrows, also the enemies on my land or the free land. */
function victimOf(state: GameState, lord: number, tile: number, coup: Coup) {
  const owner = state.owner[tile]
  const enemy = owner >= 0 && owner !== lord && !isAllied(state, lord, owner)
  if (enemy) return owner
  return coup === 'archers' && owner >= NEUTRAL ? NEUTRAL : null
}

/** Where a coup would leave from, if a lord may launch it at a tile now; -1 if he may not. */
export function launchSite(
  state: GameState,
  lord: number,
  tile: number,
  coup: Coup,
): number {
  if (state.tick < state.rules.openingTicks) return -1
  if (victimOf(state, lord, tile, coup) === null) return -1
  const from = nearestOf(state, lord, tile)
  if (from < 0) return -1
  const { reach } = state.rules.coups[coup]
  if (reach === null) return overLand(state.grid, from, tile) ? from : -1
  return apart(state.grid, from, tile) <= reach * reach ? from : -1
}

/** A coup launched at a tile, if the lord may and can pay for it. */
export function launch(
  state: GameState,
  lord: number,
  tile: number,
  coup: Coup,
): void {
  const from = launchSite(state, lord, tile, coup)
  if (from < 0) return
  const player = state.players[lord]
  const price = coupPrice(state, lord, coup) * UNIT
  if (player.gold < price) return
  player.gold -= price
  player.coups[coup] = (player.coups[coup] ?? 0) + 1
  const victim = victimOf(state, lord, tile, coup) ?? NEUTRAL
  const sent: Strike = {
    coup,
    owner: lord,
    victim,
    from,
    target: tile,
    lands: 0,
  }
  sent.lands = state.tick + journeyOf(state, sent)
  state.strikes.push(sent)
}

/** How long a coup takes from where it left to where it falls: its flight, or a troublemaker's walk at the armies' pace. */
export function journeyOf(state: GameState, strike: Strike): number {
  const { flight } = state.rules.coups[strike.coup]
  if (flight !== null) return flight
  const thousandths = isqrt(
    apart(state.grid, strike.from, strike.target) * 1_000_000,
  )
  return Math.max(1, Math.ceil(thousandths / state.rules.marchPace))
}

/** Where a coup is now: a tile on the straight line from where it left to where it falls. */
export function strikeAt(state: GameState, strike: Strike): number {
  const { width } = state.grid
  const total = journeyOf(state, strike)
  const done = Math.max(0, total - (strike.lands - state.tick))
  const [ax, ay] = [strike.from % width, Math.floor(strike.from / width)]
  const [bx, by] = [strike.target % width, Math.floor(strike.target / width)]
  const x = ax + Math.trunc(((bx - ax) * done) / total)
  const y = ay + Math.trunc(((by - ay) * done) / total)
  return y * width + x
}

/** Whether an army of the lord he walks on meets the troublemaker, and ends him. */
function caught(state: GameState, strike: Strike): boolean {
  if (strike.coup !== 'troublemaker') return false
  const at = strikeAt(state, strike)
  const reach = state.rules.meetTiles
  return state.hosts.some(
    (h) =>
      h.owner === strike.victim &&
      apart(state.grid, positionOf(h), at) <= reach * reach,
  )
}

/** A coup falls where it was sent. */
function fall(state: GameState, strike: Strike) {
  const { coup, owner, target } = strike
  const { radius } = state.rules.coups[coup]
  const hostile = (lord: number) =>
    lord !== owner && !isAllied(state, owner, lord)
  if (coup === 'archers') {
    for (const h of state.hosts)
      if (
        hostile(h.owner) &&
        apart(state.grid, positionOf(h), target) <= radius * radius
      )
        h.men -= Math.floor((h.men * state.rules.arrowToll) / 100)
    return
  }
  const round = new Set(disc(state, target, radius))
  if (coup === 'fire') {
    state.works = state.works.filter(
      (w) => !round.has(w.tile) || !hostile(w.owner),
    )
    const until = state.tick + state.rules.ashTicks
    state.scars.push({ kind: 'ash', tile: target, radius, until })
    return
  }
  // The troublemaker: the land round him rises, free and held by rebels.
  for (const t of round)
    if (state.owner[t] === strike.victim) setOwner(state, t, NEUTRAL)
  state.works = state.works.filter(
    (w) => !round.has(w.tile) || state.owner[w.tile] >= 0,
  )
  state.scars.push({ kind: 'rebels', tile: target, radius, until: -1 })
}

/** The coups a tick further: a troublemaker met is ended, those come where they go fall; the scars heal. */
export function strikeCoups(state: GameState): void {
  state.strikes = state.strikes.filter((s) => {
    if (!state.players[s.owner].alive || caught(state, s)) return false
    if (s.lands > state.tick) return true
    fall(state, s)
    return false
  })
  if (state.tick % 10 === 0) heal(state)
}
