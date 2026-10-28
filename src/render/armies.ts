import { Container } from 'pixi.js'
import { UNIT } from '../../engine'
import { GAP, makeFronts } from './fronts'
import { makeRoads, pathOf } from './layers/column'
import { makeFallen } from './layers/fallen'
import { makeStandard } from './layers/standard'
import { makeTroops } from './layers/troops'
import { makeWarning } from './layers/warning'
import { TONE, playerColor } from './palette'
import { legible } from './ease'
import { figuresOf, lose, makeSquad, middle, rally } from './squads'
import { warmFigures } from './figures'
import type { Front, Spot } from './fronts'
import type { Drawn, Line } from './layers/troops'
import type { Man, Shape, Squad } from './squads'
import type { GameState, Host } from '../../engine'

// The armies, as one picture. Each army is a few men kept from frame to
// frame (squads.ts) who walk its road in a column, then stand in ranks at
// the point its attack has reached and follow it as it goes (fronts.ts), the peasants of the land
// facing them with their pitchforks; when two armies fight, both run to the
// ground between them and face each other there. Men lost fall where they
// stand (layers/fallen.ts); a side comes and goes in a fade. Among each
// army's men, its standard-bearer holds high its banner, its lord's arms and
// its men written on it (layers/standard.ts). An enemy army
// coming for the player is shown from afar (layers/warning.ts).

/** Seconds for an army to fade in or out. */
const FADE = 0.5
type Army = {
  troops: Squad
  peasants: Squad
  /** Its men at the last tick read, and its place this frame; gone once the game no longer has it. */
  men: number
  front: Front | null
  flag: Spot | null
  gone: boolean
}

/** The colour of the peasants who hold a land: their lord's, or the free land's. */
const peasantColor = (owner: number) =>
  owner >= 0 ? playerColor(owner) : TONE.neutralPill

/** An army as it is first seen: no men yet, they walk in. */
const enlist = (host: Host): Army => ({
  troops: makeSquad(host.army, playerColor(host.owner)),
  peasants: makeSquad('peasant', peasantColor(host.target)),
  men: host.men,
  front: null,
  flag: null,
  gone: false,
})

export function makeArmies(me: number) {
  warmFigures()
  const container = new Container()
  const roads = makeRoads()
  const fallen = makeFallen(0.2)
  const troops = makeTroops()
  const warning = makeWarning(me)
  container.addChild(
    warning.container,
    roads.container,
    fallen.container,
    troops.container,
  )
  const fronts = makeFronts()
  const armies = new Map<Host, Army>()
  const standards = new Map<Army, ReturnType<typeof makeStandard>>()
  let tick = -1
  let last = performance.now() / 1000

  const fall = (squad: Squad) => (man: Man) =>
    fallen.fall(man.x, man.y, squad.color, squad.look, man.facing, man.seed)

  /** The men lost since the last tick fall, the army's and, at the front, the peasants it killed. */
  function count(state: GameState, host: Host, army: Army) {
    const lost = Math.max(0, army.men - host.men) / UNIT
    army.men = host.men
    lose(army.troops, lost, figuresOf(host.men / UNIT), fall(army.troops))
    if (army.front?.phase !== 'front') return
    const killed = (lost * 100) / state.rules.combat.peasants
    const { peasants } = army
    lose(peasants, killed, peasants.men.length, fall(peasants))
  }

  /**
   * The peasants of the land before an army at its front, in two ranks facing
   * it. Once faded out they are forgotten, so that at the next front they
   * stand up where they are, in the colour of the land they hold, and never
   * run there across the map.
   */
  function defend(state: GameState, host: Host, army: Army, dt: number) {
    const { front } = army
    if (front?.phase !== 'front' || !front.line) {
      army.peasants.alpha = Math.max(0, army.peasants.alpha - dt / FADE)
      return
    }
    if (army.peasants.alpha === 0)
      army.peasants = makeSquad('peasant', peasantColor(host.target))
    const { peasants } = army
    const held =
      host.target >= 0 ? state.players[host.target].peasants / UNIT / 3 : 30
    const facing = { x: -front.facing.x, y: -front.facing.y }
    const at = {
      x: front.line.x + front.facing.x * GAP,
      y: front.line.y + front.facing.y * GAP,
    }
    rally(peasants, figuresOf(held), { line: 'ranks', at, facing }, dt)
    peasants.alpha = Math.min(1, peasants.alpha + dt / FADE)
  }

  /** Each man of the army a frame closer to his place: in a column on the march, in ranks at the front or in battle. */
  function place(state: GameState, host: Host, army: Army, dt: number) {
    const front = army.front as Front
    const shape: Shape =
      front.phase === 'march'
        ? { line: 'column', path: pathOf(state, host), head: front.head }
        : { line: 'ranks', at: front.at, facing: front.facing }
    rally(army.troops, figuresOf(host.men / UNIT), shape, dt)
    army.troops.alpha = Math.min(1, army.troops.alpha + dt / FADE)
    defend(state, host, army, dt)
  }

  /** An army the game no longer has fades out where it stood, then is forgotten. */
  function dismiss(host: Host, army: Army, dt: number) {
    army.gone = true
    army.troops.alpha = Math.max(0, army.troops.alpha - dt / FADE)
    army.peasants.alpha = Math.max(0, army.peasants.alpha - dt / FADE)
    if (army.troops.alpha > 0) return
    armies.delete(host)
    standards.get(army)?.box.destroy({ children: true })
    standards.delete(army)
  }

  /** The armies the game has now followed a frame further. */
  function follow(state: GameState, between: number, dt: number) {
    const fresh = state.tick !== tick
    tick = state.tick
    const now = fronts.read(state, between)
    for (const host of state.hosts) {
      const army = armies.get(host) ?? enlist(host)
      armies.set(host, army)
      army.front = now.get(host) ?? null
      if (fresh) count(state, host, army)
      place(state, host, army, dt)
    }
    for (const [host, army] of armies)
      if (!now.has(host)) dismiss(host, army, dt)
  }

  /** The lines where men fight: each front, each battle once. */
  function lines(): Array<Line> {
    const drawn: Array<Line> = []
    const told = new Set<Host>()
    for (const [host, army] of armies) {
      const { front } = army
      if (!front?.line || army.gone || told.has(host)) continue
      if (front.foe) told.add(front.foe)
      // The dust rises where the men stand, which never jump, before them.
      const men = middle(army.troops.men)
      if (!men) continue
      drawn.push({
        at: {
          x: men.x + front.facing.x * GAP,
          y: men.y + front.facing.y * GAP,
        },
        across: { x: -front.facing.y, y: front.facing.x },
        width: Math.ceil(army.troops.men.length / 2) * 3.6,
        alpha: army.troops.alpha,
        seed: host.from,
      })
    }
    return drawn
  }

  /** Each army's standard among its men, following them, faded in and out with them. */
  function label(zoom: number, shown: number) {
    for (const army of armies.values()) {
      const over = middle(army.troops.men)
      if (!over) continue
      const was = army.flag ?? over
      army.flag = {
        x: was.x + (over.x - was.x) * 0.2,
        y: was.y + (over.y - was.y) * 0.2,
      }
      let drawn = standards.get(army)
      if (!drawn) {
        drawn = makeStandard(army.troops.color)
        standards.set(army, drawn)
        container.addChild(drawn.box)
      }
      drawn.box.alpha = army.troops.alpha
      drawn.box.position.set(army.flag.x, army.flag.y)
      drawn.show(Math.floor(army.men / UNIT), zoom, shown)
    }
  }

  /** Every side drawn: each army's men, and the peasants before it. */
  function sides(): Array<Drawn> {
    return [...armies.values()].flatMap((a) => [
      { squad: a.troops, fighting: a.front?.phase !== 'march' },
      ...(a.peasants.alpha > 0 ? [{ squad: a.peasants, fighting: true }] : []),
    ])
  }

  return {
    container,
    /** `far`: under 1 farther out than the whole land, where the standards shrink with it. */
    draw(state: GameState, zoom: number, between = 0, far = 1) {
      const seconds = performance.now() / 1000
      const dt = Math.min(0.1, seconds - last)
      last = seconds
      follow(state, between, dt)
      const standing = [...armies.values()].filter((a) => !a.gone)
      const marches = standing.flatMap((a) =>
        a.front?.phase === 'march'
          ? [{ host: a.front.host, head: a.front.head, alpha: a.troops.alpha }]
          : [],
      )
      warning.draw(
        state,
        standing.flatMap((a) => (a.front ? [a.front] : [])),
        zoom,
      )
      roads.draw(state, marches, zoom)
      troops.draw(sides(), lines(), seconds)
      fallen.draw(seconds)
      label(zoom / far, legible(far))
    },
  }
}
