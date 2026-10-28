import { Ecu } from '../game/svg/kit'
import { Lozenge, Medallion, Seal } from '../game/svg/seals'
import { Glyph, INK, PAPER } from '../game/svg/marks'
import { BADGE, RAISE, SEAL, SHIELD, scaled } from './tokens'
import type { Mark } from '../game/svg/marks'
import type { ReactNode } from 'react'

// The HUD's drawn objects at their fixed sizes, each in its own box so the
// sheets lay them out as they do words: a lord's shield, the wax seal of an
// army or an act, the medallion of a work, the lozenge of a coup, a badge of
// standing, a key of the keyboard. Drawn at scale 1, grown by the HUD's scale.

/** A drawing's box: drawn on `w` by `h` units, laid out at that size grown by the HUD's scale. */
const box = (w: number, h: number) => ({
  viewBox: `0 0 ${w} ${h}`,
  style: { width: scaled(w), height: scaled(h) },
})

/** A lord's shield; with a level, his colour fills it as a vessel. */
export function Shield({
  color,
  size = 'm',
  level,
}: Readonly<{ color: string; size?: keyof typeof SHIELD; level?: number }>) {
  const { w, h } = SHIELD[size]
  return (
    <svg
      {...box(w + 2, h + 2)}
      aria-hidden="true"
      className="shrink-0 overflow-visible"
    >
      <Ecu x={1} y={1} w={w} h={h} color={color} level={level} lift={false} />
    </svg>
  )
}

/** The box a seal or a medallion sits in, room left for it to rise. */
const boxOf = (size: keyof typeof SEAL) => 2 * (SEAL[size] + RAISE) + 6

function Round({
  size,
  held,
  children,
}: Readonly<{
  size: keyof typeof SEAL
  held: boolean
  children: (c: { cx: number; cy: number; r: number }) => ReactNode
}>) {
  const side = boxOf(size)
  const c = side / 2
  const r = SEAL[size]
  // In hand, it rises and grows by RAISE, gliding there (the HUD's motion).
  const lift = held
    ? `translateY(-${RAISE}px) scale(${(r + RAISE) / r})`
    : undefined
  const { viewBox, style } = box(side, side)
  return (
    <svg
      viewBox={viewBox}
      aria-hidden="true"
      className="shrink-0 overflow-visible transition-transform duration-(--duration-hud-enter) ease-hud motion-reduce:transition-none"
      style={{ ...style, transform: lift }}
    >
      {children({ cx: c, cy: c, r })}
    </svg>
  )
}

/** A wax seal, its drawing pressed in it; raised and glowing when in hand. */
export function SealEmblem({
  icon,
  color,
  size = 'l',
  held = false,
}: Readonly<{
  icon: Mark
  color: string
  size?: keyof typeof SEAL
  held?: boolean
}>) {
  return (
    <Round size={size} held={held}>
      {(at) => (
        <Seal {...at} icon={icon} color={color} edge={INK} lifted={held} />
      )}
    </Round>
  )
}

/** A work's gilt medallion; raised and glowing when in hand. */
export function MedallionEmblem({
  icon,
  size = 'l',
  held = false,
}: Readonly<{ icon: Mark; size?: keyof typeof SEAL; held?: boolean }>) {
  return (
    <Round size={size} held={held}>
      {(at) => <Medallion {...at} icon={icon} lifted={held} />}
    </Round>
  )
}

/** A coup's lozenge, ringed in gules; raised and glowing when in hand. */
export function CoupEmblem({
  icon,
  size = 'l',
  held = false,
}: Readonly<{ icon: Mark; size?: keyof typeof SEAL; held?: boolean }>) {
  return (
    <Round size={size} held={held}>
      {(at) => <Lozenge {...at} icon={icon} lifted={held} />}
    </Round>
  )
}

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

/** A key of the keyboard, in its lozenge. */
export function KeyCap({ k }: Readonly<{ k: string }>) {
  return (
    <span
      className="relative grid size-6 place-items-center"
      aria-hidden="true"
    >
      <span className="absolute inset-[3px] rotate-45 border-[1.5px] border-quill bg-vellum" />
      <span className="hud-figure relative text-hud-s">{k}</span>
    </span>
  )
}

/** A mouse with its right button lit: what a right click opens. */
export function RightClick() {
  return (
    <svg {...box(20, 30)} aria-hidden="true" className="shrink-0">
      <rect
        x={1}
        y={1}
        width={18}
        height={28}
        rx={9}
        fill="var(--color-vellum)"
        stroke={INK}
        strokeWidth="1.5"
      />
      <path
        d="M10 1 V12 H19 V10 A9 9 0 0 0 10 1 Z"
        fill="var(--color-gilt)"
        stroke={INK}
        strokeWidth="1"
      />
      <path d="M1 12 H19" stroke={INK} strokeWidth="1" />
    </svg>
  )
}
