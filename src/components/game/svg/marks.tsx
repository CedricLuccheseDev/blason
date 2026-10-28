import { GLYPHS } from '~/render/art/glyphs'

// The icons of the mockups, on their 24 unit square, drawn in ink on
// parchment: the map's own glyphs, and the few the screen adds.

export const INK = 'var(--color-quill)'
export const PAPER = 'var(--color-vellum)'

type Part = { d: string; open?: boolean }

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
  // The whole land raised: the peasant's fork, never a village's house.
  pitchfork: [
    {
      d: 'M12 21.5 V9 M7.5 3 V8 Q7.5 10 12 10 Q16.5 10 16.5 8 V3 M12 3 V10',
      open: true,
    },
  ],
} satisfies Record<string, Array<Part>>

export type Mark = keyof typeof GLYPHS | keyof typeof MORE

const PARTS: Record<Mark, ReadonlyArray<Part>> = { ...GLYPHS, ...MORE }

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
