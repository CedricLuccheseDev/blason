import { readFileSync } from 'node:fs'

// The game's own drawings and figures, read from a capture (captures/), so
// that a proposal draws with the very emblems and numbers of its moment:
// a button's emblem by its label, its figures in the order it shows them.

const captured = new Map()

/** A capture's HUD markup, read once. */
export function capture(name) {
  if (!captured.has(name))
    captured.set(
      name,
      readFileSync(
        new URL(`../captures/${name}.html`, import.meta.url),
        'utf8',
      ),
    )
  return captured.get(name)
}

/** The markup of the element a label opens, as far as its first svg's end and a little after. */
function after(html, label) {
  const at = html.indexOf(`aria-label="${label}"`)
  if (at < 0) throw new Error(`No "${label}" in the capture`)
  return html.slice(at, at + 9000)
}

/** A button's emblem, its first svg, drawn so many pixels wide, standing still. */
export function emblem(html, label, px) {
  const svg = after(html, label).match(/<svg[\s\S]*?<\/svg>/)[0]
  return svg
    .replace(
      /style="[^"]*"/,
      `style="width: calc(${px}px * var(--hud)); height: calc(${px}px * var(--hud));"`,
    )
    .replace(/ class="[^"]*"/, ' class="shrink-0 overflow-visible"')
}

/** The figures a button shows, in order (its men, its price). */
export function figures(html, label) {
  const button = after(html, label).split('</button>')[0]
  return [...button.matchAll(/<span>([^<]+)<\/span>/g)].map((m) => m[1])
}

/** The small icons of the figures: a soldier and a heap of coins. */
export function icon(html, which, px = 16) {
  const label = which === 'soldier' ? 'Chevauchée' : 'Village'
  const button = after(html, label).split('</button>')[0]
  const svgs = button.match(/<svg[\s\S]*?<\/svg>/g)
  return svgs[svgs.length - 1].replace(
    /style="[^"]*"/,
    `style="width: calc(${px}px * var(--hud)); height: calc(${px}px * var(--hud));"`,
  )
}

/** The army seal with another glyph at its heart: the market's purse, for the mercenaries. */
export function mercenarySeal(html, px) {
  const seal = emblem(html, 'Chevauchée', px)
  const purse = after(html, 'Marché')
    .match(/<svg[\s\S]*?<\/svg>/)[0]
    .match(/<g transform="translate[^"]*">([\s\S]*?)<\/g><\/g><\/svg>/)[1]
  // In gold, paid in gold: apart from the three levied at a village at a glance.
  return seal
    .replace('fill="var(--color-vellum)"', 'fill="var(--color-gilt)"')
    .replace(
      /<g transform="translate\(15 15\.5\) scale\(0\.75\)">[\s\S]*?<\/g><\/g><\/svg>/,
      `<g transform="translate(15 15) scale(0.75)">${purse}</g></g></svg>`,
    )
}

/** The HUD's key badge, a lozenge with the key in it, at an emblem's top right. */
export const key = (k) =>
  `<span class="absolute -top-1 -right-3"><span class="relative grid size-6 place-items-center"><span class="absolute inset-[3px] rotate-45 border-[1.5px] border-quill bg-vellum"></span><span class="hud-figure relative text-hud-s">${k}</span></span></span>`

/** The sheet of the HUD round a piece, its gilt rule inside. */
export const sheet = (body, extra = '') =>
  `<div class="hud-enter relative rounded-md border-[1.5px] border-quill bg-vellum shadow-lift ${extra}"><span class="pointer-events-none absolute inset-[3px] rounded-sm border border-gilt"></span>${body}</div>`

/** The glyph at an emblem's heart, its paths alone (drawn on 24 units). */
export function glyph(html, label) {
  const svg = after(html, label).match(/<svg[\s\S]*?<\/svg>/)[0]
  const groups = [
    ...svg.matchAll(/<g transform="translate[^"]*">([\s\S]*?)<\/g>/g),
  ]
  return groups.at(-1)[1]
}

/** A medallion as the bar's works are drawn: parchment, ink, a ring of a colour, a glyph at its heart; so many pixels wide. */
export const medallion = (paths, ring, px) =>
  `<svg viewBox="0 0 48 48" aria-hidden="true" class="shrink-0 overflow-visible" style="width: calc(${px}px * var(--hud)); height: calc(${px}px * var(--hud));"><circle cx="24" cy="24" r="18" fill="var(--color-vellum)" stroke="var(--color-quill)" stroke-width="2"></circle><circle cx="24" cy="24" r="14" fill="none" stroke="${ring}" stroke-width="2.6"></circle><g transform="translate(13.92 13.92) scale(0.84)">${paths}</g></svg>`
