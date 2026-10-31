import { Container, Graphics } from 'pixi.js'
import { landShape, makeSea } from './layers/lands'
import { makePeaks } from './layers/peaks'
import { makePage } from './layers/page'
import { makeRegions } from './regions'
import { makeBorders } from './layers/borders'
import { makeGround } from './layers/ground'
import type { GameState, World } from '../../engine'

// The land under the game, as the scene lays it (scene.ts): the page round
// the map and the sea, the high mountains, the lords' washes and the
// ground's tones clipped to the land's shape, the decoration and the rivers,
// the borders clipped to it too, and the coast, left out across the rivers'
// mouths.

export function makeBase(land: World, state: GameState, me: number) {
  const page = makePage(land)
  const sea = makeSea(land)
  const peaks = makePeaks(land)
  const regions = makeRegions(state, me)
  const shape = landShape(land)
  const ground = makeGround(land, state, shape)
  const borders = makeBorders(land, regions.outline)
  // The land's one shape, laid bare and clipped to twice: the washes with
  // the ground's tones, then the borders over the decoration.
  const washed = new Container()
  washed.addChild(regions.container, ground.tinted)
  washed.mask = washed.addChild(new Graphics(shape))
  const lines = new Container()
  lines.addChild(regions.stone, borders.container)
  lines.mask = lines.addChild(new Graphics(shape))
  // The coast's line, but across the rivers' mouths, open water (« ça fait une coupure bizarre »).
  const coast = new Container()
  coast.addChild(borders.coast, ground.riverCut)
  coast.setMask({ mask: ground.riverCut, inverse: true })
  return {
    page,
    sea,
    peaks,
    regions,
    shape,
    ground,
    borders,
    washed,
    lines,
    coast,
  }
}
