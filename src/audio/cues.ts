// The sounds that tell the player what he does not look at, and give weight
// to what he does (Concept, « Les sons qui informent »): each made of one or
// two files in public/sounds/ played together, how loud, and how soon it may
// sound again. Each is a hit, a second or so, the end of the game hardly more
// (« c'est surtout des hit que l'on veut pour que ça reste digeste »). A sound
// more is an entry here and its file, nothing else.

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
  /** My army leaves: a war horn. */
  muster: { layers: [{ file: 'horn' }], gain: 0.7, again: 1 },
  /** An army or a coup comes for me: the tocsin, an alarm bell rung fast. */
  alarm: { layers: [{ file: 'tocsin' }], gain: 0.8, again: 4 },
  /** A herald's letter, an alliance offered or an offering given: parchment unfolded, a hand bell. */
  herald: {
    layers: [{ file: 'parchment' }, { file: 'handbell', delay: 0.3 }],
    gain: 0.7,
    again: 2,
  },
  /** An alliance of mine made: a seal pressed in wax, a lute chord. */
  pact: {
    layers: [{ file: 'wax' }, { file: 'lute', delay: 0.2 }],
    gain: 0.7,
    again: 2,
  },
  /** An alliance of mine come to its end unbroken: a low oud phrase. */
  parting: { layers: [{ file: 'oud' }], gain: 0.6, again: 2 },
  /** A betrayal, cried to all: a sword drawn, a dark timpani stroke. */
  betrayal: {
    layers: [{ file: 'sword' }, { file: 'timpani', delay: 0.12 }],
    gain: 0.9,
    again: 2,
    cry: true,
  },
  /** A work of mine laid: two hammer blows on wood. */
  build: { layers: [{ file: 'mallet' }], gain: 0.6, again: 0.5 },
  /** A caravan come to my market: a pile of coins. */
  gold: { layers: [{ file: 'coins' }], gain: 0.5, again: 3 },
  /** A medieval fanfare. */
  victory: { layers: [{ file: 'fanfare' }], gain: 0.9, again: 0, last: true },
  /** The knell, a tolling bell. */
  defeat: { layers: [{ file: 'knell' }], gain: 0.9, again: 0, last: true },
}
