import { capture, emblem, figures, icon } from './hud.js'
import { allyBadge } from './lords.js'

// The right click on another lord's land, as Cédric asked: a small menu at
// the pointer with the three things one does to a neighbour, attack him
// with the army in hand, offer him an alliance, give him an offering; his
// shield, his name and where he stands above them. In place of the
// cartouche that shows today beside the pointer (here at the middle of the
// screen, over Sinople's land).

const html = capture('minute-3-1920x1080')
const CARTOUCHE = 'main > div.pointer-events-none.absolute.w-max'

const soldier = icon(html, 'soldier', 16)
const coins = icon(html, 'coins', 16)
const [, men] = figures(html, 'Ost')
const gift = Math.floor(86 / 4)

const shield = `<svg viewBox="0 0 18 22" aria-hidden="true" class="shrink-0 overflow-visible" style="width: calc(22px * var(--hud)); height: calc(27px * var(--hud));"><g><clipPath id="mq-menu-shield"><path d="M1 1 H17 V10.2 Q17 17.8 9 21 Q1 17.8 1 10.2 Z"></path></clipPath><path d="M1 1 H17 V10.2 Q17 17.8 9 21 Q1 17.8 1 10.2 Z" fill="var(--color-vellum)"></path><g clip-path="url(#mq-menu-shield)"><path d="M1 1 H17 V10.2 Q17 17.8 9 21 Q1 17.8 1 10.2 Z" fill="#3e8e41"></path><path d="M1 14.2 L9 7 L17 14.2 L17 17.8 L9 10.6 L1 17.8 Z" fill="var(--color-vellum)" fill-opacity="0.92"></path></g><path d="M1 1 H17 V10.2 Q17 17.8 9 21 Q1 17.8 1 10.2 Z" fill="none" stroke="var(--color-quill)" stroke-width="1.4" stroke-linejoin="round"></path></g></svg>`

// The ally's links, as the lords' list draws them.
const links = allyBadge(20)

const PLATE =
  'pointer-events-auto inline-flex min-h-11 w-full items-center gap-2 rounded-md border-[1.5px] border-quill px-3 font-fell text-hud-m shadow-lift hud-press'

const menu = `<div class="pointer-events-none absolute w-max mq-menu-at"><div class="hud-enter relative rounded-md border-[1.5px] border-quill bg-vellum shadow-lift flex flex-col gap-2 p-3 mq-menu"><span aria-hidden="true" class="pointer-events-none absolute inset-[3px] rounded-sm border border-gilt"></span><div class="flex items-center gap-2">${shield}<span class="hud-name">Sinople</span><span class="hud-figure text-hud-s mq-dim">5 %</span><span class="hud-figure text-hud-s mq-figure">${soldier}152</span></div><button type="button" class="${PLATE} bg-gules text-wax">${emblem(html, 'Ost', 26)}<span>Attaquer</span><span class="hud-figure text-hud-s mq-figure mq-end">${soldier.replace('var(--color-quill)', 'currentColor')}${men}</span></button><button type="button" class="${PLATE} bg-pact-deep text-vellum">${links}<span>Proposer l’alliance</span></button><button type="button" class="${PLATE} bg-gilt text-quill">${coins}<span>Offrande</span><span class="hud-figure text-hud-s mq-figure mq-end">${coins}${gift}</span></button><span class="hud-note mq-dim">un clic gauche attaque toujours sans menu</span></div></div>`

export default {
  title: 'Le clic droit : attaquer, l’alliance, l’offrande',
  line: `Un clic droit sur la terre d’un voisin ouvre ce menu au pointeur ; l’offrande donne ici un quart de ton or (${gift}), sa règle reste à décider.`,
  moments: ['minute-3'],
  replace: { [CARTOUCHE]: menu },
  css: `
.mq-menu-at { left: calc(50% + 24px * var(--hud)); top: calc(50% + 20px * var(--hud)); }
.mq-menu { width: calc(280px * var(--hud)); }
.mq-dim { opacity: 0.7; }
.mq-figure { display: inline-flex; align-items: center; gap: calc(3px * var(--hud)); }
.mq-end { margin-left: auto; }
@media (max-width: 640px) {
  .mq-menu-at { left: 50%; top: auto; bottom: 230px; transform: translateX(-50%); }
}
`,
}
