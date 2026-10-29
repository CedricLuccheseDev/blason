import { capture, emblem, figures, icon, key, mercenarySeal } from './hud.js'

// The bar drawn tighter, the mercenaries in it: the purse as the game has it,
// then the four armies as four seals in a row, only the one in hand named,
// with its share and its men; the works and the coups as their emblems and
// their prices alone, their names under the pointer. One row, no word that
// does not change; on a phone, the same in two rows.

const html = capture('minute-3-1920x1080')
const BAR = 'div.w-max:has(button[aria-label="Chevauchée"])'

/** The purse, as the game draws it: the bar's first part, up to its first rule. */
const sheetAt = html.indexOf('shadow-lift flex items-center px-5')
const purse = html.slice(
  html.indexOf('<div class="flex items-center gap-2">', sheetAt),
  html.indexOf('<span aria-hidden="true" class="relative my-3 w-px', sheetAt),
)

const soldier = icon(html, 'soldier', 15)
const coins = icon(html, 'coins', 15)
const gold = 86
const cap = 194
const company = Math.floor(cap / 4)

const armies = [
  ['Chevauchée', emblem(html, 'Chevauchée', 34)],
  ['Ost', emblem(html, 'Ost', 42), true],
  ['Arrière-ban', emblem(html, 'Arrière-ban', 34)],
  ['Mercenaires', mercenarySeal(html, 34)],
]
  .map(
    ([name, seal, held], i) =>
      `<button type="button" aria-label="${name}" class="mq-item${held ? ' mq-held' : ''}"><span class="relative">${seal}${key(i + 1)}</span></button>`,
  )
  .join('')

const [share, men] = figures(html, 'Ost')
const hand = `<div class="mq-hand"><span class="hud-word text-hud-s">Ost</span><span class="hud-figure text-hud-s mq-dim">${share}</span><span class="hud-figure text-hud-s mq-figure">${soldier}${men}</span></div>`

const priced = (names, first, mark) =>
  names
    .map((name, i) => {
      const price = figures(html, name).at(-1)
      const can = Number(price.replace(/\s/g, '')) <= gold
      return `<div class="mq-item${can ? '' : ' mq-dear'}" title="${name}"><span class="relative">${emblem(html, name, 34)}${key(mark(first + i))}</span><span class="hud-figure text-hud-s mq-figure mq-price">${coins}${price}</span></div>`
    })
    .join('')

const works = priced(['Village', 'Marché', 'Château'], 5, (k) => k)
const coups = priced(
  ['Causeur de troubles', 'Archers', 'Feu grégeois'],
  8,
  (k) => (k === 10 ? 0 : k),
)

const rule =
  '<span aria-hidden="true" class="relative my-3 w-px self-stretch bg-quill/30 mx-3"><span class="absolute top-1/2 left-1/2 size-2.5 -translate-1/2 rotate-45 border border-quill bg-gilt"></span></span>'

const bar = `<div class="w-max px-2"><div class="hud-enter relative rounded-md border-[1.5px] border-quill bg-vellum shadow-lift mq-bar"><span aria-hidden="true" class="pointer-events-none absolute inset-[3px] rounded-sm border border-gilt"></span><div class="mq-purse">${purse}</div>${rule}<div class="mq-armies"><div class="mq-row">${armies}</div>${hand}</div>${rule}<div class="mq-row">${works}</div>${rule}<div class="mq-row">${coups}</div></div></div>`

export default {
  title: 'La barre resserrée',
  line: `Les quatre armées en sceaux, mercenaires compris (une compagnie de ${company} hommes pour ${company * 2} or ici) ; seule l’armée en main est nommée ; constructions et coups réduits à leur emblème et leur prix, le nom au survol.`,
  moments: ['minute-3'],
  replace: { [BAR]: bar },
  css: `
.mq-bar { display: flex; align-items: center; padding: calc(6px * var(--hud)) calc(18px * var(--hud)); }
.mq-row { display: flex; align-items: flex-end; gap: calc(10px * var(--hud)); }
.mq-item { display: flex; flex-direction: column; align-items: center; gap: calc(2px * var(--hud)); padding: calc(4px * var(--hud)) calc(6px * var(--hud)); border-radius: 6px; background: none; border: 0; }
.mq-held svg { filter: drop-shadow(0 0 4px color-mix(in srgb, var(--color-gilt) 80%, transparent)); }
.mq-armies { display: flex; flex-direction: column; align-items: center; gap: calc(2px * var(--hud)); }
.mq-hand { display: flex; align-items: baseline; gap: calc(8px * var(--hud)); }
.mq-dim { opacity: 0.7; }
.mq-figure { display: inline-flex; align-items: center; gap: calc(3px * var(--hud)); }
.mq-dear { opacity: 0.5; }
.mq-dear .mq-price { color: var(--color-gules); }
@media (max-width: 640px) {
  .mq-bar { flex-wrap: wrap; justify-content: center; row-gap: 4px; padding: 6px 10px; max-width: calc(100vw - 16px); }
  .mq-bar > span[aria-hidden="true"].relative { display: none; }
  .mq-purse { width: 100%; display: flex; justify-content: center; }
  .mq-row { gap: 4px; }
}
`,
}
