import { KeyCap } from '../hud/Emblem'
import { Hint } from '../hud/Hint'
import { Name } from '../hud/Text'
import { Figure } from '../hud/Figure'
import { count } from './format'
import type { ReactNode } from 'react'

// The pieces the bar is made of (Bar.tsx): one for each army, work or coup,
// and the gold rule between two parts.

// norm-ok: the piece's hover wash follows the sheet's worn corners (the art direction).
export const PIECE =
  'pointer-events-auto flex cursor-pointer flex-col items-center gap-1 rounded-md px-1 pt-1 hud-press hover:bg-quill/5'

/**
 * One piece of the bar: its emblem, its key at its top right (none on a
 * phone, which has no keyboard), and under it its figure, if it has one. No
 * word on the bar: its name, and what it does, are said under the pointer in
 * its hint, and its name to screen readers; in a drawer, where there is room
 * and a new player learns the bar, its name is written under its figure.
 */
export function Piece({
  emblem,
  k,
  name,
  hint,
  figure,
  held,
  short = false,
  named = false,
  onClick,
}: Readonly<{
  emblem: ReactNode
  k: string | null
  name: string
  /** What it does, a sentence a line, said under the pointer with its name. */
  hint: ReadonlyArray<string>
  figure?: ReactNode
  held: boolean
  /** What cannot be had now (no man to raise, not the gold): said to the ear as a refusal (render/sound.ts). */
  short?: boolean
  /** Its name written under its figure, as in a drawer. */
  named?: boolean
  onClick: () => void
}>) {
  return (
    <Hint title={name} lines={hint}>
      <button
        type="button"
        aria-pressed={held}
        aria-disabled={short || undefined}
        aria-label={name}
        onClick={onClick}
        className={PIECE}
      >
        {/* What cannot be had is at half ink inside its drawing (the emblems' dim): an opacity here made a layer that left its trace as the bar moved (« en bas les losanges y'a un carré derrière »). */}
        <span className="relative">
          {emblem}
          {k !== null && (
            <span className="absolute -top-1 -right-3">
              <KeyCap k={k} />
            </span>
          )}
        </span>
        {figure}
        {named && <Name className="whitespace-nowrap">{name}</Name>}
      </button>
    </Hint>
  )
}

/** A gold rule between two parts of the bar, closer to them when it lacks room. */
export function Divide({ close }: Readonly<{ close: boolean }>) {
  return (
    <span
      aria-hidden="true"
      // norm-ok: the rule's own room, either side of it and above and below, as drawn.
      className={`relative my-3 w-px self-stretch bg-quill/30 ${close ? 'mx-1' : 'mx-3'}`}
    >
      <span className="absolute top-1/2 left-1/2 size-2.5 -translate-1/2 rotate-45 border border-quill bg-gilt" />
    </span>
  )
}

/** A price under a piece, in gules when it cannot be paid. */
export function Price({
  price,
  short,
}: Readonly<{ price: number; short: boolean }>) {
  return (
    <Figure icon="coins" size="m" tone={short ? 'loss' : 'info'}>
      {count(price)}
    </Figure>
  )
}
