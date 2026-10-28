import { Ecu } from '../game/svg/kit'
import { INK } from '../game/svg/marks'
import { Medallion, Seal } from '../game/svg/seals'
import { RAISE, SEAL, SHIELD } from './tokens'
import type { Mark } from '../game/svg/marks'
import type { ReactNode } from 'react'

// The HUD's drawn objects at their fixed sizes, each in its own box so the
// sheets lay them out as they do words: a lord's shield, the wax seal of an
// army or an act, the medallion of a work, a key of the keyboard.

/** A lord's shield; with a level, his colour fills it as a vessel. */
export function Shield({
  color,
  size = 'm',
  level,
}: Readonly<{ color: string; size?: keyof typeof SHIELD; level?: number }>) {
  const { w, h } = SHIELD[size]
  return (
    <svg
      width={w + 2}
      height={h + 2}
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
  const box = boxOf(size)
  const c = box / 2
  const r = SEAL[size]
  // In hand, it rises and grows by RAISE, gliding there (the HUD's motion).
  const lift = held
    ? `translateY(-${RAISE}px) scale(${(r + RAISE) / r})`
    : undefined
  return (
    <svg
      width={box}
      height={box}
      aria-hidden="true"
      className="shrink-0 overflow-visible transition-transform duration-(--duration-hud-enter) ease-hud motion-reduce:transition-none"
      style={{ transform: lift }}
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
    <svg width={20} height={30} aria-hidden="true" className="shrink-0">
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
