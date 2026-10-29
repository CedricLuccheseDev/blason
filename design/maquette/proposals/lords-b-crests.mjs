import { LIST, LORDS, allyBadge, percent, sheet, shield } from './lords.js'

// The lords as a frieze of shields: five a row in the order of the land
// they hold, each with his share; his name and men under the pointer, here
// mine, as the pointer on my shield would show them.

const cells = LORDS.map((l) => {
  const tie = `${l.me ? ' mq-me' : ''}`
  return `<div class="mq-cell${tie}" title="${l.name}, ${percent(l.share)}, ${l.men} hommes"><span class="mq-cell-rank hud-figure">${l.rank}</span>${shield(l.color, 26)}${l.ally ? `<span class="mq-cell-ally">${allyBadge(14)}</span>` : ''}<span class="mq-cell-share hud-figure">${percent(l.share)}</span></div>`
}).join('')

const me = LORDS.find((l) => l.me)
const foot = `<div class="mq-crest-foot"><span class="hud-name">${me.name}</span><span class="hud-note">toi, 1<sup>er</sup></span><span class="mq-crest-figures hud-figure">${percent(me.share)}, ${me.men} hommes</span></div>`

export default {
  title: 'La frise des blasons',
  line: 'Les vingt écus en grille, dans l’ordre de la terre tenue, chacun avec sa part ; le nom et les hommes au survol (ici, mon écu survolé).',
  moments: ['renew'],
  replace: {
    [LIST]: sheet(`<div class="mq-crests">${cells}</div>${foot}`, {
      width: 'mq-crest-sheet',
    }),
  },
  css: `
.mq-crest-sheet { width: auto; align-self: flex-start; }
.mq-crests { display: grid; grid-template-columns: repeat(5, auto); gap: calc(6px * var(--hud)) calc(8px * var(--hud)); padding-top: calc(4px * var(--hud)); }
.mq-cell { position: relative; display: flex; flex-direction: column; align-items: center; gap: 1px; padding: calc(3px * var(--hud)) calc(4px * var(--hud)); border-radius: 4px; }
.mq-cell.mq-me { background: color-mix(in srgb, var(--color-gilt) 28%, transparent); outline: 1.5px solid var(--color-gilt); }
.mq-cell-rank { position: absolute; top: 0; left: 1px; font-size: calc(12px * var(--hud)); opacity: 0.6; }
.mq-cell-ally { position: absolute; top: calc(-2px * var(--hud)); right: calc(-2px * var(--hud)); }
.mq-cell-share { font-size: var(--text-hud-s); }
.mq-crest-foot { display: flex; align-items: baseline; gap: calc(8px * var(--hud)); padding-top: calc(4px * var(--hud)); border-top: 1px solid color-mix(in srgb, var(--color-gilt) 60%, transparent); margin-top: calc(4px * var(--hud)); }
.mq-crest-figures { margin-left: auto; font-size: var(--text-hud-s); }
`,
}
