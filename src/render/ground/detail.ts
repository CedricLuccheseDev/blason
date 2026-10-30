// The map gains detail as one comes closer, by the pixels a tile covers on
// screen, and never loses what the game must make read first. From afar
// (under 9) the wash alone and the works' silhouettes; at mid distance
// (9 to 18) hatched hills, groves, rivers, fields round the villages, the
// works drawn, the mill turning; up close (over 18) single shaded trees,
// tufts, close furrows, the sea's ripples, roof tiles, smoke, peasants at
// work, gold glinting. Each level fades in over a range: nothing pops.

import { smoothstep } from '../ease'

/** The ranges, in pixels per tile, over which each level fades in. */
const RANGES = {
  mid: [9, 14],
  near: [18, 26],
  fields: [11, 18],
  rivers: [6, 12],
} as const

export type Fades = Record<keyof typeof RANGES, number> & {
  /** Pixels per tile on screen. */
  perTile: number
}

/** How much of each level shows at so many pixels per tile. */
export function fades(perTile: number): Fades {
  const at = (k: keyof typeof RANGES) =>
    smoothstep(RANGES[k][0], RANGES[k][1], perTile)
  return {
    perTile,
    mid: at('mid'),
    near: at('near'),
    fields: at('fields'),
    rivers: at('rivers'),
  }
}

const motion =
  typeof window === 'undefined'
    ? null
    : window.matchMedia('(prefers-reduced-motion: reduce)')
/** Whether the player asked for the map to keep still. */
export const still = () => motion?.matches ?? false

/** The pixels a tile covers over which the map turns from the strategist's to the drawn one. */
const STRATEGIC = [5, 9] as const

/**
 * How much the map is the strategist's, 1 from afar to 0 up close (« la vue
 * dézoomée … il faut quelle soit une map stratégique … uniquement des icons
 * flat bien visible, les etendard sans l'armée, les chemins des marchands +
 * visibles … faire une transition douce entre les 2 »): the works as flat
 * icons (layers/plan.ts), the armies as their standards alone, the roads
 * bold; the drawn map fading in as these fade out.
 */
export const strategicOf = (perTile: number) =>
  1 - smoothstep(STRATEGIC[0], STRATEGIC[1], perTile)
