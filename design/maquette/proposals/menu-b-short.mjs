import { shield } from './lords.js'
import { ACTS, CARTOUCHE, SINOPLE } from './menu.js'

// The right click as a short list: a small sheet beside the pointer, the
// lord's name, then three thin lines, each its medallion, its word and its
// figure; no plates, no note.

const lines = ACTS.map(
  (a) =>
    `<button type="button" class="mq-line">${a.medallion(28)}<span class="hud-word text-hud-s">${a.word}</span><span class="mq-fig hud-figure text-hud-s">${a.figure}</span></button>`,
).join('')

const menu = `<div class="pointer-events-none absolute w-max mq-short-at"><div class="hud-enter relative rounded-md border-[1.5px] border-quill bg-vellum shadow-lift mq-short"><span aria-hidden="true" class="pointer-events-none absolute inset-[3px] rounded-sm border border-gilt"></span><div class="mq-short-name">${shield(SINOPLE, 14)}<span class="hud-word text-hud-s">Sinople</span></div>${lines}</div></div>`

export default {
  title: 'Le clic droit en liste courte',
  line: 'Une petite feuille à côté du pointeur : le nom, puis trois lignes fines, chacune son médaillon, son mot et son chiffre.',
  moments: ['minute-3'],
  replace: { [CARTOUCHE]: menu },
  css: `
.mq-short-at { left: calc(50% + 18px * var(--hud)); top: calc(50% + 14px * var(--hud)); }
.mq-short { display: flex; flex-direction: column; padding: calc(6px * var(--hud)) calc(8px * var(--hud)); min-width: calc(160px * var(--hud)); }
.mq-short-name { display: flex; align-items: center; gap: calc(6px * var(--hud)); padding: 0 calc(2px * var(--hud)) calc(4px * var(--hud)); border-bottom: 1px solid color-mix(in srgb, var(--color-gilt) 60%, transparent); margin-bottom: calc(2px * var(--hud)); }
.mq-line { display: flex; align-items: center; gap: calc(8px * var(--hud)); padding: calc(1px * var(--hud)) calc(2px * var(--hud)); background: none; border: 0; border-radius: 4px; }
.mq-fig { margin-left: auto; display: inline-flex; align-items: center; gap: 2px; }
`,
}
