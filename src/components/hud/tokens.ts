// The HUD's design system: every piece on the screen is built from these
// measures and from the pieces of this folder, never from measures of its
// own.
//
// One knob scales it all: the HUD's scale, --hud in src/styles/app.css, 1 on
// a phone or a small screen, 1.2 from 1280 by 640. The measures are given as drawn,
// at scale 1; the type, the spacing (inside .hud) and the emblems all grow
// by it together.
//
// In CSS, on Tailwind's own steps (src/styles/app.css):
// - space: 4 (gap-1) between an icon and its figure; 8 (gap-2) between the
//   lines of a piece and between pieces stacked in a corner; 12 (p-3, gap-3)
//   inside a sheet and between the parts of a piece; 16 (p-4) from the edge
//   of the screen; 24 (gap-6) between groups;
// - type: four sizes, hud-s 15, hud-m 18, hud-l 22, hud-xl 28, each a fifth
//   or more above the one before and none under 15, so that every word
//   reads at a glance, through four roles: .hud-word, .hud-name (a lord)
//   and .hud-note (a hint, in italics at full ink) in Vollkorn, .hud-figure
//   in Alegreya Sans;
// - one material, the sheet (Sheet.tsx), one button (Act.tsx), one shadow
//   (shadow-lift), one rounding (rounded-md, its rule rounded-sm);
// - what cannot be had is at half ink (opacity-50).
// - an alliance is green (pact), a war gules, a felony ink on gules; each
//   by its badge (Emblem.tsx, Standing), whose shape says it before its
//   colour does.
// - motion: one curve (ease-hud) and two durations, 120 ms for what is
//   touched and 200 ms for what appears, through two roles: .hud-press on
//   whatever is touched (it lifts under the pointer and sinks when pressed),
//   .hud-enter on every sheet as it appears; a seal in hand rises and grows,
//   gliding; what waits on the map for a click glows (.hud-glow, a seal to
//   renew). Under reduced motion, none of it: the final state
//   at once.
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

/** A drawn measure on the screen: its pixels at scale 1, grown by the HUD's scale. */
export const scaled = (px: number): string => `calc(${px}px * var(--hud))`

/** A drawing's box: drawn on `w` by `h` units, laid out at that size grown by the HUD's scale. */
export const box = (w: number, h: number) => ({
  viewBox: `0 0 ${w} ${h}`,
  style: { width: scaled(w), height: scaled(h) },
})

/** An icon beside a figure, sized on its type. */
export const ICON: Record<Size, number> = { s: 16, m: 18, l: 22, xl: 24 }

/** A lord's shield: inline beside his name, on a letter; in the purse as tall as its two lines of figures (22 × 1.15 twice, 4 between). */
export const SHIELD = {
  xs: { w: 12, h: 15 },
  s: { w: 16, h: 20 },
  m: { w: 28, h: 34 },
  purse: { w: 44, h: 54 },
  l: { w: 52, h: 64 },
} as const

/** A seal's, a medallion's or a lozenge's radius: on the bar, in the cartouche, at its largest. */
export const SEAL = { xs: 13, s: 18, l: 26 } as const

/** An act's medallion on a thin line of a list (the right click's menu): its side, the cartouche's medallion drawn smaller. */
export const LINE_MEDALLION = 28

/** A badge of standing (an ally, a foe, a felon): its diameter, beside a name in a list or on a sheet. */
export const BADGE = { s: 20, m: 24 } as const

/** What a piece in hand grows by and rises. */
export const RAISE = 3
