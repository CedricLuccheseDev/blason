import { UNIT } from './units'
import { isqrt } from './numbers'
import { apart, eachAround } from './grid'
import { isAllied } from './diplomacy'
import { NEUTRAL } from './types'
import { freeWorks, marchOut, menFor, paceOf } from './muster'
import { landingOf, sailTo } from './crossing'
import { standing } from './land'
import { borderOf, nearestOf, reachable, roundabout } from './frontline'
import type { Army, Work } from './rules'
import type { GameState } from './types'

// An army's course: the border tile it enters by, the village (or market) it
// is raised at and its road there. Of all the border tiles, it takes the one
// that brings it soonest to the tile clicked, its march over its lord's land
// and his allies' counted, then its bulge's way across the enemy's land
// (Concept, 29/10: « des fois t'as 2 côtés qui bordent une zone ennemie et si
// tu cliques trop proche du côté opposé les troupes font un énorme détour
// pour rien »). One search walks out of all the free villages at once, a ring
// at a time, and stops when no border tile further could bring it sooner; the
// aim under the pointer asks the same (src/render/layers/aim.ts), so what is
// drawn before the click is the course the army takes.

/** The tiles each side of its line an army of so many men takes. */
export const wideOf = (state: GameState, men: number) =>
  state.rules.bandTiles + isqrt(Math.floor(men / UNIT))

/** How long an army takes to march so many tiles, in thousandths of a tick. */
const marchTime = (state: GameState, army: Army, tiles: number) =>
  Math.floor((tiles * 1_000_000) / paceOf(state, { army }))

/**
 * How long an army's bulge takes to reach a tile so far from where it
 * entered (the square of the distance, in tiles), in thousandths of a tick:
 * its tip goes only as fast as it fills the land behind it, about a square of
 * tiles as deep as the way, no wider than its band (as measured on open
 * land), at its few tiles a tick (war.ts).
 */
function crossTime(state: GameState, army: Army, wide: number, far: number) {
  const band = 2 * wide + 1
  // Tenths of a tile deep, and the tiles taken in hundredths.
  const deep = isqrt(100 * far)
  const taken = deep <= 10 * band ? 100 * far : 10 * deep * band
  const { paceTiles, armySpeed } = state.rules
  return Math.floor((taken * 1000) / (paceTiles * armySpeed[army]))
}

/** The lord's works of a kind standing, an army out or not. */
const builtWorks = (state: GameState, lord: number, work: Work) =>
  state.works
    .filter((w) => w.owner === lord && w.work === work && standing(state, w))
    .map((w) => w.tile)

/** Where and how an army would go: the border tile it enters by, the village (or market) it is raised at, and its road there; with none free to reach the front, no village (-1) and no road. */
/** Its entry, the village or market it is raised at (-1 for none free), its road there; `through`, the free land it takes on its way to a lord whose land its own does not touch. */
export type Course = {
  entry: number
  from: number
  road: Array<number>
  through: boolean
}

/**
 * The course of an army sent at the tile's lord, or the free land: it enters
 * by the border tile that brings it soonest to the tile, its march from the
 * lord's nearest free village (or market) at its pace, then its bulge's way
 * to the tile; ties to the nearest the tile, then the first. With no village
 * free, the course it would take from all of them (« il me propose encore
 * d'aller de l'autre côté », the nearest border tile once shown instead), its
 * village none (-1): no army leaves. None on one's own land, an ally's, the
 * sea, or a land beyond reach.
 */
export function courseFor(
  state: GameState,
  player: number,
  tile: number,
  army: Army,
): Course | null {
  const target = state.owner[tile]
  if (target === player || target < NEUTRAL) return null
  if (target >= 0 && isAllied(state, player, target)) return null
  let gaps = borderOf(
    state,
    player,
    target,
    tile,
    reachable(state, tile, new Set([target])),
  )
  // No border with the lord: the army takes the free land on its way to him
  // first, then strikes him (« il faut quand meme pouvoir », « Prend la
  // terre libre »).
  const through = target >= 0 && gaps.size === 0
  if (through)
    gaps = borderOf(
      state,
      player,
      NEUTRAL,
      tile,
      reachable(state, tile, new Set([target, NEUTRAL])),
    )
  const work = state.rules.raisedAt[army]
  const free = freeWorks(state, player, tile, work)
  const sites = free.length > 0 ? free : builtWorks(state, player, work)
  const nearest = nearestOf(gaps)
  if (nearest < 0) return overWater(state, player, tile, sites, free.length > 0)
  const wide = wideOf(state, menFor(state, player, army))
  // No border tile brings it to the tile sooner than the nearest one's way.
  const least = crossTime(state, army, wide, gaps.get(nearest) ?? 0)
  const best = { time: Infinity, gap: Infinity, entry: -1, end: -1 }
  let walked = -1
  let march = 0
  const consider = (t: number) => {
    const gap = gaps.get(t)
    if (gap === undefined) return
    // Seen first on its nearest ring: none further brings it sooner.
    gaps.delete(t)
    const time = march + crossTime(state, army, wide, gap)
    const sooner =
      time < best.time ||
      (time === best.time &&
        (gap < best.gap || (gap === best.gap && t < best.entry)))
    if (sooner) Object.assign(best, { time, gap, entry: t, end: walked })
  }
  const roadTo = marchOut(state, player, sites, (at, steps) => {
    walked = at
    march = marchTime(state, army, steps)
    // Walked further, no border tile could bring it sooner.
    if (march + least > best.time) return false
    eachAround(state.grid, at, consider)
    return true
  })
  // No land it may walk from its villages touches the border: beyond its
  // reach, not the nearest border tile, an ally's across the sea maybe (« y'a
  // un souci avec le traceur bleu »).
  if (best.entry < 0)
    return overWater(state, player, tile, sites, free.length > 0)
  const road = roadTo(best.end)
  const byLand = {
    entry: best.entry,
    from: free.length > 0 ? road[0] : -1,
    road,
    through,
  }
  // A long way round by the land, the sea perhaps sooner (« il faut y aller
  // a la mer dans ce cas la »): sought only when the land's road goes far
  // round, as a search over the water costs.
  // Round a river or a range, its band would stop at the water: the boat,
  // if there is one (« normalement il faut pouvoir traverser les fleuves »).
  const round = roundabout(state, best.entry, tile)
  if (
    !round &&
    road.length * road.length * 4 <= apart(state.grid, road[0], tile) * 9 + 64
  )
    return byLand
  const sea = overWater(state, player, tile, sites, free.length > 0)
  if (!sea) return byLand
  const sail =
    marchTime(state, army, sea.road.length) +
    crossTime(state, army, wide, apart(state.grid, sea.entry, tile))
  return round || sail < best.time ? sea : byLand
}

/**
 * A land no road reaches, by water (crossing.ts): the army lands on its
 * lord's shore nearest the click; with none his land reached from the click,
 * on the free land's, which it takes on its way to him. None with no water
 * to it.
 */
function overWater(
  state: GameState,
  player: number,
  tile: number,
  sites: Array<number>,
  free: boolean,
): Course | null {
  const target = state.owner[tile]
  let landing = landingOf(
    state,
    target,
    tile,
    reachable(state, tile, new Set([target])),
  )
  const through = landing < 0 && target >= 0
  if (through)
    landing = landingOf(
      state,
      NEUTRAL,
      tile,
      reachable(state, tile, new Set([target, NEUTRAL])),
    )
  if (landing < 0) return null
  const road = sailTo(state, player, sites, landing)
  if (!road) return null
  return { entry: landing, from: free ? road[0] : -1, road, through }
}

/** Where an army of the kind against the tile's lord, or the free land, enters (courseFor), or -1. */
export function entryFor(
  state: GameState,
  player: number,
  tile: number,
  army: Army = 'host',
) {
  return courseFor(state, player, tile, army)?.entry ?? -1
}
