import { Sprite, Texture } from 'pixi.js'
import { roomFor, tradeLinks } from '../../../engine'
import { corners, smooth } from '../trace'
import type { GameState, Work } from '../../../engine'

// Where the work in hand may be built (« illumine les endroits où tu peux
// poser »): the land the engine allows it traced as the lands are, its steps
// rounded off, ringed in gold over ink and left in its colours, the rest of
// one's land veiled a little (« tous les highlights sont horribles », the
// tiles lit and darkened one by one, square and blurred, then a gold wash
// that greyed one's land, gone); the rest of the map left as it is. A village in hand washes brighter where it would be a relay, a
// band along each merchants' road (« highlight les routes quand on met un
// village dessus pour faire un village relai »). Drawn on a picture a few
// pixels a tile, again when the work in hand changes and once a second
// while it is held: the land and the works move.

/** Pixels of the picture a tile. */
const SHARP = 4
/** The veil over one's land it may not stand on, the ring round where it may and its ink, the relays' wash, as CSS colours. */
const VEIL = 'rgba(43, 30, 18, 0.32)'
const RING = 'rgba(244, 196, 64, 0.95)'
const RING_INK = 'rgba(43, 30, 18, 0.7)'
const RELAY = 'rgba(246, 192, 58, 0.45)'
/** The ring's width and its ink's, in tiles. */
const [RING_WIDTH, INK_WIDTH] = [0.28, 0.5]

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

/** The outline of a set of tiles as one path, its steps rounded off, in the picture's pixels; its holes left out by the even-odd rule. */
function pathOf(
  width: number,
  height: number,
  is: (t: number) => boolean,
): Path2D {
  const tiles: Array<number> = []
  for (let t = 0; t < width * height; t++) if (is(t)) tiles.push(t)
  const path = new Path2D()
  for (const loop of corners(width, height, is, tiles)) {
    smooth(loop, SHARP).forEach(([x, y], i) =>
      i ? path.lineTo(x, y) : path.moveTo(x, y),
    )
    path.closePath()
  }
  return path
}

export function makeRoom(state: GameState, me: number) {
  const { width, height, size } = state.grid
  const canvas = document.createElement('canvas')
  canvas.width = width * SHARP
  canvas.height = height * SHARP
  const pen = canvas.getContext('2d')
  const texture = Texture.from(canvas)
  const sprite = new Sprite(texture)
  sprite.scale.set(size / SHARP)
  sprite.visible = false
  /** What was drawn: the work and the second, drawn again when either changes. */
  let drawn = ''

  return {
    sprite,
    /** The room of the work in hand, or nothing when none is held. */
    draw(work: Work | null) {
      sprite.visible = work !== null && me >= 0
      if (!work || me < 0 || !pen) return
      const key = `${work}:${Math.floor(state.tick / 10)}:${state.works.length}`
      if (key === drawn) return
      drawn = key
      const room = roomFor(state, me, work)
      pen.clearRect(0, 0, canvas.width, canvas.height)
      const allowed = pathOf(width, height, (t) => room[t] === 1)
      pen.fillStyle = VEIL
      pen.fill(
        pathOf(width, height, (t) => state.owner[t] === me && room[t] !== 1),
        'evenodd',
      )
      if (work === 'village') {
        const relays = relaysOf(state)
        pen.fillStyle = RELAY
        pen.fill(
          pathOf(width, height, (t) => room[t] === 1 && relays[t] === 1),
          'evenodd',
        )
      }
      pen.lineJoin = 'round'
      for (const [line, color] of [
        [INK_WIDTH, RING_INK],
        [RING_WIDTH, RING],
      ] as const) {
        pen.lineWidth = line * SHARP
        pen.strokeStyle = color
        pen.stroke(allowed)
      }
      texture.source.update()
    },
  }
}
