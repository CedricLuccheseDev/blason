// The home's ornaments, the game's page without its map: the frame the map
// lies in (render/layers/page.ts), round the whole page; a compass rose,
// faint, in its corner; and the gold rule under the title.

const INK = 'var(--color-quill)'
const PAPER = 'var(--color-vellum)'
const GOLD = 'var(--color-gilt)'

/** A gold rule across the column, a lozenge at its middle. */
export function Flourish() {
  return (
    <span aria-hidden="true" className="relative mt-3 h-px w-full bg-gilt">
      <span className="absolute top-1/2 left-1/2 size-2.5 -translate-1/2 rotate-45 border border-quill bg-gilt" />
    </span>
  )
}

/** A corner of the frame: a square of parchment and a gold lozenge on it. */
function Corner({ at }: Readonly<{ at: string }>) {
  return (
    <svg viewBox="0 0 18 18" className={`absolute size-[18px] ${at}`}>
      <rect x="1" y="1" width="16" height="16" fill={PAPER} stroke={INK} />
      <path d="M9 3 L15 9 L9 15 L3 9 Z" fill={GOLD} stroke={INK} />
    </svg>
  )
}

/**
 * The frame round the page, as the map's: a band of ink, parchment bars
 * along it, a thin rule outside and a gold lozenge at each corner. It lies
 * round the whole page, however long, and takes no pointer.
 */
export function Frame() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-2 sm:inset-3"
    >
      <span className="absolute -inset-1 border border-quill" />
      <span className="absolute inset-0 border-[9px] border-quill" />
      <svg className="absolute inset-[4.5px] size-[calc(100%-9px)] overflow-visible">
        <rect
          width="100%"
          height="100%"
          fill="none"
          stroke={PAPER}
          strokeWidth="5"
          strokeDasharray="40 40"
        />
      </svg>
      <Corner at="-top-[4.5px] -left-[4.5px]" />
      <Corner at="-top-[4.5px] -right-[4.5px]" />
      <Corner at="-bottom-[4.5px] -left-[4.5px]" />
      <Corner at="-right-[4.5px] -bottom-[4.5px]" />
    </div>
  )
}

/** A ray of the rose, from its heart: two halves along it, one in ink and one in parchment. */
function Ray({
  degrees,
  length,
  half,
  shaded,
}: Readonly<{
  degrees: number
  length: number
  half: number
  shaded: boolean
}>) {
  const a = (degrees * Math.PI) / 180
  const tip = `${Math.cos(a) * length} ${Math.sin(a) * length}`
  const [nx, ny] = [-Math.sin(a) * half, Math.cos(a) * half]
  const side = (s: number) => `M0 0 L${s * nx} ${s * ny} L${tip} Z`
  return (
    <>
      <path d={side(1)} fill={shaded ? PAPER : INK} stroke={INK} />
      <path d={side(-1)} fill={shaded ? INK : PAPER} stroke={INK} />
    </>
  )
}

const DIAGONALS = [45, 135, 225, 315]
const CARDINALS = [270, 0, 90, 180]

/** A compass rose, as the map lays one in its open sea: two rings, four short rays, four long. */
export function Rose({ className = '' }: Readonly<{ className?: string }>) {
  return (
    <svg
      viewBox="-50 -50 100 100"
      aria-hidden="true"
      className={`pointer-events-none ${className}`}
      strokeWidth="0.7"
    >
      <circle r="33" fill="none" stroke={INK} strokeWidth="0.8" />
      <circle r="30" fill="none" stroke={INK} strokeWidth="0.5" />
      {DIAGONALS.map((d) => (
        <Ray key={d} degrees={d} length={28.5} half={5.5} shaded={false} />
      ))}
      {CARDINALS.map((d) => (
        <Ray key={d} degrees={d} length={46} half={7.4} shaded />
      ))}
    </svg>
  )
}
