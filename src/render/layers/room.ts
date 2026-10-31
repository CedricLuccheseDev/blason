import { Sprite, Texture } from 'pixi.js'
import { roomFor, tradeLinks } from '../../../engine'
import type { GameState, Work } from '../../../engine'

// Where the work in hand may be built, as OpenFront shows it (« illumine les
// endroits où tu peux poser, ou assombrie le reste. Pareille pour les autres
// constructions »): the tiles the engine allows it lit with a faint gold,
// every other darkened in ink, the whole map one picture a tile a pixel,
// laid over the land and under the works. A village in hand lights brighter
// the tiles by the merchants' roads where it would be a relay (« highlight
// les routes quand on met un village dessus pour faire un village relai »),
// a band of gold along each road. Drawn again when the work in hand
// changes, and once a second while it is held: the land and the works move.

/** The gold of the tiles it may stand on, the ink of the rest, as RGBA. */
const LIT = [0xf4, 0xd2, 0x77, 96]
const DARK = [0x2b, 0x1e, 0x12, 105]
/** The gold of the tiles where a village would be a relay. */
const RELAY = [0xf6, 0xc0, 0x3a, 170]

/** Marks the tiles within so many tiles of one, on a grid so wide and high. */
function markAround(
  near: Uint8Array,
  [width, height]: [number, number],
  t: number,
  r: number,
) {
  const [x, y] = [t % width, Math.floor(t / width)]
  for (let ny = Math.max(0, y - r); ny <= Math.min(height - 1, y + r); ny++)
    for (let nx = Math.max(0, x - r); nx <= Math.min(width - 1, x + r); nx++)
      if ((nx - x) ** 2 + (ny - y) ** 2 <= r * r) near[ny * width + nx] = 1
}

/** The tiles within a relay's reach of the merchants' roads. */
function relaysOf(state: GameState): Uint8Array {
  const { width, height } = state.grid
  const near = new Uint8Array(width * height)
  for (const { road } of tradeLinks(state))
    for (const t of road)
      markAround(near, [width, height], t, state.rules.relayReach)
  return near
}

/** A tile's tone: dark where the work may not stand, gold where it may, a brighter gold where a village would be a relay. */
function toneOf(ok: boolean, relay: boolean) {
  if (!ok) return DARK
  return relay ? RELAY : LIT
}

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
      const relays = work === 'village' ? relaysOf(state) : null
      const { data } = picture
      room.forEach((ok, t) => {
        data.set(toneOf(ok === 1, relays?.[t] === 1), t * 4)
      })
      pen.putImageData(picture, 0, 0)
      texture.source.update()
    },
  }
}
