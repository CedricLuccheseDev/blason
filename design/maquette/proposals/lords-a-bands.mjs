import { LIST, LORDS, allyBadge, percent, sheet, shield } from './lords.js'

// The lords in bands: every one on a thin line, the band behind it in his
// colour as long as his share of the land against the first's.

const top = Math.max(...LORDS.map((l) => l.share))

const rows = LORDS.map((l) => {
  const tie = `${l.me ? ' mq-me' : ''}${l.ally ? ' mq-ally' : ''}`
  const you = l.me ? ' <span class="hud-note">(toi)</span>' : ''
  return `<div class="mq-band${tie}" style="--c:${l.color};--w:${(l.share / top) * 100}%"><span class="mq-rank hud-figure">${l.rank}</span>${shield(l.color, 13)}<span class="mq-name hud-word">${l.name}${you}</span>${l.ally ? allyBadge(15) : ''}<span class="mq-share hud-figure">${percent(l.share)}</span></div>`
}).join('')

export default {
  title: 'Les seigneurs en bandes',
  line: 'Les vingt, une ligne fine chacun ; derrière, une bande de sa couleur aussi longue que sa part de la terre : qui mène, et de combien, d’un coup d’œil.',
  moments: ['renew'],
  replace: { [LIST]: sheet(`<div class="mq-bands">${rows}</div>`) },
  css: `
.mq-bands { display: flex; flex-direction: column; gap: calc(2px * var(--hud)); }
.mq-band { position: relative; display: flex; align-items: center; gap: calc(6px * var(--hud)); height: calc(19px * var(--hud)); padding: 0 calc(4px * var(--hud)); border-left: 3px solid transparent; }
.mq-band::before { content: ''; position: absolute; top: 1px; bottom: 1px; left: 0; width: var(--w); background: color-mix(in srgb, var(--c) 30%, transparent); border-radius: 2px; }
.mq-band > * { position: relative; }
.mq-band.mq-ally { border-left-color: var(--color-pact); }
.mq-band.mq-me { outline: 1.5px solid var(--color-gilt); outline-offset: 0; }
.mq-rank { width: calc(18px * var(--hud)); text-align: right; font-size: var(--text-hud-s); opacity: 0.6; }
.mq-name { flex: 1; min-width: 0; font-size: var(--text-hud-s); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mq-me .mq-name { font-weight: 700; }
.mq-share { width: calc(36px * var(--hud)); text-align: right; font-size: var(--text-hud-s); }
`,
}
