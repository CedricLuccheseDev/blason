import type { ReactNode } from 'react'

// norm-ok: the game's own material (CLAUDE.md, the art direction): parchment laid on the map, its corners worn round, its shadow on the page.
const SHEET =
  'hud-enter relative rounded-md border-[1.5px] border-quill bg-vellum shadow-lift'
const RULE =
  'pointer-events-none absolute inset-[3px] rounded-sm border border-gilt'
const ROLL =
  'pointer-events-none absolute rounded-full border-[1.5px] border-quill bg-shade'

/**
 * The HUD's one material: a sheet of parchment laid on the map, an ink edge,
 * a gold rule inside it, a little shadow under it. Every piece is one. A
 * sheet may be rolled at its sides, as the band of the bar, or at its ends,
 * as the scroll of the home's menu.
 */
export function Sheet({
  children,
  className = '',
  rolled,
}: Readonly<{
  children: ReactNode
  className?: string
  rolled?: 'sides' | 'ends'
}>) {
  return (
    <div className={`${SHEET} ${className}`}>
      <span aria-hidden="true" className={RULE} />
      {rolled === 'sides' && (
        <>
          <Roll at="-inset-y-1 -left-2 w-4" />
          <Roll at="-inset-y-1 -right-2 w-4" />
        </>
      )}
      {rolled === 'ends' && (
        <>
          <Roll at="-inset-x-1 -top-2 h-4" across />
          <Roll at="-inset-x-1 -bottom-2 h-4" across />
        </>
      )}
      {children}
    </div>
  )
}

/** A rolled end of a sheet, upright or across, its fold drawn down its middle. */
function Roll({
  at,
  across = false,
}: Readonly<{ at: string; across?: boolean }>) {
  return (
    <span aria-hidden="true" className={`${ROLL} ${at}`}>
      <span
        className={`absolute bg-shade-deep ${across ? 'inset-x-1 top-1/2 h-px' : 'inset-y-1 left-1/2 w-px'}`}
      />
    </span>
  )
}

/** A rule between the parts of a sheet, upright. */
export function Rule() {
  return <span aria-hidden="true" className="w-px self-stretch bg-quill/30" />
}
