import type { Army, Coup, Rules, Work } from './rules'

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
  /** How many of each coup he has launched: its price doubles with each. */
  coups: Partial<Record<Coup, number>>
  /** The free domain his standard stands on, by its village's tile: moved at will during the opening, his start once it ends; -1 while he has planted none. */
  standard: number
}

/** A coup on its way: whose, which, the lord it strikes, where it left from and where it falls, and when it falls (a troublemaker walks, and falls when he gets there). */
export type Strike = {
  coup: Coup
  owner: number
  victim: number
  from: number
  target: number
  lands: number
}

/** What a coup leaves on the land, round a tile: rebels holding it, or ashes no one may build on until a tick. */
export type Scar = {
  kind: 'rebels' | 'ash'
  tile: number
  radius: number
  until: number
}

/** Something a lord built on a tile of his: it passes to whoever takes the tile. */
/** A work on its tile; while it is being built, the tick it is done (none once it stands). */
type Building = { work: Work; tile: number; owner: number; ready?: number }

/**
 * An army raised against a lord or a free domain: it enters by the border
 * tile nearest where its lord clicked, and spreads from there as a bulge
 * towards it, a few tiles a tick.
 */
export type Host = {
  owner: number
  /** Which army it is: its share of the peasants, and its pace. */
  army: Army
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
  /** The village or market it was raised at, its road from there to the front over its lord's land, and how far along it is, in thousandths of a tile. */
  from: number
  road: Array<number>
  along: number
  /** Whether an enemy army is upon it this tick: it stands, and goes to meet it. */
  fighting: boolean
  /** Ticks before the blows begin, the two armies walking to meet each other; -1 with no enemy upon it. */
  closing: number
  /** The tiles each side of its line it takes, as wide as its men. */
  wide: number
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
  /** The lords whose markets it goes through, his own aside: their land it may cross. */
  via: Array<number>
  /** The tiles of its road, from its market to the other, and how far along it is, in thousandths of a tile. */
  road: Array<number>
  along: number
  gold: number
  /** Taken by an enemy: the place on its road it was taken, its new lord's road from there. */
  taken?: number
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
  strikes: Array<Strike>
  scars: Array<Scar>
  winner: number
}

export type Order = { player: number } & (
  | { type: 'pickStart'; tile: number }
  | { type: 'attack'; tile: number; army: Army }
  | { type: 'build'; tile: number; work: Work }
  | { type: 'ally'; target: number }
  | { type: 'breakAlliance'; target: number }
  | { type: 'coup'; tile: number; coup: Coup }
)
