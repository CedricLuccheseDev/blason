import { aloneSetup, hostSetup } from '../../engine'
import { startSession } from './session'
import { startRemoteSession } from './remote'
import { startStillSession } from './still'
import type { Online } from './online'
import type { Save } from './save'
import type { Session } from './session'
import type { Book, Grid, Level, World } from '../../engine'

// Which session runs the game on screen: a saved game held still at its
// tick (still.ts), a game online stepped by the relay's turns (remote.ts),
// or a game alone, stepped by the clock against bots (session.ts): the
// host's, held while he sets it in his book, or one begun at once.

export function openSession(
  grid: Grid,
  land: Pick<World, 'seed' | 'size'>,
  me: number,
  game: { level?: Level; online?: Online; save?: Save; book?: Book },
): Session {
  const { online, save, book } = game
  if (save) return startStillSession(grid, save)
  if (online) return startRemoteSession(grid, online)
  const { seed, size } = land
  if (book)
    return startSession(grid, hostSetup({ ...book, seed, size }), me, true)
  const setup = aloneSetup({ seed, size, level: game.level ?? 'normal' })
  return startSession(grid, setup, me)
}
