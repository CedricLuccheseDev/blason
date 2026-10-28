import { KeyCap } from '../hud/Emblem'
import type { ReactNode } from 'react'

// The pieces the bar is made of (Bar.tsx): one for each army, work or coup,
// and the gold rule between two parts.

// norm-ok: the piece's hover wash follows the sheet's worn corners (the art direction).
const PIECE =
  'pointer-events-auto flex cursor-pointer flex-col items-center gap-1 rounded-md pb-2 hud-press hover:bg-quill/5'

/** One piece of the bar: its emblem and key, its name, its figures; on a phone, the emblem and its figures alone, the name said to screen readers. */
export function Piece({
  emblem,
  k,
  name,
  aside,
  figures,
  held,
  faint = false,
  narrow,
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
  narrow: boolean
  onClick: () => void
}>) {
  return (
    <button
      type="button"
      aria-pressed={held}
      aria-label={name}
      onClick={onClick}
      className={`${PIECE} ${narrow ? 'w-12 px-0.5' : 'min-w-24 px-1'} ${faint ? 'opacity-45' : ''}`}
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
export function Divide({ narrow }: Readonly<{ narrow: boolean }>) {
  return (
    <span
      aria-hidden="true"
      className={`relative my-3 w-px self-stretch bg-quill/30 ${narrow ? 'mx-1' : 'mx-3'}`}
    >
      <span className="absolute top-1/2 left-1/2 size-2.5 -translate-1/2 rotate-45 border border-quill bg-gilt" />
    </span>
  )
}
