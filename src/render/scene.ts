import { Container, Graphics } from 'pixi.js'
import { UNIT } from '../../engine'
import { flatten } from './geometry'
import { makeLabels } from './layers/labels'
import { drawLand, drawSea } from './layers/lands'
import { REACH, makePage } from './layers/page'
import { makePaper } from './layers/paper'
import { legible } from './ease'
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
import { makeAllies } from './layers/allies'
import { makeBuilding } from './layers/building'
import { makeLevySeals } from './layers/levy'
import { makeScars } from './layers/scars'
import { makeStrikes } from './layers/strikes'
import type { GameState, World } from '../../engine'
import type { Hand } from './hand'
import type { Application } from 'pixi.js'
import type { Placement } from './layers/labels'

// The map, stacked: the page and the sea, the
// bare land, the lords' washes spreading tile by tile, the borders between
// allies in green, the coast in ink, what the coups leave (the rebels' land
// and the ashes), the borders at war in red, the villages and the works,
// the frame; then the armies, the coups on their way, the aim, and over
// all each lord's name and peasants at the heart of his land. The grain of
// the parchment over the whole page, moving with it. Farther out than the
// whole land, the names and the standards shrink with it, as if the page
// were held farther away, and the small writing fades out.

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
  const allies = makeAllies(me, regions.outline)
  const raids = makeRaids(regions.outline)
  const building = makeBuilding()
  const seals = makeLevySeals()
  const scars = makeScars()
  const strikes = makeStrikes(me)
  const world = new Container()
  world.addChild(page.container, drawSea(land), drawLand(land))
  if (page.compass) world.addChild(page.compass)
  world.addChild(
    regions.container,
    allies.container,
    coast,
    scars.container,
    raids.container,
    trade.roads,
    marks.container,
    seals.container,
    building.container,
    page.frame,
    trade.container,
    armies.container,
    strikes.container,
    tidings.container,
    aim.container,
    labels.container,
    badges.container,
  )
  const paper = makePaper(land, REACH)
  world.addChild(paper.sprite)
  app.stage.addChild(world)

  return {
    world,
    /** The page's textures, which the game's end does not take with it. */
    destroy() {
      page.destroy()
      paper.destroy()
    },
    /** `far`: the land's size against the whole land's, under 1 only farther out than it. */
    draw(hovered: number, hand: Hand, zoom: number, between = 0, far = 1) {
      const now = performance.now()
      const traced = regions.update(now)
      marks.update()
      allies.draw(state, zoom, traced, now)
      scars.draw(state, zoom)
      raids.draw(state, zoom, traced)
      building.draw(state, zoom)
      seals.draw(state, zoom)
      trade.draw(state, between)
      armies.draw(state, zoom, between, far)
      strikes.draw(state, zoom, between)
      tidings.draw(state, zoom)
      aim.draw(hovered, hand, zoom)
      const fit = Math.max(0.45, Math.min(1, app.screen.width / 1280))
      const shown = legible(far)
      labels.update(state, zoom / fit / far, shown)
      badges.update(labels.nameOf, zoom / fit / far)
      badges.container.alpha = shown
    },
  }
}
