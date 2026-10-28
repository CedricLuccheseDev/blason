// The HUD's design system: every piece on the screen is built from these
// measures and from the pieces of this folder, never from measures of its
// own.
//
// In CSS, on Tailwind's own steps (src/styles/app.css):
// - space: 4 (gap-1) between an icon and its figure; 8 (gap-2) between the
//   lines of a piece and between pieces stacked in a corner; 12 (p-3, gap-3)
//   inside a sheet and between the parts of a piece; 16 (p-4) from the edge
//   of the screen; 24 (gap-6) between groups;
// - type: four sizes, hud-s 13, hud-m 16, hud-l 20, hud-xl 28, through four
//   roles: .hud-word, .hud-name (a lord) and .hud-note (a hint) in IM Fell,
//   .hud-figure in Alegreya Sans;
// - one material, the sheet (Sheet.tsx), one button (Act.tsx), one shadow
//   (shadow-lift), one rounding (rounded-md, its rule rounded-sm);
// - what cannot be had is at half ink (opacity-50).
// - motion: one curve (ease-hud) and two durations, 120 ms for what is
//   touched and 200 ms for what appears, through two roles: .hud-press on
//   whatever is touched (it lifts under the pointer and sinks when pressed),
//   .hud-enter on every sheet as it appears; a seal in hand rises and grows,
//   gliding. Under reduced motion, none of it: the final state at once.
//
// In the drawings, below: the icons, shields and seals, each in fixed sizes.

/** A type size, the same names as the CSS's. */
export type Size = 's' | 'm' | 'l' | 'xl'

export const TEXT: Record<Size, string> = {
  s: 'text-hud-s',
  m: 'text-hud-m',
  l: 'text-hud-l',
  xl: 'text-hud-xl',
}

/** An icon beside a figure, sized on its type. */
export const ICON: Record<Size, number> = { s: 14, m: 16, l: 20, xl: 24 }

/** A lord's shield: inline beside his name, on a letter, in the purse. */
export const SHIELD = {
  s: { w: 16, h: 20 },
  m: { w: 28, h: 34 },
  l: { w: 52, h: 64 },
} as const

/** A seal's or a medallion's radius: in the cartouche, on the bar. */
export const SEAL = { s: 18, l: 26 } as const

/** What a piece in hand grows by and rises. */
export const RAISE = 3
