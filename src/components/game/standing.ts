import type { Standing } from '../hud/Standing'
import type { Messages } from '~/i18n/en'

/** How a lord stands with the player, as the HUD reads it: allied, at war, a felon (any of them at once). */
type Bonds = { allied: boolean; atWar: boolean; felon: boolean }

/** The badges a lord wears beside his name, each with its word: his alliance, his war, his felony. */
export function standingsOf(
  lord: Bonds,
  m: Messages,
): Array<{ standing: Standing; label: string }> {
  return [
    lord.allied && { standing: 'ally' as const, label: m.lord.allied },
    lord.atWar && { standing: 'foe' as const, label: m.lord.atWar },
    lord.felon && { standing: 'felon' as const, label: m.lord.felon },
  ].filter((s) => s !== false)
}
