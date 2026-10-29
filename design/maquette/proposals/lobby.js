import { capture } from './hud.js'
import { shield } from './lords.js'

// What the three proposals of the lobby in the game share (« dans les 2 cas
// on est en game »): the moment "opening", the land of the game seen before
// it is launched; the bar, the count's panel and the sheet they lie on.

export const html = capture('opening-1920x1080')
export const BAR = 'div.w-max:has(button[aria-label="Chevauchée"])'
export const PANEL = 'div.hud-enter:has(> div > span.hud-word.text-hud-l)'

/** The seats: the people come, then the bots that fill the rest. */
export const SEATED = [
  ['Azur', '#2f6db5', 'toi, l’hôte'],
  ['Gueules', '#c0392b', 'Maxime'],
  ['Sinople', '#3e8e41', 'Léa'],
]
export const SEATS = 8

export const sheet = (body, extra = '') =>
  `<div class="hud-enter relative rounded-md border-[1.5px] border-quill bg-vellum shadow-lift ${extra}"><span aria-hidden="true" class="pointer-events-none absolute inset-[3px] rounded-sm border border-gilt"></span>${body}</div>`

const PLATE =
  'pointer-events-auto inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md border-[1.5px] border-quill px-4 font-fell text-hud-m shadow-lift hud-press'
export const act = (word, tone = 'gilt') =>
  `<button type="button" class="${PLATE} ${{ gilt: 'bg-gilt text-quill', plain: 'bg-vellum text-quill', gules: 'bg-gules text-wax' }[tone]}">${word}</button>`

/** The seats in a row: a shield for each person, an empty one for each seat a bot will take. */
export function seats() {
  const people = SEATED.map(
    ([name, color]) => `<span title="${name}">${shield(color, 20)}</span>`,
  ).join('')
  const empty = Array.from(
    { length: SEATS - SEATED.length },
    () => `<span class="mq-empty">${shield('var(--color-vellum)', 20)}</span>`,
  ).join('')
  return `<div class="mq-seats">${people}${empty}</div>`
}

export const rule =
  '<span aria-hidden="true" class="relative my-3 w-px self-stretch bg-quill/30 mx-3"><span class="absolute top-1/2 left-1/2 size-2.5 -translate-1/2 rotate-45 border border-quill bg-gilt"></span></span>'

export const CSS = `
.mq-bar { display: flex; align-items: center; gap: calc(4px * var(--hud)); padding: calc(8px * var(--hud)) calc(18px * var(--hud)); }
.mq-group { display: flex; flex-direction: column; gap: calc(2px * var(--hud)); }
.mq-seats { display: flex; gap: calc(4px * var(--hud)); }
.mq-empty { opacity: 0.45; }
.mq-code { display: flex; align-items: center; gap: calc(10px * var(--hud)); }
.mq-panel { display: flex; flex-direction: column; gap: calc(2px * var(--hud)); padding: calc(10px * var(--hud)) calc(24px * var(--hud)); align-items: center; }
@media (max-width: 640px) {
  .mq-bar { flex-wrap: wrap; justify-content: center; row-gap: 6px; padding: 8px 10px; max-width: calc(100vw - 16px); }
  .mq-bar > span[aria-hidden="true"].relative { display: none; }
}
`
