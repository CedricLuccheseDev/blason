import { KeyCap, MedallionEmblem, SealEmblem } from '../hud/Emblem'
import { Figure } from '../hud/Figure'
import { Sheet } from '../hud/Sheet'
import { count, hex } from './format'
import type { ReactNode } from 'react'
import type { Army, Work } from '../../../engine'
import type { Summary } from '~/render/client'
import { useMessages } from '~/i18n'

/** The drawing pressed in each army's seal. */
export const ARMY_MARKS = {
  raid: 'sword',
  host: 'soldier',
  ban: 'pitchfork',
} as const

// norm-ok: the piece's hover wash follows the sheet's worn corners (the art direction).
const PIECE =
  'pointer-events-auto flex w-32 cursor-pointer flex-col items-center gap-1 rounded-md px-2 pb-2 transition-colors hover:bg-quill/5'

/** One piece of the bar: its emblem and key, its name, its figures. */
function Piece({
  emblem,
  k,
  name,
  aside,
  figures,
  held,
  faint,
  onClick,
}: Readonly<{
  emblem: ReactNode
  k: number
  name: string
  aside?: ReactNode
  figures: ReactNode
  held: boolean
  faint: boolean
  onClick: () => void
}>) {
  return (
    <button
      type="button"
      aria-pressed={held}
      onClick={onClick}
      className={`${PIECE} ${faint ? 'opacity-50' : ''}`}
    >
      <span className="relative">
        {emblem}
        <span className="absolute -top-1 -right-3">
          <KeyCap k={String(k)} />
        </span>
      </span>
      <span className="flex items-baseline gap-1">
        <span className="hud-word whitespace-nowrap">{name}</span>
        {aside}
      </span>
      <span className="flex items-center gap-2">{figures}</span>
    </button>
  )
}

/**
 * At the bottom, on a band of parchment rolled at both ends: the three
 * armies as wax seals, the one in hand raised in the player's colour, each
 * with its share, its men and its gold; a gold rule; the three works as gilt
 * medallions, the one in hand raised, each with its price, in gules when it
 * cannot be paid. Keys 1 to 6. With a work in hand, the armies wait at half
 * ink.
 */
export function Bar({
  summary,
  onArmy,
  onWork,
}: Readonly<{
  summary: Summary
  onArmy: (army: Army) => void
  onWork: (work: Work | null) => void
}>) {
  const m = useMessages()
  const { me } = summary
  if (!me) return null
  return (
    <Sheet rolled="sides" className="flex items-stretch px-6 pt-1 pb-1">
      {summary.armies.map((a, i) => {
        const held = !summary.work && a.army === summary.army
        return (
          <Piece
            key={a.army}
            k={i + 1}
            held={held}
            faint={summary.work !== null}
            onClick={() => onArmy(a.army)}
            emblem={
              <SealEmblem
                icon={ARMY_MARKS[a.army]}
                color={held ? hex(me.color) : 'var(--color-vellum)'}
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
                <Figure icon="coins" size="s">
                  {count(a.gold)}
                </Figure>
              </>
            }
          />
        )
      })}
      <span aria-hidden="true" className="relative mx-3 my-4 w-px bg-quill/30">
        <span className="absolute top-1/2 left-1/2 size-2.5 -translate-1/2 rotate-45 border border-quill bg-gilt" />
      </span>
      {summary.works.map((w, i) => {
        const held = summary.work === w.work
        return (
          <Piece
            key={w.work}
            k={i + 4}
            held={held}
            faint={!w.can && !held}
            onClick={() => onWork(held ? null : w.work)}
            emblem={<MedallionEmblem icon={w.work} held={held} />}
            name={m.game.works[w.work]}
            figures={
              <Figure icon="coins" size="s" tone={w.can ? 'ink' : 'gules'}>
                {count(w.price)}
              </Figure>
            }
          />
        )
      })}
    </Sheet>
  )
}
