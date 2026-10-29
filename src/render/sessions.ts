import { startSession } from './session'
import { startRemoteSession } from './remote'
import { startStillSession } from './still'
import type { Online } from './online'
import type { Save } from './save'
import type { Session } from './session'
import type { Grid, Level } from '../../engine'

// Which session runs the game on screen: a saved game held still at its
// tick (still.ts), a game online stepped by the relay's turns (remote.ts),
// or a game alone, stepped by the clock against bots (session.ts).

export function openSession(
  grid: Grid,
  seed: string,
  me: number,
  game: { level?: Level; online?: Online; save?: Save },
): Session {
  const { online, save } = game
  if (save) return startStillSession(grid, save)
  if (online) return startRemoteSession(grid, online)
  return startSession(grid, seed, me, game.level)
}
