import {
  createBot,
  createGame,
  generateWorld,
  makeGrid,
  NEUTRAL,
  NO_ONE,
  RULES,
  step,
  TICKS_PER_SECOND,
} from '../engine'
import type { Host, Level } from '../engine'

// The arena: twenty bots play whole games on a land of small
// tiles, and the arena tells how long an attack lasts, when the free land is
// gone, how far ahead the first is, how a game ends. It says whether the
// game turns; the pleasure is judged by playing.
// npm run arena -- [games] [players] [easy|normal|hard]

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

function play(seed: string, players: number, level: Level) {
  const world = generateWorld(seed)
  const grid = makeGrid(world.map, world.width, world.height, RULES.tileSize)
  const state = createGame(grid, players, seed)
  const bots = state.players.map((_, id) => createBot(id, seed, level))
  const watch = watcher(state)
  while (state.winner === NO_ONE && state.tick < LIMIT) {
    step(
      state,
      state.players.flatMap((p, id) => (p.alive ? bots[id](state, id) : [])),
    )
    watch.tick()
  }
  const alive = state.players.filter((p) => p.alive).length
  let end = 'unfinished'
  if (state.winner !== NO_ONE) end = alive === 1 ? 'last standing' : 'share'
  return { seed, minutes: state.tick / MINUTE, end, ...watch.result() }
}

const write = (text: string) => process.stdout.write(`${text}\n`)
const cols = (values: Array<string | number>, widths: Array<number>) =>
  values.map((v, i) => String(v).padStart(widths[i])).join(' ')
const WIDTHS = [9, 7, 10, 10, 7, 6, 15, 14]

const games = Number(process.argv[2] ?? 4)
const players = Number(process.argv[3] ?? 20)
const level = (process.argv[4] ?? 'normal') as Level
write(
  `Arena: ${games} games of ${players} ${level} bots on a land of small tiles`,
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
    ],
    WIDTHS,
  ),
)
for (let i = 0; i < games; i++) {
  const r = play(`arena-${i}`, players, level)
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
      ],
      WIDTHS,
    ),
  )
}
