import { LIST, LORDS, allyBadge, percent, sheet, shield } from './lords.js'

// The list as it is today, unfolded on all twenty: the least change, and
// how tall it grows.

const rows = LORDS.map((l) => {
  const you = l.me ? ' <span class="hud-note">(toi)</span>' : ''
  return `<div class="mq-row${l.ally ? ' mq-ally' : ''}${l.me ? ' mq-me' : ''}"><span class="mq-rank hud-figure">${l.rank}</span>${shield(l.color, 16)}<span class="mq-name hud-word">${l.name}${you}</span>${l.ally ? allyBadge(18) : ''}<span class="mq-share hud-figure">${percent(l.share)}</span><span class="mq-men hud-figure">${l.men}</span></div>`
}).join('')

export default {
  title: 'La liste dépliée',
  line: 'La liste d’aujourd’hui, ouverte sur les vingt : le moins de changement, mais deux fois plus haute ; fermée, elle reste celle des huit premiers.',
  moments: ['renew'],
  replace: { [LIST]: sheet(rows, { head: 'Les vingt seigneurs' }) },
  css: `
.mq-row { display: flex; align-items: center; gap: calc(8px * var(--hud)); padding: 0 calc(4px * var(--hud)); border-left: 3px solid transparent; }
.mq-row.mq-ally { border-left-color: var(--color-pact); background: color-mix(in srgb, var(--color-pact) 10%, transparent); }
.mq-rank { width: calc(18px * var(--hud)); text-align: right; font-size: var(--text-hud-s); opacity: 0.6; }
.mq-name { flex: 1; min-width: 0; font-size: var(--text-hud-s); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mq-me .mq-name { font-weight: 700; }
.mq-share { width: calc(36px * var(--hud)); text-align: right; font-size: var(--text-hud-s); }
.mq-men { width: calc(40px * var(--hud)); text-align: right; font-size: var(--text-hud-s); opacity: 0.7; }
`,
}
