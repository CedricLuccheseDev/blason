import type { ReactNode } from 'react'
import type { About } from '~/i18n/about'

// The diagrams of "How it works", one per mechanism: inline SVG in the
// site's own colours, words from src/i18n/about.ts.

type Words = About['t']

const W = 600
const BOX_H = 40

/** A step of a mechanism: a box with its word, the accent marking what matters. */
function Box({
  x,
  y,
  w,
  label,
  strong = false,
}: Readonly<{
  x: number
  y: number
  w: number
  label: string
  strong?: boolean
}>) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={BOX_H}
        fill="var(--color-paper)"
        stroke={strong ? 'var(--color-accent)' : 'currentColor'}
        strokeWidth={strong ? 2 : 1}
      />
      <text
        x={x + w / 2}
        y={y + BOX_H / 2 + 5}
        textAnchor="middle"
        fontSize="14"
        fill="currentColor"
      >
        {label}
      </text>
    </g>
  )
}

/** An arrow from one point to another, its head at the end. */
function Arrow({
  from,
  to,
}: Readonly<{ from: [number, number]; to: [number, number] }>) {
  const [x1, y1] = from
  const [x2, y2] = to
  const a = Math.atan2(y2 - y1, x2 - x1)
  const head = (s: number) =>
    `${x2 - 8 * Math.cos(a + s)},${y2 - 8 * Math.sin(a + s)}`
  return (
    <g stroke="var(--color-dim)" fill="var(--color-dim)">
      <line x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="1.2" />
      <polygon points={`${x2},${y2} ${head(0.45)} ${head(-0.45)}`} />
    </g>
  )
}

function Frame({
  h,
  label,
  children,
}: Readonly<{ h: number; label: string; children: ReactNode }>) {
  return (
    <svg
      viewBox={`0 0 ${W} ${h}`}
      role="img"
      aria-label={label}
      className="w-full"
    >
      {children}
    </svg>
  )
}

/** A seed, then cells, a coast, tiles and the standards planted: the land of a game. */
export function SeedDiagram({ t }: Readonly<{ t: Words }>) {
  const steps = [t.seed, t.cells, t.coast, t.tiles, t.standards]
  // Each box as wide as its word, the room left shared out between them.
  const widths = steps.map((label) => Math.max(80, label.length * 7.6 + 16))
  const gap =
    (W - 20 - widths.reduce((sum, w) => sum + w, 0)) / (steps.length - 1)
  const xs = widths.map((_, i) =>
    widths.slice(0, i).reduce((sum, w) => sum + w + gap, 10),
  )
  return (
    <Frame h={70} label={steps.join(', ')}>
      {steps.map((label, i) => (
        <g key={label}>
          <Box x={xs[i]} y={15} w={widths[i]} label={label} strong={i === 0} />
          {i > 0 && <Arrow from={[xs[i] - gap + 2, 35]} to={[xs[i] - 2, 35]} />}
        </g>
      ))}
    </Frame>
  )
}

/** The orders of the player and the bots, checked, then the rules of a tick move the state; ten times a second. */
export function StepDiagram({ t }: Readonly<{ t: Words }>) {
  return (
    <Frame h={150} label={`${t.orders}, ${t.valid}, ${t.rules}, ${t.state}`}>
      <Box x={10} y={15} w={80} label={t.player} />
      <Box x={10} y={75} w={80} label={t.bots} />
      <Arrow from={[92, 35]} to={[128, 60]} />
      <Arrow from={[92, 95]} to={[128, 70]} />
      <Box x={130} y={45} w={90} label={t.orders} />
      <Arrow from={[222, 65]} to={[248, 65]} />
      <Box x={250} y={45} w={90} label={t.valid} />
      <Arrow from={[342, 65]} to={[368, 65]} />
      <Box x={370} y={45} w={140} label={t.rules} strong />
      <Arrow from={[512, 65]} to={[528, 65]} />
      <Box x={530} y={45} w={60} label={t.state} />
      <path
        d="M560 87 V125 H440 V89"
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="1.2"
      />
      <Arrow from={[440, 100]} to={[440, 88]} />
      <text
        x={500}
        y={142}
        textAnchor="middle"
        fontSize="13"
        fill="var(--color-dim)"
      >
        {t.tick}
      </text>
    </Frame>
  )
}

/** The state drawn every frame as the map, and read once a second for the HUD's figures. */
export function ScreenDiagram({ t }: Readonly<{ t: Words }>) {
  return (
    <Frame
      h={150}
      label={`${t.state}, ${t.scene}, ${t.map}, ${t.summary}, ${t.hud}`}
    >
      <Box x={10} y={55} w={80} label={t.state} strong />
      <Arrow from={[92, 65]} to={[198, 35]} />
      <Arrow from={[92, 85]} to={[198, 115]} />
      <text
        x={140}
        y={30}
        textAnchor="middle"
        fontSize="13"
        fill="var(--color-dim)"
      >
        {t.frame}
      </text>
      <text
        x={140}
        y={135}
        textAnchor="middle"
        fontSize="13"
        fill="var(--color-dim)"
      >
        {t.second}
      </text>
      <Box x={200} y={15} w={120} label={t.scene} />
      <Arrow from={[322, 35]} to={[388, 35]} />
      <Box x={390} y={15} w={120} label={t.map} />
      <Box x={200} y={95} w={120} label={t.summary} />
      <Arrow from={[322, 115]} to={[388, 115]} />
      <Box x={390} y={95} w={120} label={t.hud} />
    </Frame>
  )
}
