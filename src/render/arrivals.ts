import { UNIT, relayGold } from '../../engine'
import type { Caravan, GameState } from '../../engine'

// The caravans that paid the player since the last reading: gone from the
// roads having reached the end of theirs, his market at one end, worth a
// whole coin at least (« j'ai des +0 avec les marchands »). Said where his
// market is, once for a caravan between two markets of his; and each village
// a caravan passed by as a relay, his village or his caravan, said where the
// village is. Read by the "+" of gold on the map.

export type Arrival = { tile: number; gold: number }

export function makeArrivals(me: number) {
  let seen = new Map<Caravan, number>()
  /** The relays each caravan had paid at the last reading. */
  const stopped = new WeakMap<Caravan, number>()

  /** The relays paid since the last reading that paid the player. */
  function relays(state: GameState, arrived: Array<Arrival>) {
    for (const c of state.caravans) {
      const stops = c.stops ?? []
      const before = stopped.get(c) ?? 0
      stopped.set(c, stops.length)
      for (const tile of stops.slice(before)) {
        const village = state.works.find(
          (w) => w.tile === tile && w.work === 'village',
        )
        if (!village || (village.owner !== me && c.owner !== me)) continue
        const gold = Math.floor(relayGold(state, c.owner, village.owner) / UNIT)
        if (gold >= 1) arrived.push({ tile, gold })
      }
    }
  }

  return {
    /** The arrivals since the last reading, `ticks` ago. */
    read(state: GameState, ticks: number): Array<Arrival> {
      const arrived: Array<Arrival> = []
      const out = new Set(state.caravans)
      for (const [caravan, along] of seen) {
        if (out.has(caravan)) continue
        const last = caravan.road.length - 1
        if (along + state.rules.caravanPace * ticks < last * 1000) continue
        const gold = Math.floor(caravan.gold / UNIT)
        if (gold < 1) continue
        if (caravan.to === me) arrived.push({ tile: caravan.road[last], gold })
        else if (caravan.owner === me)
          arrived.push({ tile: caravan.road[0], gold })
      }
      seen = new Map(state.caravans.map((c) => [c, c.along]))
      relays(state, arrived)
      return arrived
    },
  }
}
