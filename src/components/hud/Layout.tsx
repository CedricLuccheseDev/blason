import { Sheet } from './Sheet'
import type { ReactNode } from 'react'

// The HUD's layout, as its type is: a few bricks every piece is built of, so
// that no piece sets a space of its own (« je veux le même design system
// partout », « pour éviter de retrouver ces problèmes »). A space is named
// by what it parts, never a number; a sheet has one inside margin; a line of
// a list one height. The pieces of components/game and components/home may
// set none of these themselves: the norm check refuses it (scripts/
// norm-check.mjs, `spacing`), and only this folder writes them.

/** The spaces, by what they part: an icon and its figure (4), the lines of a piece (8), its parts (12), the pieces of a corner (16), groups (24). */
const GAPS = {
  hair: 'gap-1',
  line: 'gap-2',
  part: 'gap-3',
  piece: 'gap-4',
  group: 'gap-6',
} as const

export type Gap = keyof typeof GAPS

/** The named spaces as classes, for a grid or a form that is no Stack nor Inline. */
export const GAP: Readonly<Record<Gap, string>> = GAPS

const ALIGN = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
} as const

const JUSTIFY = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
} as const

type Flow = Readonly<{
  gap?: Gap
  align?: keyof typeof ALIGN
  justify?: keyof typeof JUSTIFY
  wrap?: boolean
  /** Tone, width, position: anything but a space. */
  className?: string
  children: ReactNode
}>

const flow = (
  dir: string,
  {
    gap = 'line',
    align,
    justify,
    wrap,
    className = '',
  }: Omit<Flow, 'children'>,
  fallback: keyof typeof ALIGN,
) =>
  `flex ${dir} ${GAPS[gap]} ${ALIGN[align ?? fallback]} ${justify ? JUSTIFY[justify] : ''} ${wrap ? 'flex-wrap' : ''} ${className}`

/** Pieces one under the other, a named space between them. */
export function Stack(props: Flow) {
  return (
    <div className={flow('flex-col', props, 'stretch')}>{props.children}</div>
  )
}

/** Pieces side by side, a named space between them, centred on one line unless told. */
export function Inline(props: Flow) {
  return (
    <div className={flow('flex-row', props, 'center')}>{props.children}</div>
  )
}

/** The HUD's sheet with its one inside margin: a piece's (12 by 8), or a page's, the book's and the home's sheets (24 by 20). */
export function Panel({
  page = false,
  gap = 'line',
  scroll = false,
  className = '',
  children,
}: Readonly<{
  page?: boolean
  gap?: Gap
  /** Taller than the screen may hold: its words scroll within it, its edge and its gold rule standing still (a sheet that scrolled took its rule with it, and the rule ran out half way, « la stroke or »). */
  scroll?: boolean
  className?: string
  children: ReactNode
}>) {
  const inside = page ? 'px-6 py-5 max-sm:px-4' : 'px-3 py-2'
  if (!scroll)
    return (
      <Sheet className={`flex flex-col ${GAPS[gap]} ${inside} ${className}`}>
        {children}
      </Sheet>
    )
  return (
    <Sheet className={`flex flex-col ${className}`}>
      <div
        className={`flex min-h-0 flex-col overflow-y-auto ${GAPS[gap]} ${inside}`}
      >
        {children}
      </div>
    </Sheet>
  )
}

/** A small sheet hung on the map, a pennant's words, a seal's time: its narrow margin (8 by 4), its words on one line. */
export function Tag({
  className = '',
  children,
}: Readonly<{ className?: string; children: ReactNode }>) {
  return (
    <Sheet
      className={`flex items-center gap-1 px-2 py-1 whitespace-nowrap ${className}`}
    >
      {children}
    </Sheet>
  )
}

/** A panel's head: who or what it is about, on one line, ruled under in gold. */
export function Caption({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex items-center gap-2 border-b border-gilt/60 pb-1">
      {children}
    </div>
  )
}

/** A line of a list: its name on the left, its value on the right in a column of one width, every line as tall, ruled under. */
export function Line({
  name,
  children,
}: Readonly<{ name: ReactNode; children: ReactNode }>) {
  return (
    <div className="flex h-11 items-center justify-between gap-3 border-b border-dotted border-quill/45">
      {name}
      <span className="flex w-56 items-center">{children}</span>
    </div>
  )
}

/** A dark veil over the whole screen, HUD and all, a sheet held in its middle: the book, a dialog; a click on the veil round the sheet puts it down, if it may be (« les modals quand on clique dehors ça ferme les modals »). */
export function Veil({
  onClose,
  children,
}: Readonly<{ onClose?: () => void; children: ReactNode }>) {
  return (
    <div // norm-ok: the veil is no control, a click on it doubles the sheet's own button to put it down.
      className="pointer-events-auto absolute inset-0 z-40 flex items-center justify-center bg-quill/50 p-3"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      {children}
    </div>
  )
}

/** Two pages side by side, a fold between them; one under the other on a phone. */
export function Spread({
  left,
  right,
}: Readonly<{ left: ReactNode; right: ReactNode }>) {
  return (
    <div className="grid gap-6 sm:grid-cols-[1fr_auto_1fr]">
      <div className="flex min-w-0 flex-col gap-3">{left}</div>
      <span aria-hidden="true" className="w-px bg-quill/35 max-sm:hidden" />
      <div className="flex min-w-0 flex-col gap-3">{right}</div>
    </div>
  )
}

/** A piece's last part, ruled off above in gold: a sheet's buttons. */
export function Ruled({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 border-t border-gilt/50 pt-3">
      {children}
    </div>
  )
}

/** The screen's margin, round the HUD's places. */
export const MARGIN = 'p-7 max-sm:p-3 short:p-3'
