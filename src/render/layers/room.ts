import { Sprite, Texture } from 'pixi.js'
import { roomFor } from '../../../engine'
import type { GameState, Work } from '../../../engine'

// Where the work in hand may be built, as OpenFront shows it (« illumine les
// endroits où tu peux poser, ou assombrie le reste. Pareille pour les autres
// constructions »): the tiles the engine allows it lit with a faint gold,
// every other darkened in ink, the whole map one picture a tile a pixel,
// laid over the land and under the works. Drawn again when the work in hand
// changes, and once a second while it is held: the land and the works move.

/** The gold of the tiles it may stand on, the ink of the rest, as RGBA. */
const LIT = [0xf4, 0xd2, 0x77, 96]
const DARK = [0x2b, 0x1e, 0x12, 105]

export function makeRoom(state: GameState, me: number) {
  const { width, height, size } = state.grid
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const pen = canvas.getContext('2d')
  const picture = pen?.createImageData(width, height)
  const texture = Texture.from(canvas)
  const sprite = new Sprite(texture)
  sprite.scale.set(size)
  sprite.visible = false
  /** What was drawn: the work and the second, drawn again when either changes. */
  let drawn = ''

  return {
    sprite,
    /** The room of the work in hand, or nothing when none is held. */
    draw(work: Work | null) {
      sprite.visible = work !== null && me >= 0
      if (!work || me < 0 || !pen || !picture) return
      const key = `${work}:${Math.floor(state.tick / 10)}:${state.works.length}`
      if (key === drawn) return
      drawn = key
      const room = roomFor(state, me, work)
      const { data } = picture
      room.forEach((ok, t) => {
        const tone = ok ? LIT : DARK
        data.set(tone, t * 4)
      })
      pen.putImageData(picture, 0, 0)
      texture.source.update()
    },
  }
}
