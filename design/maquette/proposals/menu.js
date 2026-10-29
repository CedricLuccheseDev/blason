import { capture, figures, glyph, icon, medallion } from './hud.js'

// What the two light right-click menus share: the moment "minute-3", the
// pointer at the middle of the screen over Sinople's land; the three acts'
// medallions (the sword of a raid, the alliance's links, the market's
// purse) ringed in their colours; the cartouche they replace.

export const html = capture('minute-3-1920x1080')
export const CARTOUCHE = 'main > div.pointer-events-none.absolute.w-max'

export const soldier = icon(html, 'soldier', 15)
export const coins = icon(html, 'coins', 15)
export const men = figures(html, 'Ost')[1]
export const gift = Math.floor(86 / 4)

const links =
  '<path d="M3 12 A4.5 4.5 0 0 1 7.5 7.5 H11 A4.5 4.5 0 0 1 11 16.5 H7.5 A4.5 4.5 0 0 1 3 12 Z" fill="none" stroke="var(--color-quill)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"></path><path d="M13 7.5 H16.5 A4.5 4.5 0 0 1 16.5 16.5 H13 A4.5 4.5 0 0 1 13 7.5 Z" fill="none" stroke="var(--color-quill)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"></path>'

export const ACTS = [
  {
    word: 'Attaquer',
    paths: glyph(html, 'Chevauchée'),
    ring: 'var(--color-gules)',
    figure: `${soldier}${men}`,
  },
  { word: 'Alliance', paths: links, ring: 'var(--color-pact)', figure: '' },
  {
    word: 'Offrande',
    paths: glyph(html, 'Marché'),
    ring: 'var(--color-gilt)',
    figure: `${coins}${gift}`,
  },
].map((a) => ({ ...a, medallion: (px) => medallion(a.paths, a.ring, px) }))

export const SINOPLE = '#3e8e41'
