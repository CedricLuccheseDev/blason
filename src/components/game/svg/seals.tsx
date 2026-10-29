import { Glyph, INK, PAPER } from './marks'
import { LIFT } from './kit'
import type { Mark } from './marks'

// The pieces of the bar: the wax seal of an army or an act, the gilt
// medallion of a work, the lozenge of a coup ringed in gules.

const GLOW = 'url(#blason-glow)'

/** The wax's edge, a little uneven, round (cx, cy): the points of its polygon. */
export function waxEdge(cx: number, cy: number, r: number): string {
  return Array.from({ length: 22 }, (_, i) => {
    const a = (i / 22) * Math.PI * 2
    const rr = r * (1 + 0.06 * Math.sin(i * 2.7) + 0.04 * Math.cos(i * 1.3))
    return `${cx + Math.cos(a) * rr},${cy + Math.sin(a) * rr}`
  }).join(' ')
}

/** A wax seal, its drawing pressed into it; lifted and glowing when in hand. */
export function Seal({
  cx,
  cy,
  r,
  icon,
  color = 'var(--color-gules)',
  edge = 'var(--color-gules-deep)',
  dim = false,
  lifted = false,
}: Readonly<{
  cx: number
  cy: number
  r: number
  icon: Mark
  color?: string
  edge?: string
  dim?: boolean
  lifted?: boolean
}>) {
  const points = waxEdge(cx, cy, r)
  return (
    <g filter={lifted ? GLOW : LIFT} opacity={dim ? 0.55 : 1}>
      <polygon
        points={points}
        fill={color}
        stroke={edge}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle
        cx={cx}
        cy={cy}
        r={r * 0.74}
        fill="none"
        stroke={edge}
        strokeWidth="2"
      />
      <path
        d={`M${cx - r * 0.55} ${cy - r * 0.35} Q${cx - r * 0.3} ${cy - r * 0.72} ${cx + r * 0.15} ${cy - r * 0.72}`}
        fill="none"
        stroke={PAPER}
        strokeOpacity="0.28"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <Glyph
        name={icon}
        cx={cx}
        cy={cy + 0.5}
        size={r}
        fill="var(--color-wax)"
        stroke={edge}
        sw={1.7}
      />
    </g>
  )
}

/** A medallion: a parchment disc ringed with gold, or another colour for an act (the right click's menu), its drawing in ink. */
export function Medallion({
  cx,
  cy,
  r,
  icon,
  ring = 'var(--color-gilt)',
  dim = false,
  lifted = false,
}: Readonly<{
  cx: number
  cy: number
  r: number
  icon: Mark
  ring?: string
  dim?: boolean
  lifted?: boolean
}>) {
  return (
    <g filter={lifted ? GLOW : LIFT} opacity={dim ? 0.5 : 1}>
      <circle cx={cx} cy={cy} r={r} fill={PAPER} stroke={INK} strokeWidth="2" />
      <circle
        cx={cx}
        cy={cy}
        r={r - 4}
        fill="none"
        stroke={ring}
        strokeWidth="2.6"
      />
      <circle
        cx={cx}
        cy={cy}
        r={r - 5.6}
        fill="none"
        stroke={INK}
        strokeWidth="0.8"
      />
      <Glyph name={icon} cx={cx} cy={cy + 0.5} size={r * 1.12} sw={1.8} />
    </g>
  )
}

/** A work's plaque: a parchment square ringed with gold, its drawing in ink; lifted and glowing when in hand. Units are round, works square, coups lozenges (« unité = rond, construction = carré, coups = losange »). */
export function Plaque({
  cx,
  cy,
  r,
  icon,
  lifted = false,
}: Readonly<{
  cx: number
  cy: number
  r: number
  icon: Mark
  lifted?: boolean
}>) {
  // A square looks larger than a disc of its radius: it reaches a little less.
  const square = (k: number, round: number) => (
    <rect x={cx - k} y={cy - k} width={2 * k} height={2 * k} rx={round} />
  )
  const reach = r * 0.9
  return (
    <g filter={lifted ? GLOW : LIFT}>
      <g fill={PAPER} stroke={INK} strokeWidth="2">
        {square(reach, 4)}
      </g>
      <g fill="none" stroke="var(--color-gilt)" strokeWidth="2.6">
        {square(reach - 4, 2.4)}
      </g>
      <g fill="none" stroke={INK} strokeWidth="0.8">
        {square(reach - 5.6, 1.6)}
      </g>
      <Glyph name={icon} cx={cx} cy={cy + 0.5} size={r * 1.12} sw={1.8} />
    </g>
  )
}

/** A coup's lozenge: a parchment diamond ringed in gules, its drawing in ink; lifted and glowing when in hand. */
export function Lozenge({
  cx,
  cy,
  r,
  icon,
  lifted = false,
}: Readonly<{
  cx: number
  cy: number
  r: number
  icon: Mark
  lifted?: boolean
}>) {
  // A diamond looks smaller than a disc of its radius: it reaches a little further.
  const diamond = (k: number) =>
    `M${cx} ${cy - k} L${cx + k} ${cy} L${cx} ${cy + k} L${cx - k} ${cy} Z`
  const reach = r * 1.2
  return (
    <g filter={lifted ? GLOW : LIFT}>
      <path
        d={diamond(reach)}
        fill={PAPER}
        stroke={INK}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d={diamond(reach - 5)}
        fill="none"
        stroke="var(--color-gules)"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <Glyph name={icon} cx={cx} cy={cy} size={r * 1.05} sw={1.8} />
    </g>
  )
}
