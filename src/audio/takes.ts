import { chance } from './chance'
import { CUES } from './cues'

// The takes of the cues (cues.ts): which of a family sounds this time, never
// the one heard last (« les sons sont toujours les mêmes … on se lasse »),
// a little above or below its pitch, and which a page fetches.

/** The whole game's sound, or the home's: its interface's clicks alone, no beds and no music (« Les son de hud doivent être aussi dans la home »). */
export type Scope = 'game' | 'home'

/** A take of a layer's family, any but the last heard (« les sons sont toujours les mêmes … on se lasse »). */
export function takeOf(files: ReadonlyArray<string>, last = -1) {
  if (files.length < 2) return 0
  if (last < 0) return Math.floor(chance() * files.length)
  const i = Math.floor(chance() * (files.length - 1))
  return i >= last ? i + 1 : i
}

/** How far a take may play above or below its pitch, so that one blow heard twice is never quite the same. */
const SWAY = 0.03

/** A take's pitch this time, swayed a little. */
export const sway = () => 1 + (chance() * 2 - 1) * SWAY

/** Every take of the cues a page plays: all of them in the game, the interface's at home. */
export const takesFor = (scope: Scope) =>
  Object.values(CUES)
    .filter((spec) => scope === 'game' || spec.bus === 'ui')
    .flatMap((spec) =>
      spec.layers.flatMap(({ file }) =>
        typeof file === 'string' ? [file] : file,
      ),
    )

