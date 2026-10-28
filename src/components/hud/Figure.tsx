import { Coins } from '../game/svg/coins'
import { Glyph } from '../game/svg/marks'
import { ICON, TEXT } from './tokens'
import type { Mark } from '../game/svg/marks'
import type { ReactNode } from 'react'
import type { Size } from './tokens'

/** A drawing of the HUD's: one of the marks, or a heap of coins. */
export type IconName = Mark | 'coins'

/** An icon of `size` pixels, in ink on parchment. */
export function Icon({
  name,
  size,
}: Readonly<{ name: IconName; size: number }>) {
  const c = size / 2
  return (
    <svg
      width={size}
      height={size}
      aria-hidden="true"
      className="shrink-0 overflow-visible"
    >
      {name === 'coins' ? (
        <Coins cx={c} cy={c} r={size * 0.33} />
      ) : (
        <Glyph name={name} cx={c} cy={c} size={size} sw={1.5} />
      )}
    </svg>
  )
}

const TONES = {
  ink: '',
  dim: 'opacity-70',
  thrive: 'text-thrive',
  gilt: 'text-gilt-deep',
  gules: 'text-gules',
} as const

/** A figure of the HUD, its icon before it, both at one of the four sizes. */
export function Figure({
  icon,
  size = 'm',
  tone = 'ink',
  children,
}: Readonly<{
  icon?: IconName
  size?: Size
  tone?: keyof typeof TONES
  children: ReactNode
}>) {
  return (
    <span
      className={`hud-figure inline-flex items-center gap-1 whitespace-nowrap ${TEXT[size]} ${TONES[tone]}`}
    >
      {icon && <Icon name={icon} size={ICON[size]} />}
      <span>{children}</span>
    </span>
  )
}
