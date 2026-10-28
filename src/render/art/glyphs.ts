// The drawings of the icons, on a 24 by 24 square, shared by the map's
// badges and the cards around it: parchment shapes with an ink stroke. Plain
// data, so the page can draw them without the game's renderer.

export type Part = { d: string; open?: boolean }

export const GLYPHS = {
  village: [
    { d: 'M3 21 V13 L7.5 8.5 L12 13 V21 Z' },
    { d: 'M12 21 V11 L16.5 6.5 L21 11 V21 Z' },
    { d: 'M6 21 V17 H9 V21 M15 14.5 H18', open: true },
  ],
  castle: [
    {
      d: 'M2.5 21 V11 H5.2 V8 H7.9 V11 H10.6 V8 H13.4 V11 H16.1 V8 H18.8 V11 H21.5 V21 Z',
    },
    { d: 'M2.5 16 H21.5 M8 11 V16 M16 11 V16 M12 16 V21', open: true },
  ],
  // A purse of gold: what a market brings, and a shape no other work has.
  market: [
    {
      d: 'M7.2 9.2 Q3 13.2 4.4 17.6 Q6 21.6 12 21.6 Q18 21.6 19.6 17.6 Q21 13.2 16.8 9.2 Z',
    },
    { d: 'M8.6 9.2 L7 4.4 Q9.6 6.2 12 3.8 Q14.4 6.2 17 4.4 L15.4 9.2 Z' },
    {
      d: 'M8 9.2 H16 M12 12.4 V18.6 M9.8 14 Q12 12.6 14.2 14 Q12 15.6 9.8 17.2 Q12 18.6 14.2 17.2',
      open: true,
    },
  ],
  // Two tents and a pennant: where the armies are raised and sent from.
  barracks: [
    { d: 'M2 21 L7.5 12 L13 21 Z' },
    { d: 'M11 21 L16.5 12 L22 21 Z' },
    { d: 'M12 12 V3 M7.5 21 V17 M16.5 21 V17', open: true },
    { d: 'M12 3 L18 4.6 L12 6.2 Z' },
  ],
  felon: [
    { d: 'M12 2.5 L20 5.6 V11.8 Q20 18.2 12 21.5 Q4 18.2 4 11.8 V5.6 Z' },
    { d: 'M12.6 2.8 L10.6 8 L13.6 11.2 L10.4 15.2 L12 21.2', open: true },
  ],
  // Two links of a chain: an alliance.
  links: [
    {
      d: 'M3 12 A4.5 4.5 0 0 1 7.5 7.5 H11 A4.5 4.5 0 0 1 11 16.5 H7.5 A4.5 4.5 0 0 1 3 12 Z',
      open: true,
    },
    {
      d: 'M13 7.5 H16.5 A4.5 4.5 0 0 1 16.5 16.5 H13 A4.5 4.5 0 0 1 13 7.5 Z',
      open: true,
    },
  ],
} satisfies Record<string, Array<Part>>

export type Icon = keyof typeof GLYPHS
