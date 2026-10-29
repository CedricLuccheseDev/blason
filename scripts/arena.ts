import {
  botsSetup,
  createBot,
  createGame,
  landOf,
  MAP_SIZES,
  NEUTRAL,
  NO_ONE,
  RULES,
  step,
  TICKS_PER_SECOND,
} from '../engine'
import type { Generator, Host, Level, MapSize } from '../engine'

// The arena: twenty bots play whole games on a land of small
// tiles, and the arena tells how long an attack lasts, when the free land is
// gone, how far ahead the first is, how a game ends. It says whether the
// game turns; the pleasure is judged by playing. It also times the land's
// making and each tick (the bots' thinking and the step), and weighs the
// memory a game holds, which tells what a larger map costs.
// npm run arena -- [games] [players] [easy|normal|hard] [standard|large|huge] [classic|relief]
// RULES='{"volleyToll":3}' npm run arena … plays with other figures than the
// rules', laid over them (a figure's object, as peasants, given whole).

/** The rules played: the game's, with the figures RULES gives laid over them. */
const rules = {
  ...RULES,
  ...(JSON.parse(process.env.RULES ?? '{}') as Partial<typeof RULES>),
}

const SECOND = TICKS_PER_SECOND
const MINUTE = 60 * SECOND
const LIMIT = 40 * MINUTE

const median = (xs: Array<number>) => {
  if (xs.length === 0) return 0
  const sorted = [...xs].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

/** What the arena watches during a game, a tick at a time. */
function watcher(state: ReturnType<typeof createGame>) {
  const born = new Map<Host, number>()
  const lasted: Array<number> = []
  let owners = [...state.owner]
  let takes = 0
  let freeGone = -1
  let leaderAt10 = 0
  return {
    tick() {
      for (const host of state.hosts)
        if (!born.has(host)) born.set(host, state.tick)
      for (const [host, at] of born) {
        if (state.hosts.includes(host)) continue
        lasted.push((state.tick - at) / SECOND)
        born.delete(host)
      }
      state.owner.forEach((o, t) => {
        if (o !== owners[t] && owners[t] >= 0) takes++
      })
      owners = [...state.owner]
      const opened = state.tick > state.rules.openingTicks
      if (freeGone < 0 && opened && !owners.includes(NEUTRAL))
        freeGone = state.tick
      if (state.tick === 10 * MINUTE) {
        const held = state.players.map((p) => p.tiles)
        leaderAt10 = Math.max(...held) / state.grid.area
      }
    },
    result() {
      const sorted = [...lasted].sort((a, b) => a - b)
      return {
        freeGone: freeGone < 0 ? -1 : freeGone / MINUTE,
        leaderAt10,
        attack: median(lasted),
        attackLong: sorted[Math.floor(sorted.length * 0.9)] ?? 0,
        takesPerLordMinute:
          takes / state.players.length / (state.tick / MINUTE),
      }
    },
  }
}

const megabytes = () => process.memoryUsage().heapUsed / 1e6

function play(
  seed: string,
  players: number,
  level: Level,
  size: MapSize,
  generator: Generator,
) {
  const made = performance.now()
  // The opening as the rules played say, so that RULES may try another.
  const opening = rules.openingTicks
  const setup = botsSetup({ seed, size, level, lords: players, opening })
  const { grid } = landOf(setup, generator)
  const state = createGame(grid, setup, rules)
  const making = (performance.now() - made) / 1000
  const bots = state.players.map((_, id) => createBot(id, seed, level))
  const watch = watcher(state)
  let [busy, worst, heap] = [0, 0, megabytes()]
  while (state.winner === NO_ONE && state.tick < LIMIT) {
    const start = performance.now()
    step(
      state,
      state.players.flatMap((p, id) => (p.alive ? bots[id](state, id) : [])),
    )
    const spent = performance.now() - start
    busy += spent
    worst = Math.max(worst, spent)
    watch.tick()
    if (state.tick % MINUTE === 0) heap = Math.max(heap, megabytes())
  }
  const alive = state.players.filter((p) => p.alive).length
  let end = 'unfinished'
  if (state.winner !== NO_ONE) end = alive === 1 ? 'last standing' : 'share'
  const cost = { making, tick: busy / state.tick, worst, heap }
  return { seed, minutes: state.tick / MINUTE, end, cost, ...watch.result() }
}

const write = (text: string) => process.stdout.write(`${text}\n`)
const cols = (values: Array<string | number>, widths: Array<number>) =>
  values.map((v, i) => String(v).padStart(widths[i])).join(' ')
const WIDTHS = [9, 7, 10, 10, 7, 6, 15, 14, 8, 8, 8, 8]

const games = Number(process.argv[2] ?? 4)
const players = Number(process.argv[3] ?? 20)
const level = (process.argv[4] ?? 'normal') as Level
const size = (process.argv[5] ?? 'standard') as MapSize
const generator = (process.argv[6] ?? 'classic') as Generator
if (!(size in MAP_SIZES)) throw new Error(`No map size ${size}`)
write(
  `Arena: ${games} games of ${players} ${level} bots on a ${size} land of small tiles, by the ${generator} generator${process.env.RULES ? `, with ${process.env.RULES}` : ''}`,
)
write(
  cols(
    [
      'seed',
      'length',
      'free gone',
      '1st at 10',
      'attack',
      '90%',
      'takes/lord/min',
      'end',
      'land s',
      'ms/tick',
      'worst',
      'heap MB',
    ],
    WIDTHS,
  ),
)
for (let i = 0; i < games; i++) {
  const r = play(`arena-${i}`, players, level, size, generator)
  const leader = Math.round(r.leaderAt10 * 100)
  write(
    cols(
      [
        r.seed,
        r.minutes.toFixed(1),
        r.freeGone.toFixed(1),
        leader + ' %',
        r.attack.toFixed(1) + ' s',
        r.attackLong.toFixed(0) + ' s',
        r.takesPerLordMinute.toFixed(1),
        r.end,
        r.cost.making.toFixed(1),
        r.cost.tick.toFixed(1),
        r.cost.worst.toFixed(0),
        r.cost.heap.toFixed(0),
      ],
      WIDTHS,
    ),
  )
}
