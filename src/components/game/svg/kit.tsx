import { useId } from 'react'
import { INK, PAPER } from './marks'

// The drawn pieces the HUD's emblems are made of (components/hud/Emblem.tsx),
// the same as on the mockups (design/mockups/kit.py): the filters every
// piece shares, and a lord's shield.

/** The filters every corner shares: the glow of the piece in hand (the others' shadow is CSS, Emblem.tsx). */
export function Defs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true">
      <filter id="blason-glow" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="6" result="b" />
        <feFlood floodColor="var(--color-gilt-light)" floodOpacity="0.95" />
        <feComposite in2="b" operator="in" result="g" />
        <feMerge>
          <feMergeNode in="g" />
          <feMergeNode in="g" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <pattern
        id="blason-hatch"
        width="5"
        height="5"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)"
      >
        <line
          x1="0"
          y1="0"
          x2="0"
          y2="5"
          stroke="var(--color-quill)"
          strokeOpacity="0.22"
          strokeWidth="1"
        />
      </pattern>
    </svg>
  )
}

const heater = (x: number, y: number, w: number, h: number) =>
  `M${x} ${y} H${x + w} V${y + h * 0.46} Q${x + w} ${y + h * 0.84} ${x + w / 2} ${y + h} Q${x} ${y + h * 0.84} ${x} ${y + h * 0.46} Z`

/** A lord's shield and its chevron; with a level, his colour fills it as a vessel, his army against its cap. */
export function Ecu({
  x,
  y,
  w,
  h,
  color,
  level,
}: Readonly<{
  x: number
  y: number
  w: number
  h: number
  color: string
  level?: number
}>) {
  const clip = useId()
  const path = heater(x, y, w, h)
  const top = y + h * (1 - (level ?? 1))
  const chevron = `M${x} ${y + h * 0.66} L${x + w / 2} ${y + h * 0.3} L${x + w} ${y + h * 0.66} L${x + w} ${y + h * 0.84} L${x + w / 2} ${y + h * 0.48} L${x} ${y + h * 0.84} Z`
  return (
    <g>
      <clipPath id={clip}>
        <path d={path} />
      </clipPath>
      <path d={path} fill={PAPER} />
      <g clipPath={`url(#${clip})`}>
        {level === undefined ? (
          <path d={path} fill={color} />
        ) : (
          <>
            <rect x={x} y={y} width={w} height={h} fill="url(#blason-hatch)" />
            <path
              d={`M${x - 2} ${top} Q${x + w * 0.25} ${top - 3} ${x + w / 2} ${top} T${x + w + 2} ${top} V${y + h + 2} H${x - 2} Z`}
              fill={color}
            />
          </>
        )}
        <path
          d={chevron}
          fill={PAPER}
          fillOpacity={level === undefined ? 0.92 : 0.55}
        />
      </g>
      <path
        d={path}
        fill="none"
        stroke={INK}
        strokeWidth={Math.max(1.4, w * 0.04)}
        strokeLinejoin="round"
      />
    </g>
  )
}
