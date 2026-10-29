import type { ReactNode } from 'react'

// The HUD's one button: a plate laid on the sheet, an ink edge, its word in
// Vollkorn, tall enough for a finger. Gold to act, the alliance's green to
// accept one, gules to break or refuse, parchment for the rest.

const TONES = {
  gilt: 'bg-gilt text-quill hover:bg-gilt-light',
  pact: 'bg-pact-deep text-vellum hover:bg-pact-deeper',
  gules: 'bg-gules text-wax hover:bg-gules-deep',
  plain: 'bg-vellum text-quill hover:bg-shade',
} as const

export type Tone = keyof typeof TONES

// norm-ok: a plate of the game's own material (CLAUDE.md, the art direction), as the sheet it lies on.
const PLATE =
  'pointer-events-auto inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md border-[1.5px] border-quill px-4 font-words text-hud-m shadow-lift hud-press'

/** The button's look, for a link that acts as one. */
export function actClass(tone: Tone = 'gilt'): string {
  return `${PLATE} ${TONES[tone]}`
}

/** Asleep, it is shown but neither takes the pointer nor the keyboard; a label names a button that shows only a sign. */
export function Act({
  children,
  onClick,
  tone = 'gilt',
  asleep = false,
  call = false,
  label,
}: Readonly<{
  children: ReactNode
  onClick: () => void
  tone?: Tone
  asleep?: boolean
  /** A sheet's main act: its word larger, its plate wider. */
  call?: boolean
  label?: string
}>) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      tabIndex={asleep ? -1 : undefined}
      className={`${actClass(tone)} ${call ? 'px-12 text-hud-l' : ''} ${asleep ? 'pointer-events-none' : ''}`}
    >
      {children}
    </button>
  )
}

/** A light button, no plate: an arrow, a short word, a mark, in gilt ink, darkening under the pointer, tall enough for a finger. */
export function Tap({
  children,
  onClick,
  label,
}: Readonly<{ children: ReactNode; onClick: () => void; label?: string }>) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="hud-press inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center text-gilt-deep hover:text-quill"
    >
      {children}
    </button>
  )
}
