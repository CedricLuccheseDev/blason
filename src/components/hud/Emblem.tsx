import { Ecu } from '../game/svg/kit'
import { Lozenge, Medallion, Plaque, Seal } from '../game/svg/seals'
import { INK } from '../game/svg/marks'
import { LINE_MEDALLION, RAISE, SEAL, SHIELD, box, scaled } from './tokens'
import type { Mark } from '../game/svg/marks'
import type { ReactNode } from 'react'

// The HUD's drawn objects at their fixed sizes, each in its own box so the
// sheets lay them out as they do words: a lord's shield, the wax seal of an
// army or an act, the medallion of a work or of an act on a line, the lozenge
// of a coup, a key of the keyboard (the badges of standing in Standing.tsx).
// Drawn at scale 1, grown by the HUD's scale.

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
      <Ecu x={1} y={1} w={w} h={h} color={color} level={level} />
    </svg>
  )
}

/** A drawn piece's shadow off the page, in ink: the game's drawn matter, wax and gilt lifted off the parchment, not a panel's elevation. */
// norm-ok: a drawn seal's shadow on the page (the art direction), as the SVG filter it replaces.
const SHADOW =
  'drop-shadow(0 calc(2px * var(--hud)) calc(2px * var(--hud)) color-mix(in srgb, var(--color-quill) 38%, transparent))'

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
      // Lifted off the page by a shadow of the whole drawing, not an SVG
      // filter under the half ink of what cannot be paid: that one came out
      // as a square behind the lozenges (« en bas les losanges y'a un carré
      // derrière »); the one in hand glows instead (svg/kit.tsx).
      style={{ ...style, transform: lift, filter: held ? undefined : SHADOW }}
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
  dim = false,
}: Readonly<{
  icon: Mark
  color: string
  size?: keyof typeof SEAL
  held?: boolean
  /** At half ink, inside the drawing (no layer of its own to leave a trace as the bar moves). */
  dim?: boolean
}>) {
  return (
    <Round size={size} held={held}>
      {(at) => (
        <Seal
          {...at}
          icon={icon}
          color={color}
          edge={INK}
          lifted={held}
          dim={dim}
        />
      )}
    </Round>
  )
}

/** A work's square plaque, ringed in gold; raised and glowing when in hand. */
export function WorkEmblem({
  icon,
  size = 'l',
  held = false,
  dim = false,
}: Readonly<{
  icon: Mark
  size?: keyof typeof SEAL
  held?: boolean
  dim?: boolean
}>) {
  return (
    <Round size={size} held={held}>
      {(at) => <Plaque {...at} icon={icon} lifted={held} dim={dim} />}
    </Round>
  )
}

/**
 * An act's medallion on a thin line of a list, ringed in the colour of what
 * it does (the right click's menu: an attack in gules, an alliance in green,
 * an offering in gold): the cartouche's medallion, drawn smaller.
 */
export function ActMedallion({
  icon,
  ring,
  dim = false,
}: Readonly<{ icon: Mark; ring: string; dim?: boolean }>) {
  // The cartouche's box, laid out smaller.
  const side = boxOf('s')
  const c = side / 2
  return (
    <svg
      viewBox={`0 0 ${side} ${side}`}
      style={{
        width: scaled(LINE_MEDALLION),
        height: scaled(LINE_MEDALLION),
        filter: SHADOW,
      }}
      aria-hidden="true"
      className="shrink-0 overflow-visible"
    >
      <Medallion cx={c} cy={c} r={SEAL.s} icon={icon} ring={ring} dim={dim} />
    </svg>
  )
}

/** A coup's lozenge, ringed in gules; raised and glowing when in hand. */
export function CoupEmblem({
  icon,
  size = 'l',
  held = false,
  dim = false,
}: Readonly<{
  icon: Mark
  size?: keyof typeof SEAL
  held?: boolean
  dim?: boolean
}>) {
  return (
    <Round size={size} held={held}>
      {(at) => <Lozenge {...at} icon={icon} lifted={held} dim={dim} />}
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
