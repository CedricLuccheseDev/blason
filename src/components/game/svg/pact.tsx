import { useId } from 'react'
import { Glyph, INK, PAPER } from './marks'
import { waxEdge } from './seals'

// The drawn pieces of the alliances on the map (Heralds.tsx), as the
// diplomacy board's direction A draws them: the seal of two lords, parted
// down its middle in their colours, each half pressed or still waiting; the
// ring of the time left round it; the arrow of a seal waiting at the edge
// of the screen, towards where it belongs.

/** One half of a parted seal: its wax pressed in a lord's colour, or the paper still waiting for it. */
function Half({
  clip,
  cx,
  cy,
  r,
  color,
  empty,
}: Readonly<{
  clip: string
  cx: number
  cy: number
  r: number
  color: string
  empty: boolean
}>) {
  return (
    <g clipPath={`url(#${clip})`}>
      <polygon
        points={waxEdge(cx, cy, r)}
        fill={empty ? PAPER : color}
        fillOpacity={empty ? 0.75 : 1}
        stroke={INK}
        strokeWidth={empty ? 1.4 : 1.6}
        strokeDasharray={empty ? '3 3' : undefined}
        strokeLinejoin="round"
      />
      <circle
        cx={cx}
        cy={cy}
        r={r * 0.74}
        fill="none"
        stroke={INK}
        strokeWidth="2"
        strokeOpacity={empty ? 0.35 : 1}
      />
      <Glyph
        name="links"
        cx={cx}
        cy={cy + 0.5}
        size={r}
        fill="var(--color-wax)"
        stroke={INK}
        sw={1.7}
      />
    </g>
  )
}

/** A seal of two lords parted down its middle, the left's colour on the left; a half not yet pressed shows as paper. */
export function PairSeal({
  cx,
  cy,
  r,
  left,
  right,
  leftEmpty = false,
  rightEmpty = false,
}: Readonly<{
  cx: number
  cy: number
  r: number
  left: string
  right: string
  leftEmpty?: boolean
  rightEmpty?: boolean
}>) {
  const id = useId()
  const [l, rr] = [`${id}l`, `${id}r`]
  // The crack runs down the middle, a little jagged, so that the halves may part.
  const crack = `L${cx - 3} ${cy - r * 0.2} L${cx + 3} ${cy + r * 0.3} L${cx} ${cy + r * 2}`
  return (
    <g>
      <defs>
        <clipPath id={l}>
          <path
            d={`M${cx - r * 2} ${cy - r * 2} H${cx + 1} ${crack} H${cx - r * 2} Z`}
          />
        </clipPath>
        <clipPath id={rr}>
          <path
            d={`M${cx + r * 2} ${cy - r * 2} H${cx + 1} ${crack} H${cx + r * 2} Z`}
          />
        </clipPath>
      </defs>
      <Half clip={l} {...{ cx, cy, r }} color={left} empty={leftEmpty} />
      <Half clip={rr} {...{ cx, cy, r }} color={right} empty={rightEmpty} />
    </g>
  )
}

/** A circle's outline as a path, to cut a band out of two. */
const loop = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0 Z`

/**
 * The time left as a gauge in a round band between `inner` and `outer`: its
 * colour fills it from the bottom up to the share `frac` still to run, and
 * sinks as it runs out (« les timer en rond on voit mal, fais une jauge dans
 * un rond mais vertical comme openfront »).
 */
export function TimeGauge({
  cx,
  cy,
  inner,
  outer,
  frac,
  color,
}: Readonly<{
  cx: number
  cy: number
  inner: number
  outer: number
  frac: number
  color: string
}>) {
  const clip = useId()
  const band = `${loop(cx, cy, outer)} ${loop(cx, cy, inner)}`
  const level = cy + outer - 2 * outer * Math.max(0, Math.min(1, frac))
  return (
    <g>
      <defs>
        <clipPath id={clip}>
          <rect
            x={cx - outer}
            y={level}
            width={2 * outer}
            height={cy + outer - level}
          />
        </clipPath>
      </defs>
      <path d={band} fill={PAPER} fillRule="evenodd" />
      <path
        d={band}
        fill={color}
        fillRule="evenodd"
        clipPath={`url(#${clip})`}
      />
      <path d={band} fill="none" stroke={INK} strokeWidth="1.3" />
    </g>
  )
}

/** On a seal waiting at the edge of the screen, an arrow out of its ring towards where it belongs. */
export function EdgeArrow({
  cx,
  cy,
  r,
  angle,
}: Readonly<{ cx: number; cy: number; r: number; angle: number }>) {
  return (
    <path
      d={`M${r + 11} 0 L${r + 2} -6 L${r + 2} 6 Z`}
      transform={`translate(${cx} ${cy}) rotate(${(angle * 180) / Math.PI})`}
      fill={INK}
      stroke={PAPER}
      strokeWidth="1"
      strokeLinejoin="round"
    />
  )
}
