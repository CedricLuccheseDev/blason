// The sounds that tell the player what he does not look at, and give weight
// to what he does (Concept, « Les sons qui informent »): each made of one or
// two files in public/sounds/ played together, how loud, and how soon it may
// sound again. A sound more is an entry here and its file, nothing else.

export type Cue =
  | 'muster'
  | 'alarm'
  | 'herald'
  | 'pact'
  | 'parting'
  | 'betrayal'
  | 'build'
  | 'gold'
  | 'victory'
  | 'defeat'

type Layer = {
  /** Its file in public/sounds/, without the extension. */
  file: string
  /** Seconds after the cue begins. */
  delay?: number
}

export type CueSpec = {
  layers: ReadonlyArray<Layer>
  /** Its loudness, 0 to 1. */
  gain: number
  /** Seconds before it may sound again; heard in between, it is dropped. */
  again: number
  /** A cry to all: the other sounds fall while it passes. */
  cry?: boolean
  /** The end of the game: everything else falls silent for good. */
  last?: boolean
}

export const CUES: Record<Cue, CueSpec> = {
  /** My army leaves: a horn, one short rising note. */
  muster: { layers: [{ file: 'horn' }], gain: 0.7, again: 1 },
  /** An army or a coup comes for me: the tocsin. */
  alarm: { layers: [{ file: 'tocsin' }], gain: 0.8, again: 4 },
  /** A herald's letter, an alliance offered or an offering given: parchment unrolled, a hand bell. */
  herald: {
    layers: [{ file: 'parchment' }, { file: 'handbell', delay: 0.35 }],
    gain: 0.7,
    again: 2,
  },
  /** An alliance of mine made: a seal pressed in wax, two lute notes rising. */
  pact: {
    layers: [{ file: 'wax' }, { file: 'lute-up', delay: 0.18 }],
    gain: 0.7,
    again: 2,
  },
  /** An alliance of mine come to its end unbroken: the same notes falling. */
  parting: { layers: [{ file: 'lute-down' }], gain: 0.6, again: 2 },
  /** A betrayal, cried to all: a string snapping, a low chord. */
  betrayal: {
    layers: [{ file: 'snap' }, { file: 'low-chord', delay: 0.12 }],
    gain: 0.9,
    again: 2,
    cry: true,
  },
  /** A work of mine laid: three blows of a mallet on wood. */
  build: { layers: [{ file: 'mallet' }], gain: 0.6, again: 0.5 },
  /** A caravan come to my market: coins into a purse. */
  gold: { layers: [{ file: 'coins' }], gain: 0.5, again: 3 },
  victory: { layers: [{ file: 'fanfare' }], gain: 0.9, again: 0, last: true },
  /** The knell, a slow bell. */
  defeat: { layers: [{ file: 'knell' }], gain: 0.9, again: 0, last: true },
}
