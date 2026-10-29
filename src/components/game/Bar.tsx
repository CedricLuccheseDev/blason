import { CoupEmblem, MedallionEmblem, SealEmblem } from '../hud/Emblem'
import { Figure } from '../hud/Figure'
import { useCompact } from '../hud/useCompact'
import { useFit } from '../hud/useFit'
import { count, hex } from './format'
import { Divide, Piece } from './BarPiece'
import type { Army, Coup, Work } from '../../../engine'
import type { Summary } from '~/render/client'
import { keyAt } from '~/render/keys'
import { useMessages } from '~/i18n'

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
  fire: 'firepot',
} as const satisfies Record<Coup, string>

/** The bar's forms, from as drawn to the most compact, each tried in turn until one fits its room: one row; one row, its pieces closer; on rows, as on a phone. */
const FITS = ['drawn', 'tight', 'rows'] as const

/** Each form's band, the rows laid wrapped and centred, and the room between its pieces, their keys clear of the next. */
const FORMS: Record<(typeof FITS)[number], { band: string; gap: string }> = {
  drawn: { band: 'px-4', gap: 'gap-3' },
  tight: { band: 'px-3', gap: 'gap-1' },
  rows: {
    band: 'flex-wrap justify-center gap-x-2 gap-y-1 px-3',
    gap: 'gap-1',
  },
}

/**
 * The armies at the bar's head: their seals in a row, each with its figure
 * under it as the works have their price, the share of the peasants a levy
 * takes, the gold the mercenaries would cost (« affiche les % en dessous des
 * chevauchées »); under the row the one in hand, named, with its men.
 */
function Armies({
  summary,
  gap,
  onArmy,
}: Readonly<{
  summary: Summary
  gap: string
  onArmy: (army: Army) => void
}>) {
  const m = useMessages()
  const { me } = summary
  if (!me) return null
  return (
    <div className="flex flex-col items-center">
      <div className={`flex items-start ${gap}`}>
        {summary.armies.map((a, i) => {
          const held = !summary.work && !summary.coup && a.army === summary.army
          const wax = held ? hex(me.color) : 'var(--color-vellum)'
          return (
            <Piece
              key={a.army}
              k={keyAt(i + 1)}
              name={m.game.armies[a.army]}
              hint={[m.hints.armies.men(count(a.men)), m.hints.armies[a.army]]}
              held={held}
              // An army that would take no man: the mercenaries without the gold for one.
              faint={a.men === 0 && !held}
              onClick={() => onArmy(a.army)}
              figure={
                a.share === null ? (
                  <Figure icon="coins" size="m">
                    {count(a.gold ?? 0)}
                  </Figure>
                ) : (
                  <Figure size="m">{m.game.percent(a.share)}</Figure>
                )
              }
              emblem={
                <SealEmblem
                  icon={ARMY_MARKS[a.army]}
                  color={ARMY_WAX[a.army] ?? wax}
                  size="s"
                  held={held}
                />
              }
            />
          )
        })}
      </div>
    </div>
  )
}

/**
 * At the bottom in the middle, every action, floating on the map with no
 * band under it (« essaie de mettre toutes les actions au milieu »; the purse
 * goes bottom left): the four armies as wax seals in a row, the three levied
 * from the peasants at a village, the mercenaries hired at a market in gold,
 * the one in hand raised and named under the row with its figures; then the
 * three works as gilt medallions and the three coups as lozenges ringed in
 * gules, each with its price alone, in gules when it cannot be paid, then at
 * half ink: half ink says only that, never where the pointer is, so that no
 * one thinks he lacks the gold when he does not. No other word: a piece's
 * name is said under the pointer. Keys 1 to 4, 5 to 7, then 8, 9 and 0. It
 * keeps within the screen, its room measured: when it lacks it, its pieces
 * and its rules come closer, then it is laid as on a phone, on rows: the
 * purse on its own, then the armies, the works and the coups as they fit.
 */
export function Bar({
  summary,
  onArmy,
  onWork,
  onCoup,
}: Readonly<{
  summary: Summary
  onArmy: (army: Army) => void
  onWork: (work: Work | null) => void
  onCoup: (coup: Coup | null) => void
}>) {
  const m = useMessages()
  const compact = useCompact()
  const { room, piece, step } = useFit(FITS.length - 1)
  if (!summary.me) return null
  const fit = compact ? 'rows' : FITS[step]
  const rows = fit === 'rows'
  const close = fit !== 'drawn'
  const gap = FORMS[fit].gap
  return (
    // The room is as wide as the layout lets the bar grow; the bar in it at
    // its own width, or, on rows, as wide as the room.
    <div ref={room} className="flex min-w-0 justify-center">
      <div ref={piece} className={rows ? 'min-w-0' : 'w-max'}>
        <div className={`hud-afloat flex items-start ${FORMS[fit].band}`}>
          <Armies summary={summary} gap={gap} onArmy={onArmy} />
          {!rows && <Divide close={close} />}
          <div className={`flex items-start ${gap}`}>
            {summary.works.map((w, i) => {
              const held = summary.work === w.work
              return (
                <Piece
                  key={w.work}
                  k={keyAt(summary.armies.length + 1 + i)}
                  name={m.game.works[w.work]}
                  hint={[m.hints.works[w.work]]}
                  held={held}
                  faint={!w.can && !held}
                  onClick={() => onWork(held ? null : w.work)}
                  emblem={
                    <MedallionEmblem icon={w.work} size="s" held={held} />
                  }
                  figure={
                    <Figure icon="coins" size="m">
                      {count(w.price)}
                    </Figure>
                  }
                />
              )
            })}
          </div>
          {!rows && <Divide close={close} />}
          <div className={`flex items-start ${gap}`}>
            {summary.coups.map((c, i) => {
              const held = summary.coup === c.coup
              return (
                <Piece
                  key={c.coup}
                  k={keyAt(
                    summary.armies.length + summary.works.length + 1 + i,
                  )}
                  name={m.game.coups[c.coup]}
                  hint={[m.hints.coups[c.coup]]}
                  held={held}
                  faint={!c.can && !held}
                  onClick={() => onCoup(held ? null : c.coup)}
                  emblem={
                    <CoupEmblem
                      icon={COUP_MARKS[c.coup]}
                      size="s"
                      held={held}
                    />
                  }
                  figure={
                    <Figure icon="coins" size="m">
                      {count(c.price)}
                    </Figure>
                  }
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
