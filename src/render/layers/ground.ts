import { Container } from 'pixi.js'
import { tradeLinks } from '../../../engine'
import { makeBlooms } from '../ground/bloom'
import { makeDecor } from '../ground/decor'
import { fades } from '../ground/detail'
import { makeRivers } from '../ground/rivers'
import { readTerrain } from '../ground/terrain'
import { makeTones } from '../ground/tones'
import type { Box } from '../camera'
import type { GameState, Link, World } from '../../../engine'

// The ground over the lords' washes and under the roads and the borders:
// the wash's watercolour blooms and the woods' and hills' darker tone at
// every distance, the rivers from mid distance, and the decoration that
// comes with the zoom (ground/decor.ts). Its own biomes are read once, when
// the game is mounted; the rest follows the lands as they are traced.

export function makeGround(world: World, state: GameState) {
  const { grid } = state
  const terrain = readTerrain(world, grid)
  const container = new Container()
  /** The blooms and the tones, which the scene clips to the coast with the washes. */
  const tinted = new Container()
  tinted.addChild(makeBlooms(world), makeTones(grid, terrain))
  const rivers = makeRivers(world.rivers)
  const decor = makeDecor({ grid, terrain })
  container.addChild(rivers.container, decor.container)
  let laid: { links: Array<Link> | null; works: string } = {
    links: null,
    works: '',
  }
  let roads = new Uint8Array(grid.land.length)
  let read = -1

  return {
    container,
    tinted,
    /** The fields of the villages round a view, for the peasants at work in them. */
    fieldsNear: (view: Box) =>
      decor.fieldsNear(view.left, view.top, view.right, view.bottom),
    /** The lands as traced again, or the works or the roads changed: the decoration they touch is painted anew. */
    relayout(keys: Int32Array, traced: boolean) {
      // The works and the roads change only with a tick.
      if (!traced && state.tick === read) return
      read = state.tick
      const links = tradeLinks(state)
      const works = state.works.map((w) => `${w.tile}:${w.owner}`).join()
      if (!traced && links === laid.links && works === laid.works) return
      if (links !== laid.links) {
        roads = new Uint8Array(grid.land.length)
        for (const { road } of links) for (const t of road) roads[t] = 1
      }
      laid = { links, works }
      decor.relayout({
        keys,
        sites: state.works.map((w) => w.tile),
        villages: state.works
          .filter((w) => w.work === 'village')
          .map(({ tile, owner }) => ({ tile, owner })),
        roads,
      })
    },
    draw(view: Box, zoom: number, now: number) {
      rivers.draw(zoom, fades(zoom * grid.size).rivers)
      decor.draw(view, zoom, now)
    },
    destroy: () => decor.destroy(),
  }
}
