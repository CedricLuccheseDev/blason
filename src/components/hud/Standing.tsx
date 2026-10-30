import { Glyph, INK, PAPER } from '../game/svg/marks'
import { BADGE, box } from './tokens'
import type { Mark } from '../game/svg/marks'

/**
 * How a lord stands with the player, each by a badge whose shape says it
 * before its colour does, as on the map (render/art/icons.ts): an ally the
 * links of a chain in the alliance's green, a foe at war a sword in gules,
 * a felon his broken shield on gules.
 */
const STANDINGS = {
  ally: {
    icon: 'links',
    ground: PAPER,
    rim: 'var(--color-pact)',
    fill: PAPER,
    stroke: 'var(--color-pact)',
  },
  foe: {
    icon: 'sword',
    ground: PAPER,
    rim: 'var(--color-gules)',
    fill: 'var(--color-wax)',
    stroke: 'var(--color-gules-deep)',
  },
  felon: {
    icon: 'felon',
    ground: 'var(--color-gules)',
    rim: INK,
    fill: 'var(--color-wax)',
    stroke: INK,
  },
} as const satisfies Record<
  string,
  { icon: Mark; ground: string; rim: string; fill: string; stroke: string }
>

export type Standing = keyof typeof STANDINGS

/** A badge of standing: a disc ringed in its colour, its mark in it; named by `label` where no word stands beside it. */
export function StandingBadge({
  standing,
  label,
  size = 's',
}: Readonly<{
  standing: Standing
  label?: string
  size?: keyof typeof BADGE
}>) {
  const { icon, ground, rim, fill, stroke } = STANDINGS[standing]
  const side = BADGE[size] + 2
  const c = side / 2
  return (
    <svg
      {...box(side, side)}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className="shrink-0 overflow-visible"
    >
      {label && <title>{label}</title>}
      <circle
        cx={c}
        cy={c}
        r={c - 1.5}
        fill={ground}
        stroke={rim}
        strokeWidth="2.2"
      />
      <Glyph
        name={icon}
        cx={c}
        cy={c}
        size={side * 0.66}
        fill={fill}
        stroke={stroke}
        sw={1.8}
      />
    </svg>
  )
}
