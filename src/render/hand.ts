import { ARMY_KEYS, COUP_KEYS, FLEET_KEY, WORK_KEYS } from './keys'
import type { Army, Coup, Order, Work } from '../../engine'

// What the player holds in hand: always an army, the one a click on
// another's land raises; over it, at most one work, which a click on his own
// land builds, or one coup, which a click on the land launches, or a
// warship to fit out, which a click on the water sends there from his
// nearest port, or one of his warships, picked on the water, which a click
// sends elsewhere. Taking one puts the other down; Escape, or a click that
// sent it, puts it down.

export type Hand = {
  army: Army
  work: Work | null
  coup: Coup | null
  /** A warship to fit out. */
  fleet: boolean
  /** One of his warships, by its number, to send. */
  ship: number | null
}

export function makeHand() {
  const hand: Hand = {
    army: 'host',
    work: null,
    coup: null,
    fleet: false,
    ship: null,
  }
  const drop = () => {
    hand.work = null
    hand.coup = null
    hand.fleet = false
    hand.ship = null
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
    /** A warship to fit out taken in hand, or put down. */
    fit(fleet: boolean) {
      drop()
      hand.fleet = fleet
    },
    /** One of his warships picked, to send by the next click. */
    pick(ship: number) {
      drop()
      hand.ship = ship
    },
    /** Whether a work, a coup or a warship is in hand, over the army. */
    holding: () =>
      hand.work !== null ||
      hand.coup !== null ||
      hand.fleet ||
      hand.ship !== null,
    /** A key pressed: whether it changed what is in hand. A key again puts it down. */
    key(key: string): boolean {
      if (key === 'Escape') {
        drop()
        return true
      }
      const army = ARMY_KEYS[key]
      const work = WORK_KEYS[key.toLowerCase()]
      const coup = COUP_KEYS[key]
      const fleet = key.toLowerCase() === FLEET_KEY
      if (army) this.choose(army)
      else if (work) this.hold(hand.work === work ? null : work)
      else if (coup) this.aim(hand.coup === coup ? null : coup)
      else if (fleet) this.fit(!hand.fleet)
      return Boolean(army ?? work ?? coup) || fleet
    },
    /** What a click on a tile sends, with what is in hand; a work or a coup sent is put down. */
    order(player: number, tile: number): Order {
      const { work, coup, army, fleet, ship } = hand
      drop()
      if (work) return { player, type: 'build', tile, work }
      if (coup) return { player, type: 'coup', tile, coup }
      if (fleet) return { player, type: 'warship', tile }
      if (ship !== null) return { player, type: 'sail', tile, ship }
      return { player, type: 'attack', tile, army }
    },
  }
}
