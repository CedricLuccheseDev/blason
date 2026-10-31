import type { Army, Coup } from '../../../engine'

// What each army's seal and each coup's lozenge bears, on the bar and wherever
// else they are shown (the cartouche, the campaigns, the pennants).

/** The drawing pressed in each army's seal: its men, one, two or three, as its share grows; the mercenaries a man and his gold. */
export const ARMY_MARKS = {
  raid: 'troop1',
  host: 'troop2',
  ban: 'troop3',
  mercenaries: 'hireling',
} as const satisfies Record<Army, string>

/**
 * The armies whose seal has a wax of its own, whatever hand it is in, where
 * the others' is parchment, or the lord's colour in hand: the mercenaries'
 * gold, paid in gold, apart at a glance from the three levied from his
 * peasants. One more army paid otherwise is one more entry here.
 */
export const ARMY_WAX: Partial<Record<Army, string>> = {
  mercenaries: 'var(--color-gilt)',
}

/** The drawing in each coup's lozenge: its shape says which before its colour does. */
export const COUP_MARKS = {
  troublemaker: 'torch',
  archers: 'bow',
  trebuchet: 'trebuchet',
} as const satisfies Record<Coup, string>
