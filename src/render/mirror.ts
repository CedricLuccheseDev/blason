import type { GameState } from '../../engine'

// The game played in its own thread (sim.worker.ts) and drawn in the page
// (« le jeu doit etre le plus fluide possible », « go la simulation dans un
// fil a part »): after each step the thread sends what moved, the page
// lays it on its mirror of the game. The tiles that changed hands, and the
// lists of what lives on the land, each thing under a number of its own, so
// that the page keeps each army, work or caravan the same object from one
// step to the next, as the drawing and the sound know them by it. What the
// page never reads stays in the thread: an army's queue of tiles to take.

/** What lives on the land, sent whole each step, each thing by its number. */
const LISTS = [
  'works',
  'players',
  'hosts',
  'alliances',
  'requests',
  'offerings',
  'caravans',
  'strikes',
  'scars',
] as const

type List = (typeof LISTS)[number]

/** A thing as sent: its number, its fields that changed or are plain, and the names of the others it still has as last sent. */
type Sent = [number, Record<string, unknown>, Array<string>]

/** A step's moves: its tick and winner, the tiles that changed hands as pairs (tile, owner), and each list, each thing as sent. */
export type Delta = {
  tick: number
  winner: number
  owner: Int32Array
  lists: Record<List, Array<Sent>>
}

/** In the thread: what moved since the last step, read off the game. */
export function makeDiffer(state: GameState) {
  const ids = new WeakMap<object, number>()
  let next = 1
  let last = Int32Array.from(state.owner)
  const idOf = (thing: object) => {
    let id = ids.get(thing)
    if (id === undefined) {
      id = next++
      ids.set(thing, id)
    }
    return id
  }
  /** Each thing's lists and parts as last sent, written out: one unchanged is not sent again (a road of hundreds of tiles, ten times a second, was garbage for the page to clear, and it stuttered). */
  const written = new WeakMap<object, Map<string, string>>()
  /** A thing's fields as the page reads them: its plain values, its lists and parts only when they changed, and the names of those kept. */
  function fieldsOf(list: List, thing: object): Sent {
    const id = idOf(thing)
    let known = written.get(thing)
    if (!known) {
      known = new Map()
      written.set(thing, known)
    }
    const fields: Record<string, unknown> = {}
    const kept: Array<string> = []
    for (const [key, value] of Object.entries(thing)) {
      if (list === 'hosts' && key === 'queue') {
        fields.queue = []
        continue
      }
      if (value === null || typeof value !== 'object') {
        fields[key] = value
        continue
      }
      const text = JSON.stringify(value)
      if (known.get(key) === text) kept.push(key)
      else {
        known.set(key, text)
        fields[key] = value
      }
    }
    return [id, fields, kept]
  }

  return {
    /** The game made anew in place (a host's launch, a game begun again): every tile and thing sent again. */
    reset() {
      last = new Int32Array(state.owner.length).fill(-1 << 30)
    },
    delta(): Delta {
      const moved: Array<number> = []
      state.owner.forEach((o, t) => {
        if (last[t] === o) return
        last[t] = o
        moved.push(t, o)
      })
      const lists = {} as Delta['lists']
      for (const list of LISTS)
        lists[list] = (state[list] as Array<object>).map((thing) =>
          fieldsOf(list, thing),
        )
      return {
        tick: state.tick,
        winner: state.winner,
        owner: Int32Array.from(moved),
        lists,
      }
    },
  }
}

/** In the page: the mirror of the game, each step's moves laid on it in place. */
export function makeMirror(state: GameState) {
  const things = new Map<number, Record<string, unknown>>()

  return {
    apply(delta: Delta) {
      state.tick = delta.tick
      state.winner = delta.winner
      const { owner } = delta
      for (let i = 0; i < owner.length; i += 2)
        state.owner[owner[i]] = owner[i + 1]
      const seen = new Set<number>()
      for (const list of LISTS) {
        const items = delta.lists[list].map(([id, fields, kept]) => {
          seen.add(id)
          const known = things.get(id)
          if (!known) {
            things.set(id, fields)
            return fields
          }
          for (const key of Object.keys(known))
            if (!(key in fields) && !kept.includes(key))
              Reflect.deleteProperty(known, key)
          return Object.assign(known, fields)
        })
        ;(state as Record<List, unknown>)[list] = items
      }
      for (const id of things.keys()) if (!seen.has(id)) things.delete(id)
    },
  }
}
