import { ARMY_KEYS, COUP_KEYS, WORK_KEYS } from './keys'
import type { Army, Coup, Order, Work } from '../../engine'

// What the player holds in hand: always an army, the one a click on
// another's land raises; over it, at most one work, which a click on his own
// land builds, or one coup, which a click on the land launches. Taking one
// puts the other down; Escape, or a click that sent it, puts it down.

export type Hand = { army: Army; work: Work | null; coup: Coup | null }

export function makeHand() {
  const hand: Hand = { army: 'host', work: null, coup: null }
  const drop = () => {
    hand.work = null
    hand.coup = null
  }
  return {
    hand,
    choose(army: Army) {
      hand.army = army
      drop()
    },
    hold(work: Work | null) {
      drop()
      hand.work = work
    },
    aim(coup: Coup | null) {
      drop()
      hand.coup = coup
    },
    /** Whether a work or a coup is in hand, over the army. */
    holding: () => hand.work !== null || hand.coup !== null,
    /** A key pressed: whether it changed what is in hand. A key again puts it down. */
    key(key: string): boolean {
      if (key === 'Escape') {
        drop()
        return true
      }
      const army = ARMY_KEYS[key]
      const work = WORK_KEYS[key]
      const coup = COUP_KEYS[key]
      if (army) this.choose(army)
      else if (work) this.hold(hand.work === work ? null : work)
      else if (coup) this.aim(hand.coup === coup ? null : coup)
      return Boolean(army ?? work ?? coup)
    },
    /** What a click on a tile sends, with what is in hand; a work or a coup sent is put down. */
    order(player: number, tile: number): Order {
      const { work, coup, army } = hand
      drop()
      if (work) return { player, type: 'build', tile, work }
      if (coup) return { player, type: 'coup', tile, coup }
      return { player, type: 'attack', tile, army }
    },
  }
}
