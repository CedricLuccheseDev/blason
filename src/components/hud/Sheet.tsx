import type { ReactNode } from 'react'

// norm-ok: the game's own material (CLAUDE.md, the art direction): parchment laid on the map, its corners worn round, its shadow on the page.
const SHEET =
  'hud-enter relative rounded-md border-[1.5px] border-quill bg-vellum shadow-lift'
const RULE =
  'pointer-events-none absolute inset-[3px] rounded-sm border border-gilt'

/**
 * The HUD's one material: a sheet of parchment laid on the map, an ink edge,
 * a gold rule inside it, a little shadow under it. Every piece is one.
 */
export function Sheet({
  children,
  className = '',
}: Readonly<{
  children: ReactNode
  className?: string
}>) {
  return (
    <div className={`${SHEET} ${className}`}>
      <span aria-hidden="true" className={RULE} />
      {children}
    </div>
  )
}

/** A rule between the parts of a sheet, upright. */
export function Rule() {
  return <span aria-hidden="true" className="w-px self-stretch bg-quill/30" />
}
