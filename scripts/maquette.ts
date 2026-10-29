import { mkdirSync, writeFileSync } from 'node:fs'
import {
  around,
  createBot,
  createGame,
  generateWorld,
  isAllied,
  makeGrid,
  NEUTRAL,
  NO_ONE,
  RULES,
  stateHash,
  step,
  TICKS_PER_SECOND,
} from '../engine'
import { restoreGame, saveGame } from '../src/render/save'
import { summarize } from '../src/render/summary'
import type { GameState, Host, Level, MapSize } from '../engine'
import type { Save, Shot } from '../src/render/save'

// The maquette's moments, saved: one game of twenty bots played without a
// screen, and at each moment the design is drawn on, its state written to
// public/saves/<name>.json, seen from a seat and with a camera, which
// /play?save=<name> shows held still (src/render/save.ts). Each moment is
// taken at the first tick from its own where the game shows it: an offer
// made to a lord, an alliance in its last seconds, an army fighting. A save
// is read back before it is written, and must give the same game and the
// same HUD as the game played; the game is played on to its end, the tick it
// is won. design/maquette takes the captures from them.
// npm run maquette -- [seed] [easy|normal|hard] [standard|large|huge]

const SECOND = TICKS_PER_SECOND
const MINUTE = 60 * SECOND
/** The game is played until its end, never longer than this. */
const LIMIT = 60 * MINUTE

/** What a moment shows: from which seat, and where the camera stands. */
type View = { me: number; camera: Shot }

type Moment = {
  name: string
  /** The first tick it may be taken at. */
  from: number
  /** The seat and the camera, should the game show the moment at this tick. */
  find: (state: GameState) => View | null
}

const lords = (state: GameState) =>
  state.players.flatMap((p, id) => (p.alive && p.tiles > 0 ? [id] : []))

/** The lord standing with the median land: a player neither first nor last. */
function middling(state: GameState): number {
  const standing = lords(state).sort(
    (a, b) => state.players[a].tiles - state.players[b].tiles,
  )
  return standing[Math.floor(standing.length / 2)] ?? 0
}

/** How late a neighbour's land comes: a lord the player may strike first, an ally next, free land last. */
const rankOf = (state: GameState, me: number, owner: number) =>
  owner === NEUTRAL ? 2 : Number(isAllied(state, me, owner))

/** The tile of another's land on a lord's border nearest his land's middle, a lord's he may strike before an ally's or a free one. */
function borderTile(state: GameState, me: number): number {
  const { width } = state.grid
  const mine = state.owner.flatMap((o, t) => (o === me ? [t] : []))
  const mx = mine.reduce((s, t) => s + (t % width), 0) / mine.length
  const my = mine.reduce((s, t) => s + Math.floor(t / width), 0) / mine.length
  const far = (t: number) =>
    Math.hypot((t % width) - mx, Math.floor(t / width) - my)
  let best = { tile: -1, score: Infinity }
  for (const t of mine)
    for (const n of around(state.grid, t)) {
      const o = state.owner[n]
      if (o === me || o < NEUTRAL) continue
      const score = far(n) + 1000 * rankOf(state, me, o)
      if (score < best.score) best = { tile: n, score }
    }
  return best.tile
}

/** The lord standing with the most land after the winner: the end as a loser sees it. */
function runnerUp(state: GameState): number | undefined {
  return lords(state)
    .filter((id) => id !== state.winner)
    .sort((a, b) => state.players[b].tiles - state.players[a].tiles)[0]
}

/** The army fighting with the most men, of a lord standing. */
function fiercest(state: GameState): Host | null {
  const fighting = state.hosts.filter(
    (h) => h.fighting && h.edge.length > 0 && state.players[h.owner].alive,
  )
  return fighting.sort((a, b) => b.men - a.men)[0] ?? null
}

const MOMENTS: Array<Moment> = [
  // The opening's count, the standards planted, the whole land.
  {
    name: 'opening',
    from: 6 * SECOND,
    find: () => ({ me: 0, camera: 'land' }),
  },
  // Three minutes in, the pointer on a neighbour's land, one he may strike
  // (the capture puts it at the middle of the screen).
  {
    name: 'minute-3',
    from: 3 * MINUTE,
    find(state) {
      const tile = state.players[0].alive ? borderTile(state, 0) : -1
      return tile < 0 ? null : { me: 0, camera: { tile, perTile: 14 } }
    },
  },
  // An offer of alliance just come to a lord.
  {
    name: 'offer',
    from: 4 * MINUTE,
    find(state) {
      const fresh = state.rules.requestTicks - 3 * SECOND
      const offer = state.requests.find(
        (r) =>
          r.expires - state.tick >= fresh &&
          state.players[r.to].alive &&
          state.players[r.from].alive,
      )
      return offer ? { me: offer.to, camera: 'home' } : null
    },
  },
  // An alliance just come to its last seconds, neither lord renewing yet.
  {
    name: 'renew',
    from: 6 * MINUTE,
    find(state) {
      const { renewTicks } = state.rules
      const closing = state.alliances.find((x) => {
        const left = x.expires - state.tick
        const come = left <= renewTicks && left > renewTicks - 5 * SECOND
        return come && !x.renewA && !x.renewB && state.players[x.a].alive
      })
      return closing ? { me: closing.a, camera: 'home' } : null
    },
  },
  // A war up close: the fiercest fight on the land, from its lord's seat.
  {
    name: 'war',
    from: 8 * MINUTE,
    find(state) {
      const host = fiercest(state)
      if (!host || host.men < 50_000) return null
      const tile = host.edge[Math.floor(host.edge.length / 2)]
      return { me: host.owner, camera: { tile, perTile: 30 } }
    },
  },
  // The strategic map: the whole land at twenty minutes.
  {
    name: 'strategic',
    from: 20 * MINUTE,
    find: (state) => ({ me: middling(state), camera: 'land' }),
  },
  // The end, the tick the game is won: the whole land from the winner's
  // seat, and from the seat of the lord who came nearest.
  {
    name: 'end',
    from: 0,
    find: (state) =>
      state.winner === NO_ONE ? null : { me: state.winner, camera: 'land' },
  },
  {
    name: 'end-lost',
    from: 0,
    find(state) {
      const me = state.winner === NO_ONE ? undefined : runnerUp(state)
      return me === undefined ? null : { me, camera: 'land' }
    },
  },
]

const seed = process.argv[2] ?? 'maquette'
const level = (process.argv[3] ?? 'normal') as Level
const size = (process.argv[4] ?? 'standard') as MapSize
const out = 'public/saves'
mkdirSync(out, { recursive: true })

const write = (text: string) => process.stdout.write(`${text}\n`)

/** A save read back must be the game it was made from, and show the same HUD. */
function check(
  name: string,
  state: GameState,
  grid: ReturnType<typeof makeGrid>,
  save: Save,
) {
  const back = restoreGame(grid, JSON.parse(JSON.stringify(save)) as Save)
  const hand = { army: 'host', work: null, coup: null } as const
  const same =
    stateHash(back) === stateHash(state) &&
    JSON.stringify(summarize(back, save.me, hand)) ===
      JSON.stringify(summarize(state, save.me, hand))
  if (!same) throw new Error(`The save ${name} does not give its game back`)
}

const world = generateWorld(seed, { size })
const grid = makeGrid(world.map, world.width, world.height, RULES.tileSize)
const state = createGame(grid, 20, seed)
const bots = state.players.map((_, id) => createBot(id, seed, level))
const waiting = [...MOMENTS]
write(`Maquette: the moments of ${seed}, ${level} bots on a ${size} land`)
while (waiting.length > 0 && state.winner === NO_ONE && state.tick < LIMIT) {
  step(
    state,
    state.players.flatMap((p, id) => (p.alive ? bots[id](state, id) : [])),
  )
  for (const moment of [...waiting]) {
    const view = state.tick >= moment.from ? moment.find(state) : null
    if (!view) continue
    waiting.splice(waiting.indexOf(moment), 1)
    const save = saveGame(state, grid, { size, level, ...view })
    check(moment.name, state, grid, save)
    const text = JSON.stringify(save)
    writeFileSync(`${out}/${moment.name}.json`, text)
    const at = `${Math.floor(state.tick / MINUTE)}:${String(Math.floor(state.tick / SECOND) % 60).padStart(2, '0')}`
    write(
      `${moment.name.padEnd(10)} at ${at}, seat ${view.me}, ${(text.length / 1024).toFixed(0)} KB`,
    )
  }
}
for (const moment of waiting) write(`${moment.name.padEnd(10)} never came`)
