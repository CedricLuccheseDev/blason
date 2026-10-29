import { shield } from './lords.js'
import { ACTS, CARTOUCHE, SINOPLE } from './menu.js'

// The right click as a crown: three medallions in an arc over the pointer,
// a word under each, the lord's name above them; no sheet, the map seen
// between them. As light as a menu can be, in the bar's own medallions.

const crown = ACTS.map(
  (a, i) =>
    `<button type="button" class="mq-act mq-act-${i}">${a.medallion(46)}<span class="mq-word hud-word text-hud-s">${a.word}</span>${a.figure ? `<span class="mq-fig hud-figure text-hud-s">${a.figure}</span>` : ''}</button>`,
).join('')

const menu = `<div class="pointer-events-none absolute mq-crown"><div class="mq-crown-name">${shield(SINOPLE, 16)}<span class="hud-name">Sinople</span></div>${crown}</div>`

export default {
  title: 'Le clic droit en couronne',
  line: 'Trois médaillons en arc au-dessus du pointeur, un mot sous chacun, le nom du seigneur au-dessus : rien d’autre, la carte visible entre eux.',
  moments: ['minute-3'],
  replace: { [CARTOUCHE]: menu },
  css: `
.mq-crown { left: 50%; top: 50%; width: 0; height: 0; }
.mq-crown-name { position: absolute; left: 0; top: calc(-150px * var(--hud)); transform: translateX(-50%); display: flex; align-items: center; gap: calc(6px * var(--hud)); white-space: nowrap; padding: calc(2px * var(--hud)) calc(10px * var(--hud)); background: color-mix(in srgb, var(--color-vellum) 88%, transparent); border: 1px solid var(--color-quill); border-radius: 4px; box-shadow: var(--shadow-lift); }
.mq-act { position: absolute; display: flex; flex-direction: column; align-items: center; gap: 0; transform: translate(-50%, -50%); background: none; border: 0; padding: 0; filter: drop-shadow(0 2px 2px rgb(43 30 18 / 0.35)); }
.mq-act-0 { left: calc(-74px * var(--hud)); top: calc(-54px * var(--hud)); }
.mq-act-1 { left: 0; top: calc(-92px * var(--hud)); }
.mq-act-2 { left: calc(74px * var(--hud)); top: calc(-54px * var(--hud)); }
.mq-word { padding: 0 calc(5px * var(--hud)); background: color-mix(in srgb, var(--color-vellum) 88%, transparent); border-radius: 3px; line-height: 1.15; }
.mq-fig { display: inline-flex; align-items: center; gap: 2px; padding: 0 calc(4px * var(--hud)); background: color-mix(in srgb, var(--color-vellum) 88%, transparent); border-radius: 3px; line-height: 1.1; }
`,
}
