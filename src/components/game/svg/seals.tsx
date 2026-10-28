import { Glyph, INK, PAPER } from './marks'
import { LIFT } from './kit'
import type { Mark } from './marks'

// The round pieces of the mockups: the wax seal of an army or an act, the
// gilt medallion of a work.

const GLOW = 'url(#blason-glow)'

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
  const points = Array.from({ length: 22 }, (_, i) => {
    const a = (i / 22) * Math.PI * 2
    const rr = r * (1 + 0.06 * Math.sin(i * 2.7) + 0.04 * Math.cos(i * 1.3))
    return `${cx + Math.cos(a) * rr},${cy + Math.sin(a) * rr}`
  }).join(' ')
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

/** A work's medallion: a parchment disc ringed with gold, its drawing in ink. */
export function Medallion({
  cx,
  cy,
  r,
  icon,
  dim = false,
  lifted = false,
}: Readonly<{
  cx: number
  cy: number
  r: number
  icon: Mark
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
        stroke="var(--color-gilt)"
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
