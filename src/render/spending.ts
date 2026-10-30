import type { GameState } from '../../engine'

// What the player spends, read every frame so that the HUD tells it at once
// rather than at the next second (« quand je construit un batiment le panel
// en bas ne se met pas a jour immédiatement sur l'argent »): his gold fallen,
// his works or his armies in a different number.

export function makeSpending(state: GameState, me: number) {
  let last = { gold: 0, works: -1, hosts: -1 }
  return {
    /** Whether he spent since the last frame. */
    changed(): boolean {
      if (me < 0) return false
      let works = 0
      for (const w of state.works) if (w.owner === me) works++
      let hosts = 0
      for (const h of state.hosts) if (h.owner === me) hosts++
      const { gold } = state.players[me]
      const spent =
        gold < last.gold || works !== last.works || hosts !== last.hosts
      last = { gold, works, hosts }
      return spent
    },
  }
}
