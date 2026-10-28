import { Container, Graphics } from 'pixi.js'
import { UNIT } from '../../engine'
import { flatten } from './geometry'
import { makeLabels } from './layers/labels'
import { drawLand, drawSea } from './layers/lands'
import { makePage } from './layers/page'
import { makePaper } from './layers/paper'
import { TONE } from './palette'
import { makeStamps } from './textures'
import { makeArmies } from './armies'
import { makeAim } from './layers/aim'
import { makeMarks } from './marks'
import { makeBadges, tilePlaces } from './places'
import { makeRegions } from './regions'
import { makeTrade } from './trade'
import { makeTidings } from './layers/tidings'
import { makeRaids } from './layers/raids'
import { makeBuilding } from './layers/building'
import { makeLevySeals } from './layers/levy'
import type { GameState, Work, World } from '../../engine'
import type { Application } from 'pixi.js'
import type { Placement } from './layers/labels'

// The map, stacked: the page and the sea, the
// bare land, the lords' washes spreading tile by tile, the coast in ink,
// the villages and the works, the frame; then the armies, the aim, and over
// all each lord's name and peasants at the heart of his land. The grain of
// the parchment over the screen.

export function makeScene(
  app: Application,
  land: World,
  me: number,
  state: GameState,
  names: Array<string>,
) {
  const page = makePage(land)
  const regions = makeRegions(state, land, me)
  const coast = new Graphics()
  for (const run of land.coast) coast.poly(flatten(run), false)
  coast.stroke({ width: 1.5, color: TONE.ink, alpha: 0.9, join: 'round' })
  const marks = makeMarks(state)
  const armies = makeArmies(makeStamps(app.renderer), me)
  const aim = makeAim(state, me)
  // Where the lords are written, read once a tick for the names and their marks.
  let read = { tick: -1, places: new Map() as Placement }
  const placesOf = (s: GameState) => {
    if (read.tick !== s.tick) read = { tick: s.tick, places: tilePlaces(s) }
    return read.places
  }
  const labels = makeLabels(
    me,
    names,
    (s: GameState, lord) => Math.floor(s.players[lord].peasants / UNIT),
    placesOf,
  )
  const badges = makeBadges(state, me)
  const trade = makeTrade(makeStamps(app.renderer), me)
  const tidings = makeTidings(me)
  const raids = makeRaids()
  const building = makeBuilding()
  const seals = makeLevySeals()
  const world = new Container()
  world.addChild(page.container, drawSea(land), drawLand(land))
  if (page.compass) world.addChild(page.compass)
  world.addChild(
    regions.container,
    coast,
    raids.container,
    trade.roads,
    marks.container,
    seals.container,
    building.container,
    page.frame,
    trade.container,
    armies.container,
    tidings.container,
    aim.container,
    labels.container,
    badges.container,
  )
  const paper = makePaper(app)
  app.stage.addChild(world, paper.sprite)

  return {
    world,
    resize: paper.resize,
    draw(hovered: number, work: Work | null, zoom: number, between = 0) {
      regions.update(performance.now())
      marks.update()
      raids.draw(state, zoom)
      building.draw(state, zoom)
      seals.draw(state, zoom)
      trade.draw(state, between)
      armies.draw(state, zoom, between)
      tidings.draw(state, zoom)
      aim.draw(hovered, work, zoom)
      const fit = Math.max(0.45, Math.min(1, app.screen.width / 1280))
      labels.update(state, zoom / fit)
      badges.update(labels.nameOf, zoom / fit)
    },
  }
}
