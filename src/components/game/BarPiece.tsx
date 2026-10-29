import { KeyCap } from '../hud/Emblem'
import type { ReactNode } from 'react'

// The pieces the bar is made of (Bar.tsx): one for each army, work or coup,
// and the gold rule between two parts.

// norm-ok: the piece's hover wash follows the sheet's worn corners (the art direction).
const PIECE =
  'pointer-events-auto flex cursor-pointer flex-col items-center gap-1 rounded-md pb-2 hud-press hover:bg-quill/5'

/**
 * How a piece is laid, from the roomiest: as drawn, its name under its
 * emblem; tight, without it, when the bar lacks room; narrow, as on a
 * phone, without its key either.
 */
export type Fit = 'drawn' | 'tight' | 'narrow'

const FITS: Record<Fit, string> = {
  drawn: 'min-w-24 px-1',
  tight: 'px-2',
  narrow: 'w-12 px-0.5',
}

/** One piece of the bar: its emblem and key, its name, its figures; its name, when not shown, said under the pointer and to screen readers. */
export function Piece({
  emblem,
  k,
  name,
  aside,
  figures,
  held,
  faint = false,
  fit,
  onClick,
}: Readonly<{
  emblem: ReactNode
  k: number
  name: string
  aside?: ReactNode
  figures: ReactNode
  held: boolean
  /** At half ink: what cannot be paid. */
  faint?: boolean
  fit: Fit
  onClick: () => void
}>) {
  return (
    <button
      type="button"
      aria-pressed={held}
      aria-label={name}
      title={fit === 'drawn' ? undefined : name}
      onClick={onClick}
      className={`${PIECE} ${FITS[fit]} ${faint ? 'opacity-45' : ''}`}
    >
      <span className="relative">
        {emblem}
        {fit !== 'narrow' && (
          <span className="absolute -top-1 -right-3">
            <KeyCap k={String(k)} />
          </span>
        )}
      </span>
      {fit === 'drawn' && (
        <span className="flex items-baseline gap-1">
          <span className="hud-word text-hud-s whitespace-nowrap">{name}</span>
          {aside}
        </span>
      )}
      <span className="flex items-center gap-2">{figures}</span>
    </button>
  )
}

/** A gold rule between two parts of the bar, closer to them when it lacks room. */
export function Divide({ fit }: Readonly<{ fit: Fit }>) {
  return (
    <span
      aria-hidden="true"
      className={`relative my-3 w-px self-stretch bg-quill/30 ${fit === 'drawn' ? 'mx-3' : 'mx-1'}`}
    >
      <span className="absolute top-1/2 left-1/2 size-2.5 -translate-1/2 rotate-45 border border-quill bg-gilt" />
    </span>
  )
}
