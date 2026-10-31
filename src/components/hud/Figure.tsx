import { Coins } from '../game/svg/coins'
import { Glyph } from '../game/svg/marks'
import { ICON, TEXT, scaled } from './tokens'
import type { Mark } from '../game/svg/marks'
import type { ReactNode } from 'react'
import type { Size } from './tokens'

/** A drawing of the HUD's: one of the marks, or a heap of coins. */
export type IconName = Mark | 'coins'

/** An icon of `size` pixels as drawn (grown by the HUD's scale), on parchment, in the ink of the words around it. */
export function Icon({
  name,
  size,
}: Readonly<{ name: IconName; size: number }>) {
  const c = size / 2
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      style={{ width: scaled(size), height: scaled(size) }}
      aria-hidden="true"
      className="shrink-0 overflow-visible"
    >
      {name === 'coins' ? (
        <Coins cx={c} cy={c} r={size * 0.33} />
      ) : (
        <Glyph
          name={name}
          cx={c}
          cy={c}
          size={size}
          stroke="currentColor"
          sw={1.5}
        />
      )}
    </svg>
  )
}

/** What a figure says, by its colour (app.css): what grows, what falls, what only informs; its icon in the same. */
const TONES = {
  gain: 'hud-gain',
  loss: 'hud-loss',
  info: 'hud-info',
} as const

export type Meaning = keyof typeof TONES

/** A figure of the HUD, its icon before it, both at one of the four sizes, in the colour of what it says: grey unless it grows or falls. */
export function Figure({
  icon,
  size = 'm',
  tone = 'info',
  children,
}: Readonly<{
  icon?: IconName
  size?: Size
  tone?: Meaning
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
