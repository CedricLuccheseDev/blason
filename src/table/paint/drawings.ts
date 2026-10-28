// The drawings painted on the table's things, as SVG: the heater shield and
// its chevron, the suits of the cards, and their vignettes in ink and wash.

/** The heater shield's outline in a box. */
export const heater = (x: number, y: number, w: number, h: number) =>
  `M${x} ${y} H${x + w} V${y + h * 0.46} Q${x + w} ${y + h * 0.84} ${x + w / 2} ${y + h} Q${x} ${y + h * 0.84} ${x} ${y + h * 0.46} Z`

/** The chevron across the shield. */
export const chevron = (x: number, y: number, w: number, h: number) =>
  `M${x} ${y + h * 0.66} L${x + w / 2} ${y + h * 0.3} L${x + w} ${y + h * 0.66} L${x + w} ${y + h * 0.84} L${x + w / 2} ${y + h * 0.48} L${x} ${y + h * 0.84} Z`

/** A shield of a colour, its chevron in a lighter one. */
export function shieldSvg(
  w: number,
  h: number,
  colour: string,
  { stroke = 1.6, chevronColour = '#f6eedb' } = {},
) {
  const box = heater(1, 1, w - 2, h - 2)
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><clipPath id="c"><path d="${box}"/></clipPath>
<path d="${box}" fill="#f6eedb"/><g clip-path="url(#c)"><path d="${box}" fill="${colour}"/><path d="${chevron(1, 1, w - 2, h - 2)}" fill="${chevronColour}" fill-opacity="0.92"/></g>
<path d="${box}" fill="none" stroke="#2b1e12" stroke-width="${stroke}" stroke-linejoin="round"/></svg>`
}

/** The suits of the three cards, drawn on a 24 grid: [path, open]. */
const SUITS = {
  sword: [
    ['M12 2 L14 5.5 V15 H10 V5.5 Z'],
    ['M6.5 15 H17.5 M12 15 V20.5', 1],
    ['M10.5 21.5 A1.5 1.5 0 1 0 13.5 21.5 A1.5 1.5 0 1 0 10.5 21.5 Z'],
  ],
  tower: [
    ['M6 22 V9 H18 V22 Z'],
    ['M5 9 V5 H8 V7 H10.5 V5 H13.5 V7 H16 V5 H19 V9 Z'],
    ['M10 22 V17 A2 2 0 0 1 14 17 V22', 1],
    ['M12 5 V1.5 L15.5 2.6 L12 3.8', 1],
  ],
  lock: [
    ['M6 11 H18 V21 H6 Z'],
    ['M8.5 11 V8 A3.5 3.5 0 0 1 15.5 8 V11 M12 14.5 V17.5', 1],
  ],
} satisfies Record<string, Array<[string, 1?]>>

export type Suit = keyof typeof SUITS

/** A suit's pip, in vellum on gules' ink. */
export function suitSvg(suit: Suit, size: number) {
  const k = size / 24
  const paths = SUITS[suit]
    .map(
      ([d, open]: [string, 1?]) =>
        `<path d="${d}" fill="${open ? 'none' : '#efe3c4'}" stroke="#6e1d16" stroke-width="${1.6 / k}" stroke-linejoin="round" stroke-linecap="round"/>`,
    )
    .join('')
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><g transform="scale(${k})">${paths}</g></svg>`
}

/** A wax blob's outline, a little uneven, as poured. */
function blob(cx: number, cy: number, r: number, n: number, seed: number) {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2
    const rr =
      r *
      (1 +
        0.055 * Math.sin(i * 2.7 + seed) +
        0.04 * Math.cos(i * 1.3 + seed * 2) +
        0.02 * Math.sin(i * 5.1))
    return `${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`
  }).join(' ')
}

const BANNER = (x: number, y: number, c: string) =>
  `<path d="M${x} ${y} V${y - 38}" stroke="#65492f" stroke-width="2"/><circle cx="${x}" cy="${y - 40}" r="2.4" fill="#d9a41e" stroke="#2b1e12" stroke-width="0.8"/><path d="M${x - 12} ${y - 36} H${x + 12} V${y - 16} L${x + 6} ${y - 20} H${x - 6} L${x - 12} ${y - 16} Z" fill="${c}" stroke="#2b1e12" stroke-width="1.2" stroke-linejoin="round"/><path d="M${x - 8} ${y - 30} L${x} ${y - 34} L${x + 8} ${y - 30}" stroke="#fbf4e2" stroke-width="2" fill="none"/>`

const PAWN = (c: string, i: number) => {
  const x = 22 + i * 21
  const y = 64 - Math.sin((i / 6) * Math.PI) * 6
  return `<g transform="translate(${x} ${y}) scale(${i === 3 ? 1.18 : 1})"><ellipse cx="0" cy="0" rx="8" ry="2.6" fill="${c}" stroke="#2b1e12" stroke-width="1"/><path d="M-5 0 Q-3 -9 -3 -16 H3 Q3 -9 5 0 Z" fill="${c}" stroke="#2b1e12" stroke-width="1"/><circle cx="0" cy="-21" r="5.5" fill="${c}" stroke="#2b1e12" stroke-width="1"/><circle cx="-1.8" cy="-23" r="1.6" fill="#fff" opacity="0.45"/></g>`
}

const STONE = (x: number, i: number) =>
  `<circle cx="${x}" cy="${70 + (i % 2) * 3}" r="1.6"/>`

const GROUND = '<rect width="170" height="86" fill="#efe3c4"/>'

/** The vignette of each card, 170 by 86. */
export const VIGNETTES = {
  bots: `<svg viewBox="0 0 170 86">${GROUND}
<path d="M0 62 Q30 46 62 56 Q96 66 122 50 Q148 38 170 46 V86 H0 Z" fill="#cdbf94"/><path d="M0 62 Q30 46 62 56 Q96 66 122 50 Q148 38 170 46" fill="none" stroke="#2b1e12" stroke-width="1.2"/>
<path d="M0 74 Q40 66 80 74 Q124 82 170 70 V86 H0 Z" fill="#b8a97a"/>
${BANNER(38, 54, '#b3302a')}${BANNER(86, 60, '#3f7f4a')}${BANNER(132, 46, '#d9a41e')}
<g fill="#2b1e12" opacity="0.55">${[12, 20, 58, 66, 104, 112, 150, 158].map(STONE).join('')}</g></svg>`,
  online: `<svg viewBox="0 0 170 86">${GROUND}
<path d="M0 66 Q85 52 170 66 V86 H0 Z" fill="#cdbf94" stroke="#2b1e12" stroke-width="1.2"/>
${['#b3302a', '#3f7f4a', '#2f6db5', '#d9a41e', '#7b4e8c', '#2a8f8a', '#c46a2b'].map(PAWN).join('')}
<path d="M85 18 Q78 8 70 10 M85 18 Q92 8 100 10" fill="none" stroke="#2b1e12" stroke-width="1" opacity="0.5"/>
<circle cx="85" cy="22" r="3" fill="#3fae5a" stroke="#2b1e12" stroke-width="0.8"/>
<path d="M76 26 A12 12 0 0 1 94 26 M70 31 A20 20 0 0 1 100 31" fill="none" stroke="#3f7f4a" stroke-width="1.4" stroke-linecap="round" opacity="0.8"/></svg>`,
  private: `<svg viewBox="0 0 170 86">${GROUND}
<g transform="rotate(-6 85 46)"><rect x="40" y="20" width="92" height="54" rx="2" fill="#f6eedb" stroke="#2b1e12" stroke-width="1.3"/><path d="M40 20 L86 52 L132 20" fill="none" stroke="#2b1e12" stroke-width="1.2"/>
<path d="M40 74 L74 46 M132 74 L98 46" fill="none" stroke="#2b1e12" stroke-width="0.8" opacity="0.5"/>
<polygon points="${blob(86, 52, 11, 18, 4)}" fill="#b3302a" stroke="#741c16" stroke-width="1"/><circle cx="86" cy="52" r="7" fill="none" stroke="#741c16" stroke-width="1.2"/></g>
<g transform="rotate(28 120 60)"><circle cx="104" cy="62" r="7" fill="none" stroke="#946512" stroke-width="3"/><path d="M111 62 H140 M132 62 V68 M138 62 V67" fill="none" stroke="#946512" stroke-width="3" stroke-linecap="round"/></g></svg>`,
}
