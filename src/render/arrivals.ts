import { UNIT } from '../../engine'
import type { Caravan, GameState } from '../../engine'

// The caravans that paid the player since the last reading: gone from the
// roads having reached the end of theirs, his market at one end, worth a
// whole coin at least (« j'ai des +0 avec les marchands »). Said where his
// market is, once for a caravan between two markets of his. The "+" of gold
// on the map and the coins heard read them alike.

export type Arrival = { tile: number; gold: number }

export function makeArrivals(me: number) {
  let seen = new Map<Caravan, number>()

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
      return arrived
    },
  }
}
