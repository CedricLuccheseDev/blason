import { INK } from './marks'

// The small pieces of the mockups: a coin and a heap of them.

function Coin({ cx, cy, r }: Readonly<{ cx: number; cy: number; r: number }>) {
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="var(--color-gilt)"
        stroke={INK}
        strokeWidth={Math.max(0.9, r * 0.14)}
      />
      <circle
        cx={cx}
        cy={cy}
        r={r * 0.68}
        fill="none"
        stroke="var(--color-gilt-deep)"
        strokeWidth={Math.max(0.6, r * 0.12)}
      />
      <path
        d={`M${cx - r * 0.5} ${cy - r * 0.2} Q${cx - r * 0.3} ${cy - r * 0.6} ${cx + r * 0.1} ${cy - r * 0.6}`}
        fill="none"
        stroke="var(--color-gilt-light)"
        strokeWidth={Math.max(0.6, r * 0.16)}
        strokeLinecap="round"
      />
    </g>
  )
}

export function Coins({
  cx,
  cy,
  r,
}: Readonly<{ cx: number; cy: number; r: number }>) {
  return (
    <g>
      <Coin cx={cx - r * 0.35} cy={cy + r * 0.45} r={r} />
      <Coin cx={cx + r * 0.35} cy={cy + r * 0.2} r={r} />
      <Coin cx={cx} cy={cy - r * 0.25} r={r} />
    </g>
  )
}
