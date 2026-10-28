// The bots' levels, chosen before a game: never by cheating, only by how
// fast a bot thinks, how soon it notices an army biting its land, how long
// it rests between two attacks, how full it waits for its peasants to be,
// how readily it builds, and how often it slips (a war on the wrong
// neighbour, an attack sent short of men, an army upon it let be).

export type Level = 'easy' | 'normal' | 'hard'

export const LEVELS: ReadonlyArray<Level> = ['easy', 'normal', 'hard']

export type Skill = {
  /** Ticks between two of its thoughts, and before it notices an army striking it. */
  every: number
  notice: number
  /** Its rest between two attacks, in percent of a normal bot's. */
  rest: number
  /** Points added to how full its peasants must be before it strikes, and to how readily it builds, out of 100. */
  patience: number
  thrift: number
  /** Out of 100, how often a choice of war or of answer goes wrong. */
  slips: number
}

export const SKILLS: Readonly<Record<Level, Skill>> = {
  easy: {
    every: 30,
    notice: 50,
    rest: 200,
    patience: 15,
    thrift: -10,
    slips: 25,
  },
  normal: {
    every: 10,
    notice: 15,
    rest: 100,
    patience: 0,
    thrift: 0,
    slips: 0,
  },
  hard: {
    every: 10,
    notice: 5,
    rest: 50,
    patience: -15,
    thrift: 20,
    slips: 0,
  },
}
