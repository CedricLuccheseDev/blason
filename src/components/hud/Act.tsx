import type { ReactNode } from 'react'

// The HUD's one button: a plate laid on the sheet, an ink edge, its word in
// IM Fell, tall enough for a finger. Gold to act, gules to break, parchment
// for the rest.

const TONES = {
  gilt: 'bg-gilt text-quill hover:bg-gilt-light',
  gules: 'bg-gules text-wax hover:bg-gules-deep',
  plain: 'bg-vellum text-quill hover:bg-shade',
} as const

export type Tone = keyof typeof TONES

// norm-ok: a plate of the game's own material (CLAUDE.md, the art direction), as the sheet it lies on.
const PLATE =
  'pointer-events-auto inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md border-[1.5px] border-quill px-4 font-fell text-hud-m shadow-lift hud-press'

/** The button's look, for a link that acts as one. */
export function actClass(tone: Tone = 'gilt'): string {
  return `${PLATE} ${TONES[tone]}`
}

/** Asleep, it is shown but neither takes the pointer nor the keyboard. */
export function Act({
  children,
  onClick,
  tone = 'gilt',
  asleep = false,
}: Readonly<{
  children: ReactNode
  onClick: () => void
  tone?: Tone
  asleep?: boolean
}>) {
  return (
    <button
      type="button"
      onClick={onClick}
      tabIndex={asleep ? -1 : undefined}
      className={`${actClass(tone)} ${asleep ? 'pointer-events-none' : ''}`}
    >
      {children}
    </button>
  )
}
