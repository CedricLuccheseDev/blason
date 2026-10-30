import { GLYPHS } from '~/render/art/glyphs'

// The icons of the mockups, on their 24 unit square, drawn in ink on
// parchment: the map's own glyphs, and the few the screen adds.

export const INK = 'var(--color-quill)'
export const PAPER = 'var(--color-vellum)'

type Part = { d: string; open?: boolean }

/** A soldier standing, his spear up, centred at x, his head's top at y, at a scale: the troops' figures. */
function man(x: number, y: number, k: number): Array<Part> {
  const f = (n: number) => n.toFixed(2)
  const r = 2.4 * k
  const hy = y + r
  return [
    {
      d: `M${f(x + 4 * k)} ${f(y + 16 * k)} L${f(x + 4 * k)} ${f(y)}`,
      open: true,
    },
    {
      d: `M${f(x - 3.2 * k)} ${f(y + 6 * k)} Q${f(x - 3.2 * k)} ${f(y + 5 * k)} ${f(x - 2 * k)} ${f(y + 5 * k)} H${f(x + 2 * k)} Q${f(x + 3.2 * k)} ${f(y + 5 * k)} ${f(x + 3.2 * k)} ${f(y + 6 * k)} V${f(y + 12.5 * k)} H${f(x - 3.2 * k)} Z`,
    },
    {
      d: `M${f(x - r)} ${f(hy)} A${f(r)} ${f(r)} 0 1 0 ${f(x + r)} ${f(hy)} A${f(r)} ${f(r)} 0 1 0 ${f(x - r)} ${f(hy)} Z`,
    },
    {
      d: `M${f(x - 1.6 * k)} ${f(y + 12.5 * k)} L${f(x - 2 * k)} ${f(y + 16 * k)} M${f(x + 1.6 * k)} ${f(y + 12.5 * k)} L${f(x + 2 * k)} ${f(y + 16 * k)}`,
      open: true,
    },
  ]
}

/** The armies drawn by their size (« la fourche ça fait moins qu'épée »): one man for the raid, two for the host, three for the levy; a man and his gold for the mercenaries. */
const TROOPS = {
  troop1: man(11, 3.5, 1.2),
  troop2: [...man(7.5, 4.5, 1), ...man(15.5, 4.5, 1)],
  troop3: [...man(5.5, 3, 0.82), ...man(17, 3, 0.82), ...man(11.2, 7, 0.82)],
  hireling: [
    ...man(13, 3.5, 1.1),
    { d: 'M2.5 18.5 A3.2 3.2 0 1 0 8.9 18.5 A3.2 3.2 0 1 0 2.5 18.5 Z' },
    { d: 'M5.7 16.6 V20.4', open: true },
  ],
} satisfies Record<string, Array<Part>>

const MORE = {
  soldier: [
    { d: 'M7.35 20.95 L16.95 1.45', open: true },
    { d: 'M16.95 1.45 L15.75 4.3 L18.3 3.1 Z' },
    {
      d: 'M5.7 11.5 Q5.7 10.3 6.9 10.3 H11.4 Q12.6 10.3 12.6 11.5 V18.7 H5.7 Z',
    },
    { d: 'M6.55 7.9 A2.6 2.6 0 1 0 11.75 7.9 A2.6 2.6 0 1 0 6.55 7.9 Z' },
    { d: 'M6.15 7.75 Q9.15 3.25 12.15 7.75 Z' },
    {
      d: 'M11.55 10.6 L16.05 10.6 L16.05 14.2 Q16.05 17.05 13.8 18.1 Q11.55 17.05 11.55 14.2 Z',
    },
    { d: 'M7.2 18.1 L6.3 22.6 M10.95 18.1 L11.85 22.6', open: true },
  ],
  sword: [
    { d: 'M12 2 L14 5.5 V15 H10 V5.5 Z' },
    { d: 'M6.5 15 H17.5 M12 15 V20.5', open: true },
    { d: 'M10.5 21.5 A1.5 1.5 0 1 0 13.5 21.5 A1.5 1.5 0 1 0 10.5 21.5 Z' },
  ],
  hourglass: [
    { d: 'M6 2.5 H18 M6 21.5 H18', open: true },
    { d: 'M7.5 2.5 Q7.5 9 12 12 Q16.5 9 16.5 2.5 Z' },
    { d: 'M7.5 21.5 Q7.5 15 12 12 Q16.5 15 16.5 21.5 Z' },
  ],
  lock: [
    { d: 'M6 11 H18 V21 H6 Z' },
    { d: 'M8.5 11 V8 A3.5 3.5 0 0 1 15.5 8 V11 M12 14.5 V17.5', open: true },
  ],
  // The book of the game's own (« met des icons partout pour tout qui soit
  // très évocatrices »): a bot, the Earth, the legends, a die for the random
  // lands, the level's crown, the teams' banner, a letter to invite, the
  // door out, the way back, a game begun again, the launch's horn.
  bot: [
    {
      d: 'M5 8 H19 Q20.5 8 20.5 9.5 V18 Q20.5 19.5 19 19.5 H5 Q3.5 19.5 3.5 18 V9.5 Q3.5 8 5 8 Z',
    },
    { d: 'M12 8 V4 M9 15.5 H15', open: true },
    { d: 'M7.6 12.5 A1.4 1.4 0 1 0 10.4 12.5 A1.4 1.4 0 1 0 7.6 12.5 Z' },
    { d: 'M13.6 12.5 A1.4 1.4 0 1 0 16.4 12.5 A1.4 1.4 0 1 0 13.6 12.5 Z' },
    { d: 'M10.8 3.5 A1.2 1.2 0 1 0 13.2 3.5 A1.2 1.2 0 1 0 10.8 3.5 Z' },
  ],
  globe: [
    { d: 'M2.5 12 A9.5 9.5 0 1 0 21.5 12 A9.5 9.5 0 1 0 2.5 12 Z' },
    {
      d: 'M2.5 12 H21.5 M12 2.5 Q7 12 12 21.5 M12 2.5 Q17 12 12 21.5 M4.5 6.5 H19.5 M4.5 17.5 H19.5',
      open: true,
    },
  ],
  book: [
    {
      d: 'M12 6 Q8 3.5 2.5 4 V19 Q8 18.5 12 21 Q16 18.5 21.5 19 V4 Q16 3.5 12 6 Z',
    },
    {
      d: 'M12 6 V21 M5 8 Q7.5 7.6 9.5 8.6 M5 11.5 Q7.5 11.1 9.5 12.1',
      open: true,
    },
  ],
  die: [
    { d: 'M5 3 H19 Q21 3 21 5 V19 Q21 21 19 21 H5 Q3 21 3 19 V5 Q3 3 5 3 Z' },
    { d: 'M7 7 A1 1 0 1 0 9 7 A1 1 0 1 0 7 7 Z' },
    { d: 'M11 12 A1 1 0 1 0 13 12 A1 1 0 1 0 11 12 Z' },
    { d: 'M15 17 A1 1 0 1 0 17 17 A1 1 0 1 0 15 17 Z' },
  ],
  crown: [
    { d: 'M3.5 18 L2.5 7 L8 11.5 L12 4.5 L16 11.5 L21.5 7 L20.5 18 Z' },
    { d: 'M3.5 21 H20.5', open: true },
  ],
  banner: [
    { d: 'M5 21.5 V2.5', open: true },
    { d: 'M5 3.5 H19 L16 8 L19 12.5 H5 Z' },
  ],
  letter: [
    { d: 'M2.5 5.5 H21.5 V18.5 H2.5 Z' },
    { d: 'M2.5 5.5 L12 13 L21.5 5.5', open: true },
  ],
  door: [
    { d: 'M5 21.5 V3 H16 V21.5', open: true },
    { d: 'M5 3 L13 5 V21.5 L5 20 Z' },
    { d: 'M18 12 H23 M20.5 9.5 L23 12 L20.5 14.5', open: true },
  ],
  back: [{ d: 'M20 12 H5 M10.5 6 L4.5 12 L10.5 18', open: true }],
  again: [
    {
      d: 'M19.5 12 A7.5 7.5 0 1 1 16.8 6.2 M19.5 3.5 V7.5 H15.5',
      open: true,
    },
  ],
  horn: [
    { d: 'M3 9 H7 L19 3.5 V20.5 L7 15 H3 Z' },
    { d: 'M7 9 V15', open: true },
  ],
  check: [{ d: 'M4 12.5 L9.5 18 L20 6', open: true }],
  cross: [{ d: 'M6 6 L18 18 M18 6 L6 18', open: true }],
  eye: [
    { d: 'M2 12 Q12 3.5 22 12 Q12 20.5 2 12 Z' },
    { d: 'M9 12 A3 3 0 1 0 15 12 A3 3 0 1 0 9 12 Z' },
  ],
  key: [
    { d: 'M3 12 A4 4 0 1 0 11 12 A4 4 0 1 0 3 12 Z' },
    { d: 'M11 12 H21 M17.5 12 V15.5 M20.5 12 V14.5', open: true },
  ],
  plus: [{ d: 'M12 4.5 V19.5 M4.5 12 H19.5', open: true }],
  // A warship: a hull, a sail and its pennant, over the waves.
  warship: [
    { d: 'M2 13.5 H22 L18.5 19 H5.5 Z' },
    { d: 'M12 13.5 V2', open: true },
    { d: 'M12 2 L16.5 3.3 L12 4.6 Z' },
    { d: 'M7 5.8 Q12 4.8 17 5.8 V11.5 Q12 12.5 7 11.5 Z' },
    { d: 'M3 21.8 Q5.5 20.6 8 21.8 Q10.5 23 13 21.8 Q15.5 20.6 18 21.8', open: true },
  ],
  // The whole land raised: the peasant's fork, never a village's house.
  pitchfork: [
    {
      d: 'M12 21.5 V9 M7.5 3 V8 Q7.5 10 12 10 Q16.5 10 16.5 8 V3 M12 3 V10',
      open: true,
    },
  ],
} satisfies Record<string, Array<Part>>

export type Mark = keyof typeof GLYPHS | keyof typeof MORE | keyof typeof TROOPS

const PARTS: Record<Mark, ReadonlyArray<Part>> = {
  ...GLYPHS,
  ...MORE,
  ...TROOPS,
}

/** A mark of `size` pixels centred on (cx, cy). */
export function Glyph({
  name,
  cx,
  cy,
  size,
  fill = PAPER,
  stroke = INK,
  sw = 1.7,
}: Readonly<{
  name: Mark
  cx: number
  cy: number
  size: number
  fill?: string
  stroke?: string
  sw?: number
}>) {
  const k = size / 24
  return (
    <g transform={`translate(${cx - 12 * k} ${cy - 12 * k}) scale(${k})`}>
      {PARTS[name].map((part) => (
        <path
          key={part.d}
          d={part.d}
          fill={part.open ? 'none' : fill}
          stroke={stroke}
          strokeWidth={sw / k}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}
    </g>
  )
}
