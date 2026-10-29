import { UNIT } from '../../engine'
import { makeStandard } from './layers/standard'
import { middle } from './squads'
import type { Container } from 'pixi.js'
import type { Host } from '../../engine'
import type { Squad } from './squads'
import type { Spot } from './fronts'

// The armies' standards (armies.ts): among each army's men its
// standard-bearer holds high its banner, its lord's arms and its men written
// on it (layers/standard.ts), following them and faded in and out with them;
// grown while the player points at it in his campaigns (« quand on hover ça
// la met en valeur »).

/** How much a standard pointed at in the campaigns grows. */
const LIT = 1.45

/** What a standard reads of its army (armies.ts): its men, how many, where its standard stood, whether the game still has it. */
type Army = {
  troops: Squad
  men: number
  flag: Spot | null
  gone: boolean
}

export function makeFlags(container: Container) {
  const standards = new Map<Army, ReturnType<typeof makeStandard>>()
  /** The army pointed at in the campaigns, by the village or market it left from; none. */
  let lit: number | null = null

  return {
    /** Each army's standard among its men, `zoom` the words' scale, `shown` how much they show. */
    place(
      armies: Map<Host, Army>,
      zoom: number,
      shown: number,
      seconds: number,
    ) {
      for (const [host, army] of armies) {
        const over = middle(army.troops.men)
        if (!over) continue
        const was = army.flag ?? over
        army.flag = {
          x: was.x + (over.x - was.x) * 0.2,
          y: was.y + (over.y - was.y) * 0.2,
        }
        let drawn = standards.get(army)
        if (!drawn) {
          drawn = makeStandard(army.troops.color, army.troops.look)
          standards.set(army, drawn)
          container.addChild(drawn.box)
        }
        const grown = host.from === lit && !army.gone
        drawn.box.alpha = army.troops.alpha
        drawn.box.position.set(army.flag.x, army.flag.y)
        drawn.box.scale.set(grown ? LIT : 1)
        if (grown) container.addChild(drawn.box)
        drawn.show(Math.floor(army.men / UNIT), zoom, shown, {
          walking: army.troops.men.some((m) => m.moving),
          face: army.troops.men[0]?.facing ?? 1,
          seconds,
        })
      }
    },
    /** Where the standard of an army stands, by the village or market it left from; none while it shows none. */
    flagOf(armies: Map<Host, Army>, from: number): Spot | null {
      for (const [host, army] of armies)
        if (host.from === from && !army.gone) return army.flag
      return null
    },
    /** The army to grow, by the village or market it left from; none. */
    light(from: number | null) {
      lit = from
    },
    /** An army forgotten: its standard with it. */
    forget(army: Army) {
      standards.get(army)?.box.destroy({ children: true })
      standards.delete(army)
    },
  }
}
