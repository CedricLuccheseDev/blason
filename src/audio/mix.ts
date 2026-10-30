// The mix, as a game's is made (« Il faudra qu'on gère le mixage de
// l'ensemble pour que ça soit propre »): every file brought to one loudness,
// so that this table alone sets how loud each family plays against the
// others. Five buses into the master: the cues that tell the player
// something, the world heard up close, the beds of the land, the music, the
// interface's clicks; the master through a compressor, so that nothing clips
// when everything falls at once. What tells comes first: a cue lowers the beds and the music a
// little while it passes, a cry to all lowers everything else, the end of
// the game silences all but itself.

export type Bus = 'cues' | 'world' | 'beds' | 'music' | 'ui'

/** Each bus's level, in decibels against the cues. */
export const LEVELS: Record<Bus, number> = {
  cues: 0,
  world: -8,
  beds: -20,
  music: -16,
  ui: -14,
}

export type Duck = {
  /** The buses lowered. */
  under: ReadonlyArray<Bus>
  /** By how much, in decibels, and how long they stay low, in seconds. */
  depth: number
  hold: number
}

/** A cue of the player's lowers the beds and the music; a cry to all, everything but the cries. */
export const DUCKS = {
  cue: { under: ['beds', 'music'], depth: -5, hold: 1.2 },
  cry: {
    under: ['cues', 'world', 'beds', 'music', 'ui'],
    depth: -10,
    hold: 2,
  },
} as const satisfies Record<string, Duck>

/** How fast a bus falls under a duck and comes back, in seconds (time constants). */
export const FALL = 0.08
export const RISE = 0.6

/** The world's sounds playing at once, at most: past them, a new one is dropped. */
export const VOICES = 3

/** The master's compressor: gentle, a limiter more than a colour. */
export const COMPRESSOR = {
  threshold: -14,
  knee: 6,
  ratio: 4,
  attack: 0.005,
  release: 0.25,
}

/** Decibels to a gain. */
export const gainOf = (db: number) => 10 ** (db / 20)
