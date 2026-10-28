import type { Army, Rules, Work } from './rules'

export const NEUTRAL = -1
export const SEA = -2
export const NO_ONE = -1

/** The land as a grid of tiles, row by row: which are land, the same on every machine. */
export type Grid = {
  width: number
  height: number
  /** A tile's side, in map units. */
  size: number
  land: Array<boolean>
  /** Tiles of land in all. */
  area: number
}

type Lord = {
  /** His peasants, who hold his land, and his gold, in thousandths. */
  peasants: number
  gold: number
  alive: boolean
  /** Tick until which he bears the traitor's mark. */
  felonUntil: number
  /** The tiles he holds. */
  tiles: number
}

/** Something a lord built on a tile of his: it passes to whoever takes the tile. */
type Building = { work: Work; tile: number; owner: number }

/**
 * An army raised against a lord or a free domain: it enters by the border
 * tile nearest where its lord clicked, and spreads from there as a bulge
 * towards it, a few tiles a tick.
 */
export type Host = {
  owner: number
  target: number
  men: number
  /** The tile clicked, and the tile it entered by. */
  aim: number
  entry: number
  departs: number
  /** The tiles it will strike next, a heap of [distance to the click, tile]. */
  queue: Array<[number, number]>
  /** The tiles it took last, where it fights. */
  edge: Array<number>
  /** The barracks it was sent from, its road from there to the front over its lord's land, and how far along it is, in thousandths of a tile. */
  from: number
  road: Array<number>
  along: number
  /** Whether it is fighting another army this tick, and stands still. */
  fighting: boolean
}

/** Two lords who may not strike each other, until it runs out. */
export type Alliance = {
  a: number
  b: number
  expires: number
  renewA: boolean
  renewB: boolean
}

type Request = { from: number; to: number; expires: number }

/** A caravan from one lord's market to another's, by a road through its lord's land, his allies' and free land. */
export type Caravan = {
  owner: number
  /** The lord whose market it goes to: his land it may cross at the end of its road. */
  to: number
  /** The tiles of its road, from its market to the other, and how far along it is, in thousandths of a tile. */
  road: Array<number>
  along: number
  gold: number
}

export type GameState = {
  seed: string
  rules: Rules
  grid: Grid
  tick: number
  /** Each tile's lord, or free, or the sea. */
  owner: Array<number>
  /** The free domain each tile was drawn into at the start, named by its village's tile; -1 at sea. The whole land is shared out: no empty land, and free land fought for a domain at a time. */
  realm: Array<number>
  /** The free villages to start at, by their tile, during the opening; none after it. */
  villages: Array<number>
  works: Array<Building>
  players: Array<Lord>
  hosts: Array<Host>
  alliances: Array<Alliance>
  requests: Array<Request>
  caravans: Array<Caravan>
  winner: number
}

export type Order = { player: number } & (
  | { type: 'pickStart'; tile: number }
  | { type: 'attack'; tile: number; army: Army }
  | { type: 'build'; tile: number; work: Work }
  | { type: 'ally'; target: number }
  | { type: 'breakAlliance'; target: number }
)
