import {
  botsSetup,
  createBot,
  createGame,
  landOf,
  NO_ONE,
  RULES,
  step,
  TICKS_PER_SECOND,
  UNIT,
  capOf,
  worksOf,
} from '../engine'
import type { Level } from '../engine'

// The census: one game of bots, and every few minutes, for the lords
// standing, how much land they hold, how many villages, markets and castles
// they built, how many peasants their land and villages feed, and their
// gold. It says where the peasants come from and how the works pile up,
// which the arena does not; the figures of the rules are tuned on it.
// npx tsx scripts/census.ts [seed] [easy|normal|hard] [minutes between counts]
// LAND=60 VILLAGE=40 npx tsx scripts/census.ts … tries other figures for the
// peasants than the rules' (LAND=0 VILLAGE=100: the villages alone), and
// DOUBLINGS=… another most a work's price doubles.

const MINUTE = 60 * TICKS_PER_SECOND
const LIMIT = 40 * MINUTE

const seed = process.argv[2] ?? 'arena-0'
const level = (process.argv[3] ?? 'normal') as Level
const every = Number(process.argv[4] ?? 3) * MINUTE

const setup = botsSetup({ seed, level })
const { grid } = landOf(setup)
const peasants = {
  ...RULES.peasants,
  land: Number(process.env.LAND ?? RULES.peasants.land),
  village: Number(process.env.VILLAGE ?? RULES.peasants.village),
}
const priceDoublings = Number(process.env.DOUBLINGS ?? RULES.priceDoublings)
const rules = { ...RULES, peasants, priceDoublings }
const state = createGame(grid, setup, rules)
const bots = state.players.map((_, id) => createBot(id, seed, level))

const write = (text: string) => process.stdout.write(`${text}\n`)
const pad = (v: string | number, w: number) => String(v).padStart(w)
const median = (xs: Array<number>) =>
  [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? 0

/** The lords standing, by land, and the median and the first of each count. */
function count() {
  const lords = state.players
    .map((p, id) => ({ p, id }))
    .filter(({ p }) => p.alive && p.tiles > 0)
  const rows = lords.map(({ p, id }) => {
    const villages = worksOf(state, id, 'village')
    const cap = capOf(state, id) / UNIT
    const fromVillages = villages * peasants.village
    return {
      tiles: p.tiles,
      share: (p.tiles * 100) / state.grid.area,
      villages,
      markets: worksOf(state, id, 'market'),
      castles: worksOf(state, id, 'castle'),
      cap,
      land: cap - fromVillages,
      peasants: p.peasants / UNIT,
      gold: p.gold / UNIT,
    }
  })
  rows.sort((a, b) => b.tiles - a.tiles)
  const first = rows[0]
  const med = (key: keyof (typeof rows)[number]) =>
    median(rows.map((r) => r[key]))
  const line = (name: string, r: (typeof rows)[number] | null, m = false) =>
    write(
      [
        pad(name, 8),
        pad(m ? med('share').toFixed(1) : (r?.share ?? 0).toFixed(1), 6),
        pad(m ? med('villages') : (r?.villages ?? 0), 4),
        pad(m ? med('markets') : (r?.markets ?? 0), 4),
        pad(m ? med('castles') : (r?.castles ?? 0), 4),
        pad(Math.round(m ? med('land') : (r?.land ?? 0)), 6),
        pad(Math.round(m ? med('cap') : (r?.cap ?? 0)), 6),
        pad(Math.round(m ? med('peasants') : (r?.peasants ?? 0)), 6),
        pad(Math.round(m ? med('gold') : (r?.gold ?? 0)), 7),
      ].join(' '),
    )
  write(`— minute ${state.tick / MINUTE}, ${rows.length} lords standing`)
  line('first', first)
  line('median', null, true)
}

write(
  `Census: ${seed}, 20 ${level} bots, standard land, land ${peasants.land} village ${peasants.village}, ${priceDoublings} doublings`,
)
write('            % vil mkt cas   land    cap  peas.    gold')
while (state.winner === NO_ONE && state.tick < LIMIT) {
  step(
    state,
    state.players.flatMap((p, id) => (p.alive ? bots[id](state, id) : [])),
  )
  if (state.tick % every === 0) count()
}
const alive = state.players.filter((p) => p.alive).length
write(
  `End at minute ${(state.tick / MINUTE).toFixed(1)}: ${
    state.winner === NO_ONE ? 'unfinished' : `won (${alive} standing)`
  }`,
)
