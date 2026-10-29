import { disband } from './armies'
import type { Alliance, GameState } from './types'

// The alliances, as in OpenFront (docs/RULES.md): one order for all,
// to offer, to accept an offer received, or to renew in the last moments
// once both ask. Allies may not strike each other: their fights stop and
// the men go home. An alliance runs out after a few minutes, which makes no
// traitor; broken, it marks its breaker a traitor a while, his land holding
// half as well, seen by all. An offering gives another lord a share of one's
// gold, remembered a while (the bots leave the giver in peace for it).

export function isAllied(state: GameState, a: number, b: number): boolean {
  return (
    a !== b &&
    state.alliances.some(
      (x) => (x.a === a && x.b === b) || (x.a === b && x.b === a),
    )
  )
}

/** One's own, or an ally's. */
export function isFriendly(state: GameState, a: number, b: number): boolean {
  return a === b || (a >= 0 && b >= 0 && isAllied(state, a, b))
}

export function isFelon(state: GameState, lord: number): boolean {
  return state.players[lord].felonUntil > state.tick
}

function allianceOf(state: GameState, a: number, b: number) {
  return state.alliances.find(
    (x) => (x.a === a && x.b === b) || (x.a === b && x.b === a),
  )
}

/** Whether an alliance is in its last moments, when both may renew it. */
export function canRenew(state: GameState, alliance: Alliance): boolean {
  return alliance.expires - state.tick <= state.rules.renewTicks
}

function renew(state: GameState, alliance: Alliance, player: number) {
  if (!canRenew(state, alliance)) return
  if (alliance.a === player) alliance.renewA = true
  else alliance.renewB = true
  if (!alliance.renewA || !alliance.renewB) return
  alliance.expires = state.tick + state.rules.allianceTicks
  alliance.renewA = false
  alliance.renewB = false
}

/** Allies never strike each other: their armies against each other go home. */
function seal(state: GameState, a: number, b: number) {
  state.requests = state.requests.filter(
    (r) => !((r.from === a && r.to === b) || (r.from === b && r.to === a)),
  )
  state.alliances.push({
    a: Math.min(a, b),
    b: Math.max(a, b),
    expires: state.tick + state.rules.allianceTicks,
    renewA: false,
    renewB: false,
  })
  for (const host of state.hosts) {
    if (!isAllied(state, host.owner, host.target)) continue
    disband(state, host)
  }
}

/** One order for everything: offer, accept an offer received, or renew. */
export function ally(state: GameState, player: number, target: number) {
  if (target === player || !state.players[target].alive) return
  const existing = allianceOf(state, player, target)
  if (existing) {
    renew(state, existing, player)
    return
  }
  if (state.requests.some((r) => r.from === target && r.to === player)) {
    seal(state, player, target)
    return
  }
  if (state.requests.some((r) => r.from === player && r.to === target)) return
  state.requests.push({
    from: player,
    to: target,
    expires: state.tick + state.rules.requestTicks,
  })
}

/** Breaking is at once and seen by all: the traitor is marked a while. */
export function breakAlliance(
  state: GameState,
  player: number,
  target: number,
) {
  const alliance = allianceOf(state, player, target)
  if (!alliance) return
  state.alliances = state.alliances.filter((x) => x !== alliance)
  state.players[player].felonUntil = state.tick + state.rules.felonTicks
}

/** Offers and alliances run out; an alliance left to run out makes no traitor. */
export function expireDiplomacy(state: GameState) {
  state.requests = state.requests.filter((r) => r.expires > state.tick)
  state.alliances = state.alliances.filter((x) => x.expires > state.tick)
  const memory = state.rules.offeringMemory
  state.offerings = state.offerings.filter((o) => state.tick - o.tick < memory)
}

/** An offering: a share of the lord's gold to another lord standing, remembered a while. */
export function offer(state: GameState, player: number, target: number) {
  if (target === player || !state.players[target].alive) return
  const giver = state.players[player]
  const gold = Math.floor((giver.gold * state.rules.offeringShare) / 100)
  if (gold <= 0) return
  giver.gold -= gold
  state.players[target].gold += gold
  state.offerings.push({ from: player, to: target, tick: state.tick })
}

/** Whether a lord gave another an offering lately, still remembered. */
export const gaveLately = (state: GameState, from: number, to: number) =>
  state.offerings.some((o) => o.from === from && o.to === to)
