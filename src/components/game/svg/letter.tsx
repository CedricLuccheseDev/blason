import { INK, PAPER } from './marks'
import { PairSeal, TimeRing } from './pact'

// The herald's letter (HeraldLetter.tsx): a folded sheet standing a little
// askew, its flap creased, two lines of writing showing, sealed in the
// sender's colour, the gold ring of the time his offer stands round the
// seal. Broken, the seal's two halves fly apart (.hud-broken).

/** The letter's box, its seal's radius and its seal's middle, as drawn at the HUD's scale 1. */
export const LETTER = { w: 120, h: 104, r: 26, cy: 44 }

export function SealedLetter({
  color,
  frac,
  broken,
  k = 1,
}: Readonly<{ color: string; frac: number; broken: boolean; k?: number }>) {
  const [cx, cy, r] = [(LETTER.w / 2) * k, LETTER.cy * k, LETTER.r * k]
  const [hw, hh] = [44 * k, 28 * k]
  return (
    <g>
      <g transform={`rotate(-7 ${cx} ${cy})`}>
        <rect
          x={cx - hw}
          y={cy - hh}
          width={2 * hw}
          height={58 * k}
          rx="2"
          fill={PAPER}
          stroke={INK}
          strokeWidth="1.5"
        />
        <path
          d={`M${cx - hw} ${cy - hh} L${cx} ${cy + 4 * k} L${cx + hw} ${cy - hh}`}
          fill="none"
          stroke={INK}
          strokeWidth="1"
          opacity=".55"
        />
        <path
          d={`M${cx - 38 * k} ${cy + 18 * k} h${30 * k} M${cx + 10 * k} ${cy + 18 * k} h${26 * k}`}
          stroke={INK}
          strokeWidth="1"
          opacity=".35"
        />
      </g>
      <TimeRing
        cx={cx}
        cy={cy}
        r={r + 7 * k}
        frac={frac}
        color="var(--color-gilt)"
        width={4}
      />
      <g className={broken ? 'hud-broken' : undefined}>
        <PairSeal cx={cx} cy={cy} r={r} left={color} right={color} />
      </g>
    </g>
  )
}
