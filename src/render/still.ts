import { landBox, siteOf } from './marks'
import { restoreGame } from './save'
import type { makeCamera } from './camera'
import type { Save } from './save'
import type { Session } from './session'
import type { GameState, Grid } from '../../engine'

// A saved game on screen (save.ts), held still at its tick: the map and the
// HUD drawn as they stood, the camera where the save says, nothing played.
// It is how the maquette (design/maquette) takes the game's real moments
// without playing up to them.

/** A saved game's session: its state at the tick it was saved, never stepped; an order sent is let go. */
export function startStillSession(grid: Grid, save: Save): Session {
  return {
    state: restoreGame(grid, save),
    me: save.me,
    send: () => undefined,
    advance: () => 0,
  }
}

/** The camera where the save stands it, at once: the whole land, the player's own land, or a tile at so many pixels a tile. */
export function standCamera(
  camera: ReturnType<typeof makeCamera>,
  state: GameState,
  save: Save,
) {
  const shot = save.camera
  const box = shot === 'home' ? landBox(state, save.me) : null
  if (box) camera.focus(box, true)
  else if (typeof shot === 'object') {
    const { x, y } = siteOf(state, shot.tile)
    camera.look(x, y, shot.perTile / state.grid.size)
  } else camera.fit()
}
