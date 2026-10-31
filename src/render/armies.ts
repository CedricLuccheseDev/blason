import { Container } from 'pixi.js'
import { UNIT, isFriendly } from '../../engine'
import { GAP, makeFronts } from './fronts'
import { makeRoads, pathOf } from './layers/column'
import { afloatOf, makeBoats } from './layers/boats'
import { makeFallen } from './layers/fallen'
import { linesOf, makeTroops } from './layers/troops'
import { makeWarning } from './layers/warning'
import { makeFlags } from './flags'
import { TONE, playerColor } from './palette'
import { legible } from './ease'
import { figuresOf, lose, makeSquad, middle, rally } from './squads'
import { ARMY_LOOKS, warmFigures } from './figures'
import type { makeWakes } from './layers/wakes'
import type { Front, Spot } from './fronts'
import type { Drawn } from './layers/troops'
import type { Man, Shape, Squad } from './squads'
import type { Box } from './camera'
import type { GameState, Host } from '../../engine'

// The armies, as one picture. Each army is a few men kept from frame to
// frame (squads.ts) who walk its road in a column, then stand in ranks at
// the point its attack has reached and follow it as it goes (fronts.ts), the peasants of the land
// facing them with their pitchforks; when two armies fight, both run to the
// ground between them and face each other there. Men lost fall where they
// stand (layers/fallen.ts); a side comes and goes in a fade. Among each
// army's men, its standard-bearer holds high its banner, its lord's arms and
// its men written on it (flags.ts). An enemy army coming for the player is
// shown from afar (layers/warning.ts).

/** Seconds for an army to fade in or out. */
const FADE = 0.5
type Army = {
  troops: Squad
  peasants: Squad
  /** How much it shows as a boat, its men aboard: 1 at sea, 0 ashore (layers/boats.ts). */
  afloat: number
  /** Its men at the last tick read, and its place this frame; gone once the game no longer has it. */
  men: number
  front: Front | null
  flag: Spot | null
  gone: boolean
}

/** Whether an army's head is on the water of its road (crossing.ts). */
const atSea = (state: GameState, host: Host, head: number) =>
  state.grid.water[host.road[Math.min(host.road.length - 1, Math.round(head))]]

/** The colour of the peasants who hold a land: their lord's, or the free land's. */
const peasantColor = (owner: number) =>
  owner >= 0 ? playerColor(owner) : TONE.neutralPill

/** An army as it is first seen: no men yet, they walk in. */
const enlist = (host: Host): Army => ({
  troops: makeSquad(ARMY_LOOKS[host.army], playerColor(host.owner)),
  peasants: makeSquad('peasant', peasantColor(host.target)),
  afloat: 0,
  men: host.men,
  front: null,
  flag: null,
  gone: false,
})

export function makeArmies(
  me: number,
  wakes: ReturnType<typeof makeWakes>,
  underWoods?: (x: number, y: number) => boolean,
) {
  warmFigures()
  const container = new Container()
  const roads = makeRoads()
  const fallen = makeFallen(0.2)
  const troops = makeTroops(underWoods)
  const boats = makeBoats(wakes)
  const warning = makeWarning(me)
  container.addChild(
    warning.container,
    roads.container,
    fallen.container,
    boats.container,
    troops.container,
  )
  const fronts = makeFronts()
  const armies = new Map<Host, Army>()
  const flags = makeFlags(container)
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

  /** Each man of the army a frame closer to his place: in a column on the march, in ranks at the front or in battle; gathered aboard at sea, its boat shown for them. */
  function place(state: GameState, host: Host, army: Army, dt: number) {
    const front = army.front as Front
    const sailing = front.phase === 'march' && atSea(state, host, front.head)
    const shape: Shape =
      front.phase === 'march' && !sailing
        ? { line: 'column', path: pathOf(state, host), head: front.head }
        : { line: 'ranks', at: front.at, facing: front.facing }
    rally(army.troops, figuresOf(host.men / UNIT), shape, dt)
    // Aboard, its men go with the boat, its standard over it.
    if (sailing) for (const man of army.troops.men) Object.assign(man, front.at)
    const step = dt / FADE
    army.troops.alpha = Math.max(
      0,
      Math.min(1, army.troops.alpha + (sailing ? -step : step)),
    )
    army.afloat = Math.max(
      0,
      Math.min(1, army.afloat + (sailing ? step : -step)),
    )
    defend(state, host, army, dt)
  }

  /** An army the game no longer has fades out where it stood, then is forgotten. */
  function dismiss(host: Host, army: Army, dt: number) {
    army.gone = true
    army.troops.alpha = Math.max(0, army.troops.alpha - dt / FADE)
    army.peasants.alpha = Math.max(0, army.peasants.alpha - dt / FADE)
    if (army.troops.alpha > 0) return
    armies.delete(host)
    flags.forget(army)
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

  /** Every side drawn: each army's men, and the peasants before it. */
  function sides(): Array<Drawn> {
    return [...armies.values()].flatMap((a) => [
      { squad: a.troops, fighting: a.front?.phase !== 'march' },
      ...(a.peasants.alpha > 0 ? [{ squad: a.peasants, fighting: true }] : []),
    ])
  }

  return {
    container,
    /** Where an army's men stand this frame, their middle; none while it shows none. */
    menOf(host: Host): Spot | null {
      const army = armies.get(host)
      return army ? middle(army.troops.men) : null
    },
    /** Where the standard of an army stands, by the village or market it left from; none while it shows none. */
    flagOf: (from: number) => flags.flagOf(armies, from),
    /** The army to grow, by the village or market it left from; none. */
    light: flags.light,
    /** `far`: under 1 farther out than the whole land, where the standards shrink with it; `view`, the map on screen; `strategic`, how much the map is the strategist's, where an army is its standard alone (ground/detail.ts). */
    draw(
      state: GameState,
      zoom: number,
      view: Box,
      between = 0,
      far = 1,
      strategic = 0,
    ) {
      const seconds = performance.now() / 1000
      const dt = Math.min(0.1, seconds - last)
      last = seconds
      follow(state, between, dt)
      const standing = [...armies.values()].filter((a) => !a.gone)
      // The roads my armies and my allies' march, no other's (« il ne faut
      // pas voir les traceurs des armées des autres joueurs à part les
      // alliés »).
      const marches = standing.flatMap((a) =>
        a.front?.phase === 'march' && isFriendly(state, me, a.front.host.owner)
          ? [
              {
                host: a.front.host,
                head: a.front.head,
                alpha: Math.max(a.troops.alpha, a.afloat),
              },
            ]
          : [],
      )
      warning.draw(
        state,
        standing.flatMap((a) => (a.front ? [a.front] : [])),
        zoom,
      )
      roads.draw(state, marches, zoom)
      // From afar the men fade out, their standards stay (« les etendard
      // sans l'armée »); not drawn at all once gone.
      const men = 1 - strategic
      for (const layer of [troops, fallen, boats]) {
        layer.container.alpha = men
        layer.container.visible = men > 0
      }
      if (men > 0) {
        troops.draw(sides(), linesOf(armies), seconds, view)
        fallen.draw(seconds)
        boats.draw(afloatOf(armies))
      }
      flags.place(armies, zoom / far, legible(far), seconds)
    },
  }
}
