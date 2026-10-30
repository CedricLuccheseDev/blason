import type { Army, Coup, MapSize, Rules, Work } from './rules'
import type { Level } from './bots/levels'
import type { Atlas } from './map/atlas'

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
  /** The sea's tiles and the lakes', which the boats sail; not the high mountains, which are no land either. */
  water: Array<boolean>
  /** The woods' tiles, which slow the armies; none on a test's land. */
  wood?: Array<boolean>
  /** Tiles of land in all. */
  area: number
}

type Lord = {
  /** His peasants, who hold his land, and his gold, in thousandths. */
  peasants: number
  gold: number
  /** In the game: from the first tick for a seat a bot or a person plays, from the turn a person takes it for an empty one; no more once his land is lost. */
  alive: boolean
  /** Tick until which he bears the traitor's mark. */
  felonUntil: number
  /** The tiles he holds. */
  tiles: number
  /** How many of each coup he has launched: its price doubles with each. */
  coups: Partial<Record<Coup, number>>
  /** The tile his standard stands on: moved at will during the opening, the heart of his start once it ends, his first village on it; -1 while he has planted none. */
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

/** A seat, a lord of the game: his team, the bot that plays him, whether a person holds him from the first turn. */
export type Seat = {
  /** His team from 0, or -1: he plays for himself. */
  team: number
  /** The bot of that level that plays him; none for a person's seat, empty until a person takes it and idle once he left. */
  bot: Level | null
  /** Held by a person from the first turn, as a private game's players are; a public game's persons take empty seats during the opening. */
  person: boolean
}

/** The land a game is played on: drawn from the seed at a size, or a map of the real Earth at its own (map/atlas.ts, « chaque carte a sa propre taille »). */
export type Land =
  { kind: 'drawn'; size: MapSize } | { kind: 'real'; map: Atlas }

/** What a game is made of (setup.ts): the host's book fills it, the relay passes it on, every machine makes the same game from it. */
export type GameSetup = {
  /** The format's version: a setup of another is refused, never half read. */
  v: 1
  seed: string
  /** The land it is played on (Land). */
  land: Land
  /** How it is won: the conquest of the land, for now (step.ts). */
  mode: 'conquest'
  /** The opening, in ticks. */
  opening: number
  /** A seat a lord. */
  seats: ReadonlyArray<Seat>
}

/** Something a lord built on a tile of his: it passes to whoever takes the tile. */
/** A work on its tile; while it is being built, the tick it is done (none once it stands). */
type Building = { work: Work; tile: number; owner: number; ready?: number }

/**
 * An army raised against a lord or the free land: it enters by the border
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
  /** On its way to a lord its land does not touch: it takes the free land between first (course.ts). */
  through?: boolean
  /** Whether an enemy army is upon it this tick: it stands, and goes to meet it. */
  fighting: boolean
  /** Ticks before the blows begin, the two armies walking to meet each other; -1 with no enemy upon it. */
  closing: number
  /** The tiles each side of its line it takes, as wide as its men. */
  wide: number
  /** What the woods it took still owe, in hundredths of its stride: it waits them out before it takes more. */
  slow?: number
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

/** An offering given, remembered a while (rules' offeringMemory): by whom, to whom, how much gold (in thousandths), at which tick. */
type Offering = { from: number; to: number; gold: number; tick: number }

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
  /** The villages it passed by and paid as relays, their tiles. */
  stops?: Array<number>
}

/** A merchant ship from one lord's port to another's, by its way over the water (ships.ts). */
export type Ship = {
  owner: number
  /** Its port, and the port it sails to: their tiles. */
  from: number
  to: number
  /** The water's tiles of its way, and how far along it is, in thousandths of a tile. */
  way: Array<number>
  along: number
  gold: number
}

/** A warship of a lord's, patrolling round a tile of the water (warships.ts). */
export type Warship = {
  /** Its number, the order that sends it names it by. */
  id: number
  owner: number
  /** The tile of water it patrols round. */
  post: number
  /** The water's tiles of its way, from where it set out, and how far along it is, in thousandths of a tile. */
  way: Array<number>
  along: number
  /** The shots it may still take before it sinks. */
  hull: number
  /** The tick it may shoot again. */
  reload: number
}

export type GameState = {
  /** What the game was made of, never changed: its seed, its opening (in the rules) and its teams are laid below, where the rules read them. */
  setup: GameSetup
  seed: string
  rules: Rules
  grid: Grid
  tick: number
  /** Each tile's lord, or free, or the sea. */
  owner: Array<number>
  works: Array<Building>
  players: Array<Lord>
  hosts: Array<Host>
  alliances: Array<Alliance>
  requests: Array<Request>
  offerings: Array<Offering>
  caravans: Array<Caravan>
  ships: Array<Ship>
  warships: Array<Warship>
  /** The warships fitted out in the game: the last one's number. */
  warshipsBuilt: number
  strikes: Array<Strike>
  scars: Array<Scar>
  /** Each seat's team, as the setup gives it, a number from 0, or -1 for a lord who plays for himself: teammates are allies for good and win together. */
  teams: Array<number>
  winner: number
}

export type Order = { player: number } & (
  | { type: 'pickStart'; tile: number }
  | { type: 'attack'; tile: number; army: Army }
  | { type: 'build'; tile: number; work: Work }
  | { type: 'ally'; target: number }
  | { type: 'breakAlliance'; target: number }
  | { type: 'offering'; target: number }
  /** An army called home, by the village or market it left from: its survivors back to the peasants. */
  | { type: 'recall'; tile: number }
  | { type: 'coup'; tile: number; coup: Coup }
  /** A warship fitted out at the lord's port nearest a tile of water, and sent there. */
  | { type: 'warship'; tile: number }
  /** One of his warships, by its number, sent to a tile of water. */
  | { type: 'sail'; tile: number; ship: number }
)
