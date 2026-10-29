import { CoupEmblem, MedallionEmblem, SealEmblem } from '../hud/Emblem'
import { Figure } from '../hud/Figure'
import { Sheet } from '../hud/Sheet'
import { useCompact } from '../hud/useCompact'
import { useFit } from '../hud/useFit'
import { count, hex } from './format'
import { Purse } from './Purse'
import { Divide, Piece } from './BarPiece'
import type { Fit } from './BarPiece'
import type { Army, Coup, Work } from '../../../engine'
import type { Summary } from '~/render/client'
import { useMessages } from '~/i18n'

/** The drawing pressed in each army's seal. */
export const ARMY_MARKS = {
  raid: 'sword',
  host: 'soldier',
  ban: 'pitchfork',
  mercenaries: 'market',
} as const

/** The drawing in each coup's lozenge: its shape says which before its colour does. */
export const COUP_MARKS = {
  troublemaker: 'torch',
  archers: 'bow',
  fire: 'firepot',
} as const satisfies Record<Coup, string>

/** The bar's forms, from as drawn to the most compact, each tried in turn until one fits its room. */
const FITS: ReadonlyArray<Fit> = ['drawn', 'tight', 'narrow']

/** The band's padding in each form, the narrow one laid on rows. */
const BAND: Record<Fit, string> = {
  drawn: 'px-5 py-0.5',
  tight: 'px-3 py-0.5',
  narrow: 'flex-col gap-1 px-3 py-1',
}

/**
 * At the bottom, one thin band of parchment rolled at both ends: on its
 * left what the player has (the purse); then the three armies as wax seals,
 * the one in hand raised in his colour, each with its men; then the three
 * works as gilt medallions, then the three coups as lozenges ringed in
 * gules, each with its price, in gules when it cannot be paid, then at half
 * ink: half ink says only that, never where the pointer is, so that no one
 * thinks he lacks the gold when he does not. Keys 1 to 9. It keeps within
 * the screen, its room measured: when it lacks it, the names go (each said
 * under the pointer), then it is laid as on a phone: the purse on a row of
 * its own over the armies and the works, the coups on a row under them.
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
  const { me } = summary
  if (!me) return null
  const fit = compact ? 'narrow' : FITS[step]
  const narrow = fit === 'narrow'
  const size = 's'
  return (
    // The room is as wide as the layout lets the bar grow; the bar in it,
    // its rolled ends included, at its own width.
    <div ref={room} className="flex min-w-0 justify-center">
      <div ref={piece} className="w-max px-2">
        <Sheet rolled="sides" className={`flex items-center ${BAND[fit]}`}>
          <Purse summary={summary} />
          {!narrow && <Divide fit={fit} />}
          <div className="flex items-stretch">
            {summary.armies.map((a, i) => {
              const held =
                !summary.work && !summary.coup && a.army === summary.army
              return (
                <Piece
                  key={a.army}
                  k={i + 1}
                  held={held}
                  fit={fit}
                  onClick={() => onArmy(a.army)}
                  emblem={
                    <SealEmblem
                      icon={ARMY_MARKS[a.army]}
                      color={held ? hex(me.color) : 'var(--color-vellum)'}
                      size={size}
                      held={held}
                    />
                  }
                  name={m.game.armies[a.army]}
                  aside={
                    <Figure size="s" tone="dim">
                      {m.game.percent(a.share)}
                    </Figure>
                  }
                  figures={
                    <>
                      <Figure icon="soldier" size="s">
                        {count(a.men)}
                      </Figure>
                      {a.gold > 0 && (
                        <Figure icon="coins" size="s">
                          {count(a.gold)}
                        </Figure>
                      )}
                    </>
                  }
                />
              )
            })}
            <Divide fit={fit} />
            {summary.works.map((w, i) => {
              const held = summary.work === w.work
              return (
                <Piece
                  key={w.work}
                  k={summary.armies.length + i + 1}
                  held={held}
                  fit={fit}
                  faint={!w.can && !held}
                  onClick={() => onWork(held ? null : w.work)}
                  emblem={
                    <MedallionEmblem icon={w.work} size={size} held={held} />
                  }
                  name={m.game.works[w.work]}
                  figures={
                    <Figure
                      icon="coins"
                      size="s"
                      tone={w.can ? 'ink' : 'gules'}
                    >
                      {count(w.price)}
                    </Figure>
                  }
                />
              )
            })}
          </div>
          {!narrow && <Divide fit={fit} />}
          <div className="flex items-stretch">
            {summary.coups.map((c, i) => {
              const held = summary.coup === c.coup
              return (
                <Piece
                  key={c.coup}
                  k={summary.armies.length + summary.works.length + i + 1}
                  held={held}
                  fit={fit}
                  faint={!c.can && !held}
                  onClick={() => onCoup(held ? null : c.coup)}
                  emblem={
                    <CoupEmblem
                      icon={COUP_MARKS[c.coup]}
                      size={size}
                      held={held}
                    />
                  }
                  name={m.game.coups[c.coup]}
                  figures={
                    <Figure
                      icon="coins"
                      size="s"
                      tone={c.can ? 'ink' : 'gules'}
                    >
                      {count(c.price)}
                    </Figure>
                  }
                />
              )
            })}
          </div>
        </Sheet>
      </div>
    </div>
  )
}
