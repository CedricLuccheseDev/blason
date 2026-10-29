import { Container, Graphics } from 'pixi.js'
import { UNIT, canRenew } from '../../engine'
import { makeLabels } from './layers/labels'
import { landShape, makeSea } from './layers/lands'
import { REACH, makePage } from './layers/page'
import { makePaper } from './layers/paper'
import { makeStamps } from './textures'
import { makeArmies } from './armies'
import { makeAim } from './layers/aim'
import { makePlanted } from './layers/planted'
import { makeMarks } from './marks'
import { makeBadges, tilePlaces } from './places'
import { makeRegions } from './regions'
import { makeTrade } from './trade'
import { makeTidings } from './layers/tidings'
import { makeRaids } from './layers/raids'
import { makeAllies } from './layers/allies'
import { makePacts } from './layers/pacts'
import { makeEnvoys } from './envoys'
import { makeBuilding } from './layers/building'
import { makeLevySeals } from './layers/levy'
import { makeScars } from './layers/scars'
import { makeStrikes } from './layers/strikes'
import { makeVolleys } from './layers/volleys'
import { makeBorders } from './layers/borders'
import { makeGround } from './layers/ground'
import { makeLife } from './layers/life'
import type { GameState, World } from '../../engine'
import type { Hand } from './hand'
import type { Application } from 'pixi.js'
import type { Placement } from './layers/labels'
import type { Anchor } from './heralds'

// The map, stacked so that what the game must make read stays above what
// only adorns it: the page and the sea, the bare land, the lords' washes
// spreading tile by tile; the ground over them (its blooms, its woods' and
// hills' tone, rivers, and the decoration that comes with the zoom); the
// paved roads; the borders, a watercolour edge and a quill's ribbon of
// ink, and the coast; what the coups leave (the rebels' land and the
// ashes); the villages and the works, and their life; the borders between
// allies in green and those at war in red; the frame; the wagons, the
// armies and the castles' arrows falling on them, the coups on their way,
// the aim, the standards planted in the
// opening, and over all each lord's name and peasants at the heart of his
// land. An alliance broken snaps between the names, under the wagons and
// the armies. The grain of the parchment over the whole page, moving with
// it. Farther out than the whole land, the figures and the standards
// shrink with it, as if the page were held farther away, a name never
// under 16 pixels, and the standards' small writing fades out.

/** Containers drawn as one render group, their batches kept until their own structure changes. */
function group(...children: Array<Container>) {
  const c = new Container({ isRenderGroup: true })
  c.addChild(...children)
  return c
}

export function makeScene(
  app: Application,
  land: World,
  me: number,
  state: GameState,
  names: Array<string>,
) {
  const page = makePage(land)
  const sea = makeSea(land)
  const regions = makeRegions(state, me)
  const ground = makeGround(land, state)
  const borders = makeBorders(land, regions.outline)
  // The land's one shape, laid bare and clipped to twice: the washes with
  // the ground's tones, then the borders over the decoration.
  const shape = landShape(land)
  const washed = new Container()
  washed.addChild(regions.container, ground.tinted)
  washed.mask = washed.addChild(new Graphics(shape))
  const lines = new Container()
  lines.addChild(regions.stone, borders.container)
  lines.mask = lines.addChild(new Graphics(shape))
  const marks = makeMarks(state, me)
  const life = makeLife(ground.fieldsNear)
  const armies = makeArmies(me)
  const volleys = makeVolleys(armies.menOf)
  const aim = makeAim(state, me)
  const planted = makePlanted(me)
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
  const pacts = makePacts(me, labels.nameOf)
  const envoys = makeEnvoys(state, me, labels.nameOf)
  const trade = makeTrade(makeStamps(app.renderer), me)
  const tidings = makeTidings(me)
  const allies = makeAllies(me, regions.outline)
  const raids = makeRaids(regions.outline)
  const building = makeBuilding(me)
  const seals = makeLevySeals()
  const scars = makeScars()
  const strikes = makeStrikes(me)
  const world = new Container()
  // Each layer its own render group: what moves each frame (a man shown or
  // hidden, a seal drawn again) rebuilds its own group's batches, never the
  // washes', the borders' or the decoration's, which change a few times a
  // second at most.
  const below = [page.container, sea.container, new Graphics(shape)]
  if (page.compass) below.push(page.compass)
  world.addChild(
    group(...below),
    ...[
      washed,
      ground.container,
      trade.roads,
      lines,
      borders.coast,
      scars.container,
      marks.container,
      life.container,
      allies.container,
      raids.container,
      seals.container,
      building.container,
      pacts.container,
      page.frame,
      trade.container,
      armies.container,
      volleys.container,
      strikes.container,
      tidings.container,
      aim.container,
      planted.container,
      labels.container,
      badges.container,
    ].map((layer) => group(layer)),
  )
  const paper = makePaper(land, REACH)
  world.addChild(paper.sprite)
  app.stage.addChild(world)

  /** The part of the world on screen, in map units. */
  const view = () => {
    const k = world.scale.x
    return {
      left: -world.x / k,
      top: -world.y / k,
      right: (app.screen.width - world.x) / k,
      bottom: (app.screen.height - world.y) / k,
    }
  }

  return {
    world,
    /**
     * Where the HUD lays its pieces on the map this frame: the seal of each
     * of my alliances in its last moments, when it asks to be renewed,
     * beside my ally's name (at the heart of his land while it is not
     * written); the heralds of the offers made to me.
     */
    anchors(): Array<Anchor> {
      const asking = state.alliances.flatMap((x): Array<Anchor> => {
        if ((x.a !== me && x.b !== me) || !canRenew(state, x)) return []
        const ally = x.a === me ? x.b : x.a
        const at = badges.besideOf(ally) ?? placesOf(state).get(ally)
        return at ? [{ key: `pact:${ally}`, kind: 'pact', lord: ally, at }] : []
      })
      return [...asking, ...envoys.anchors()]
    },
    /** The page's textures, which the game's end does not take with it. */
    destroy() {
      page.destroy()
      paper.destroy()
      shape.destroy()
      ground.destroy()
    },
    /** `far`: the land's size against the whole land's, under 1 only farther out than it. */
    draw(hovered: number, hand: Hand, zoom: number, between = 0, far = 1) {
      const now = performance.now()
      const retraced = regions.update(now)
      const traced = retraced !== null
      const seen = view()
      sea.draw(zoom)
      ground.relayout(regions.keys(), traced)
      ground.draw(seen, zoom, now)
      borders.update(retraced, zoom)
      marks.update(zoom)
      life.draw(state, seen, zoom, now)
      allies.draw(state, zoom, traced, now)
      scars.draw(state, zoom)
      raids.draw(state, zoom, traced)
      building.draw(state, zoom)
      seals.draw(state, zoom)
      trade.draw(state, zoom, between)
      armies.draw(state, zoom, seen, between, far)
      volleys.draw(state, zoom, seen, between)
      strikes.draw(state, zoom, between)
      tidings.draw(state, zoom)
      aim.draw(hovered, hand, zoom)
      planted.draw(state, zoom, now)
      const fit = Math.max(0.45, Math.min(1, app.screen.width / 1280))
      labels.update(state, zoom, fit * far)
      badges.update(labels.nameOf, zoom / fit / far)
      pacts.draw(state, zoom, now / 1000)
    },
  }
}
