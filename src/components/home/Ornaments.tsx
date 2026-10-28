import type { ReactNode } from 'react'

// The ornaments of the home's scroll: the gold rule under the title, the
// lozenge before the entry chosen, the smaller entries.

/** A gold rule across the scroll, a lozenge at its middle, between the title and the menu. */
export function Flourish() {
  return (
    <span aria-hidden="true" className="relative mt-3 h-px w-full bg-gilt">
      <span className="absolute top-1/2 left-1/2 size-2.5 -translate-1/2 rotate-45 border border-quill bg-gilt" />
    </span>
  )
}

/** The lozenge before the entry chosen. */
export function Lozenge() {
  return (
    <span
      aria-hidden="true"
      className="size-3 shrink-0 rotate-45 border-[1.5px] border-quill bg-gilt opacity-0 transition-opacity duration-(--duration-hud-press) ease-hud group-data-[chosen=true]:opacity-100"
    />
  )
}

/** A second entry, smaller, with a note beside it if need be. */
export function Second({
  children,
  note,
}: Readonly<{ children: ReactNode; note?: string }>) {
  return (
    <span className="flex items-baseline gap-2">
      <span className="text-hud-l">{children}</span>
      {note && <span className="hud-note">{note}</span>}
    </span>
  )
}
