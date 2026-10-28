import { KeyCap, MedallionEmblem, SealEmblem } from '../hud/Emblem'
import { Figure } from '../hud/Figure'
import { Sheet } from '../hud/Sheet'
import { useCompact } from '../hud/useCompact'
import { count, hex } from './format'
import { Purse } from './Purse'
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
  'pointer-events-auto flex cursor-pointer flex-col items-center gap-1 rounded-md pb-2 hud-press hover:bg-quill/5'

/** One piece of the bar: its emblem and key, its name, its figures; on a phone, the emblem and its figures alone, the name said to screen readers. */
function Piece({
  emblem,
  k,
  name,
  aside,
  figures,
  held,
  faint,
  narrow,
  onClick,
}: Readonly<{
  emblem: ReactNode
  k: number
  name: string
  aside?: ReactNode
  figures: ReactNode
  held: boolean
  faint: boolean
  narrow: boolean
  onClick: () => void
}>) {
  return (
    <button
      type="button"
      aria-pressed={held}
      aria-label={name}
      onClick={onClick}
      className={`${PIECE} ${narrow ? 'w-12 px-0.5' : 'w-24 px-1'} ${faint ? 'opacity-45' : ''}`}
    >
      <span className="relative">
        {emblem}
        {!narrow && (
          <span className="absolute -top-1 -right-3">
            <KeyCap k={String(k)} />
          </span>
        )}
      </span>
      {!narrow && (
        <span className="flex items-baseline gap-1">
          <span className="hud-word text-hud-s whitespace-nowrap">{name}</span>
          {aside}
        </span>
      )}
      <span className="flex items-center gap-2">{figures}</span>
    </button>
  )
}

/** A gold rule between two parts of the bar. */
function Divide({ narrow }: Readonly<{ narrow: boolean }>) {
  return (
    <span
      aria-hidden="true"
      className={`relative my-3 w-px self-stretch bg-quill/30 ${narrow ? 'mx-1' : 'mx-3'}`}
    >
      <span className="absolute top-1/2 left-1/2 size-2.5 -translate-1/2 rotate-45 border border-quill bg-gilt" />
    </span>
  )
}

/**
 * At the bottom, one thin band of parchment rolled at both ends: on its
 * left what the player has (the purse); then the three armies as wax seals,
 * the one in hand raised in his colour, each with its men; then the three
 * works as gilt medallions, each with its price, in gules when it cannot be
 * paid. Keys 1 to 6. The half a click would use where the pointer is lights
 * up, the other waits at half ink: the armies over another's land, the works
 * over one's own or with a work in hand. On a phone, the purse on a row of
 * its own over the pieces.
 */
export function Bar({
  summary,
  lit,
  onArmy,
  onWork,
}: Readonly<{
  summary: Summary
  /** The half of the bar a click where the pointer is would use; none off the land. */
  lit: 'armies' | 'works' | null
  onArmy: (army: Army) => void
  onWork: (work: Work | null) => void
}>) {
  const m = useMessages()
  const narrow = useCompact()
  const { me } = summary
  if (!me) return null
  const size = 's'
  const works = summary.work !== null || lit === 'works'
  const armiesFaint = works
  const worksFaint = !works && lit === 'armies'
  return (
    <Sheet
      rolled="sides"
      className={`flex items-center ${narrow ? 'flex-col gap-1 px-3 py-1' : 'px-5 py-0.5'}`}
    >
      <Purse summary={summary} />
      {!narrow && <Divide narrow={narrow} />}
      <div className="flex items-stretch">
        {summary.armies.map((a, i) => {
          const held = !summary.work && a.army === summary.army
          return (
            <Piece
              key={a.army}
              k={i + 1}
              held={held}
              narrow={narrow}
              faint={armiesFaint}
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
        <Divide narrow={narrow} />
        {summary.works.map((w, i) => {
          const held = summary.work === w.work
          return (
            <Piece
              key={w.work}
              k={i + 4}
              held={held}
              narrow={narrow}
              faint={worksFaint || (!w.can && !held)}
              onClick={() => onWork(held ? null : w.work)}
              emblem={<MedallionEmblem icon={w.work} size={size} held={held} />}
              name={m.game.works[w.work]}
              figures={
                <Figure icon="coins" size="s" tone={w.can ? 'ink' : 'gules'}>
                  {count(w.price)}
                </Figure>
              }
            />
          )
        })}
      </div>
    </Sheet>
  )
}
