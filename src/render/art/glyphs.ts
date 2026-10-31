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
  // An anchor: a port, its ring, its stock and its arms.
  port: [
    { d: 'M12 5.6 V20.6 M8 9 H16', open: true },
    { d: 'M4.4 13.6 Q5.6 20.6 12 20.6 Q18.4 20.6 19.6 13.6', open: true },
    { d: 'M10.2 3.8 A1.8 1.8 0 1 0 13.8 3.8 A1.8 1.8 0 1 0 10.2 3.8 Z' },
  ],
  // A shield broken in two, its halves pulled apart along the crack: a
  // felon, never to be read as a lord's whole shield.
  felon: [
    {
      d: 'M10.6 2.6 L2.8 5.6 V11.8 Q2.8 18.2 10.6 21.4 L9 15.2 L11.6 11.2 L8.6 8 Z',
    },
    {
      d: 'M13.4 2.6 L21.2 5.6 V11.8 Q21.2 18.2 13.4 21.4 L11.8 15.2 L14.4 11.2 L11.4 8 Z',
    },
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
  // The coups, each its own shape before its colour (rules.ts, COUPS). A
  // torch held up: the troublemaker who sets a land against its lord.
  torch: [
    {
      d: 'M12 1.8 Q17 6.4 15.7 9.2 Q15 10.6 12 10.6 Q9 10.6 8.3 9.2 Q7 6.4 12 1.8 Z',
    },
    { d: 'M8.6 10.6 H15.4 V12.8 H8.6 Z' },
    { d: 'M9.9 12.8 H14.1 L13 21.8 H11 Z' },
    { d: 'M12 5.4 Q13.8 7.6 12 9.4 Q10.2 7.6 12 5.4', open: true },
  ],
  // A bow drawn, its arrow nocked: the archers' volley.
  bow: [
    { d: 'M8 2.4 Q21.5 12 8 21.6 M8 2.4 V21.6', open: true },
    {
      d: 'M2.6 12 H19.6 M2.6 12 L1.4 9.8 M2.6 12 L1.4 14.2 M4.6 12 L3.4 9.8 M4.6 12 L3.4 14.2',
      open: true,
    },
    { d: 'M22.6 12 L18.6 9.6 L19.6 12 L18.6 14.4 Z' },
  ],
  // A trebuchet: its frame, its arm swung on the pivot, the counterweight at
  // its short end and the stone in the sling at its long one.
  trebuchet: [
    { d: 'M2.6 21.6 H21.4 M5.4 21.6 L12 10.6 L18.6 21.6', open: true },
    { d: 'M3.4 3.6 L17.4 15.4', open: true },
    { d: 'M14.8 15.2 H20.4 V20 H14.8 Z' },
    { d: 'M3.4 3.6 V7.4', open: true },
    { d: 'M1.8 9 A1.6 1.6 0 1 0 5 9 A1.6 1.6 0 1 0 1.8 9 Z' },
  ],
} satisfies Record<string, Array<Part>>

export type Icon = keyof typeof GLYPHS
