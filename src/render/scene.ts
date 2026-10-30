import { Container, Graphics } from 'pixi.js'
import { UNIT } from '../../engine'
import { viewOf } from './camera'
import { cullable, group } from './groups'
import { renewalsOf } from './renewals'
import { makeLabels } from './layers/labels'
import { landShape, makeSea } from './layers/lands'
import { makePeaks } from './layers/peaks'
import { REACH, makePage } from './layers/page'
import { makePaper } from './layers/paper'
import { makeStamps } from './textures'
import { makeArmies } from './armies'
import { makeAim } from './layers/aim'
import { makeGoals } from './layers/goals'
import { makePlan } from './layers/plan'
import { strategicOf } from './ground/detail'
import { makePlanted } from './layers/planted'
import { makeMarks } from './marks'
import { makeBadges, placesEachTick } from './places'
import { makeRegions } from './regions'
import { makeTrade } from './trade'
import { makeTidings } from './layers/tidings'
import { makeRaids } from './layers/raids'
import { makeAllies } from './layers/allies'
import { unmeasured } from './perf'
import { makeLit } from './layers/lit'
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
import { groundOf } from './clearance'
import type { Measure } from './perf'
import type { GameState, World } from '../../engine'
import type { Hand } from './hand'
import type { Application } from 'pixi.js'
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
// the aim, the war banners where my armies go (layers/goals.ts), the standards planted in the
// opening, and over all each lord's name and peasants at the heart of his
// land. An alliance broken snaps between the names, under the wagons and
// the armies. The grain of the parchment over the whole page, moving with
// it. Farther out than the whole land, the figures and the standards
// shrink with it, as if the page were held farther away, a name never
// under 16 pixels, and the standards' small writing fades out.

/** The HUD's bottom row's height on screen, in pixels: the map's words fade under it. */
const BOTTOM = 130

export function makeScene(
  app: Application,
  land: World,
  me: number,
  state: GameState,
  names: Array<string>,
) {
  const page = makePage(land)
  const sea = makeSea(land)
  const peaks = makePeaks(land)
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
  const goals = makeGoals(me)
  const plan = makePlan(me)
  const placesOf = placesEachTick()
  const labels = makeLabels(
    me,
    names,
    (s: GameState, lord) => Math.floor(s.players[lord].peasants / UNIT),
    placesOf,
    groundOf(state, me, land),
  )
  const badges = makeBadges(state, me)
  const pacts = makePacts(me, labels.nameOf)
  const envoys = makeEnvoys(state, me, labels.nameOf)
  const trade = makeTrade(makeStamps(app.renderer), me)
  const tidings = makeTidings(me)
  const allies = makeAllies(me, regions.outline)
  const lit = makeLit(regions.outline)
  const raids = makeRaids(regions.outline)
  const building = makeBuilding(me)
  const seals = makeLevySeals(me)
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
      peaks.container,
      lit.container,
      scars.container,
      marks.container,
      plan.container,
      life.container,
      allies.container,
      raids.container,
      pacts.container,
      page.frame,
      trade.container,
      // A village's seal and a work's gauge over the caravans passing by
      // (« attentions aux couche le marchand passe par dessus »).
      seals.container,
      building.container,
      armies.container,
      volleys.container,
      strikes.container,
      tidings.container,
      aim.container,
      planted.container,
      goals.container,
      labels.container,
      badges.container,
    ].map((layer) => group(layer)),
  )
  const paper = makePaper(land, REACH)
  world.addChild(paper.sprite)
  app.stage.addChild(world)

  /** The part of the world on screen, in map units. */
  const view = () => viewOf(world, app.screen)

  return {
    world,
    /** What the ear reads of the map (render/sound.ts): its ground, and the part of it on screen. */
    ear: { terrain: ground.terrain, rivers: land.rivers, view },
    /** Where the HUD lays its pieces on the map this frame: my alliances asking to be renewed (renewals.ts), the heralds of the offers made to me. */
    anchors(): Array<Anchor> {
      const placeOf = (lord: number) => placesOf(state).get(lord)
      return [
        ...renewalsOf(state, me, badges.besideOf, placeOf),
        ...envoys.anchors(),
      ]
    },
    /** The lord whose land is lit, pointed at in the HUD's list; none. */
    light: lit.light,
    /** Where a lord's name is written, at the heart of his land; none while he holds none. */
    placeOf: (lord: number) => placesOf(state).get(lord) ?? null,
    /** Where an army's standard stands, by the village or market it left from; none. */
    flagOf: armies.flagOf,
    /** The army grown, pointed at in the HUD's campaigns; none. */
    lightArmy: armies.light,
    /** The page's textures, which the game's end does not take with it. */
    destroy() {
      page.destroy()
      paper.destroy()
      shape.destroy()
      ground.destroy()
    },
    /** `far`: the land's size against the whole land's, under 1 only farther out than it. */
    draw(
      hovered: number,
      hand: Hand,
      zoom: number,
      between = 0,
      far = 1,
      /** Each layer's time, for the frame's account (perf.ts); none kept by default. */
      m: Measure = unmeasured,
    ) {
      const now = performance.now()
      cullable(world)
      const retraced = m('regions', () => regions.update(now))
      const traced = retraced !== null
      const seen = view()
      m('sea', () => sea.draw(zoom))
      m('ground', () => ground.relayout(regions.keys(), traced))
      m('ground', () => ground.draw(seen, zoom, now))
      m('borders', () => borders.update(retraced, zoom))
      m('lit', () => lit.draw(zoom, retraced))
      // How much the map is the strategist's: the drawn works fade for the flat icons.
      const strategic = strategicOf(zoom * state.grid.size)
      marks.container.alpha = 1 - strategic
      marks.container.visible = strategic < 1
      m('marks', () => marks.update(zoom))
      m('plan', () => plan.draw(state, zoom, strategic))
      m('life', () => life.draw(state, seen, zoom, now))
      m('allies', () => allies.draw(state, zoom, traced, now))
      m('scars', () => scars.draw(state, zoom))
      m('raids', () => raids.draw(state, zoom, traced))
      m('building', () => building.draw(state, zoom))
      m('seals', () => seals.draw(state, zoom))
      m('trade', () => trade.draw(state, zoom, between, strategic))
      m('armies', () => armies.draw(state, zoom, seen, between, far, strategic))
      m('volleys', () => volleys.draw(state, zoom, seen, between))
      m('strikes', () => strikes.draw(state, zoom, between))
      m('tidings', () => tidings.draw(state, zoom))
      m('aim', () => aim.draw(hovered, hand, zoom))
      m('planted', () => planted.draw(state, zoom, now))
      m('goals', () => goals.draw(state, zoom))
      const fit = Math.max(0.45, Math.min(1, app.screen.width / 1280))
      m('labels', () =>
        // The bottom row's band, where the words fade under its pieces.
        labels.update(state, zoom, fit * far, app.screen.height - BOTTOM),
      )
      m('badges', () => badges.update(labels.nameOf, zoom / fit / far))
      m('pacts', () => pacts.draw(state, zoom, now / 1000))
    },
  }
}
