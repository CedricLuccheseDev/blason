// What the three proposals for the lords' list share: the twenty lords of
// the moment "renew" (public/saves/renew.json, 6 min 9 s, Céleste's seat) as
// the game's summary reads them, the game's shield and badges as the HUD
// draws them, and the sheet they lie on. The list replaces the game's, the
// sheet whose button folds it.

export const LIST = 'div:has(> button[aria-expanded])'

/** Name, colour, share of the land in percent, men; mine, an ally. */
export const LORDS = [
  ['Céleste', '#6fb6db', 9, 327, 'me'],
  ['Gueules', '#c0392b', 9, 201],
  ['Turquoise', '#2a9d8f', 8, 321],
  ['Olive', '#6f7a2e', 7, 281],
  ['Rose', '#d46a9e', 7, 248],
  ['Azur', '#2f6db5', 7, 225],
  ['Marine', '#24396b', 7, 182, 'ally'],
  ['Lavande', '#9c8fd1', 7, 128],
  ['Pourpre', '#7b3f8c', 6, 97],
  ['Prune', '#5a2347', 5, 288],
  ['Or', '#d9a41e', 5, 256],
  ['Orangé', '#e07b24', 5, 186],
  ['Ardoise', '#7c8b9a', 4, 251],
  ['Brun', '#8a5a32', 3, 98],
  ['Canard', '#1f7a99', 2, 197],
  ['Sanguine', '#8e2b2b', 2, 47],
  ['Sinople', '#3e8e41', 1, 32],
  ['Pomme', '#8dbf4a', 1, 31],
  ['Sable', '#3d3d45', 0, 13, 'ally'],
  ['Corail', '#ee8d7a', 0, 11],
].map(([name, color, share, men, tie], i) => ({
  rank: i + 1,
  name,
  color,
  share,
  men,
  me: tie === 'me',
  ally: tie === 'ally',
}))

let clip = 0

/** The game's shield (Emblem.tsx), at so many pixels wide. */
export function shield(color, width = 18) {
  const id = `mq-clip-${clip++}`
  const d = 'M1 1 H17 V10.2 Q17 17.8 9 21 Q1 17.8 1 10.2 Z'
  const h = (width * 22) / 18
  return `<svg viewBox="0 0 18 22" aria-hidden="true" class="shrink-0 overflow-visible" style="width: calc(${width}px * var(--hud)); height: calc(${h}px * var(--hud));"><g><clipPath id="${id}"><path d="${d}"></path></clipPath><path d="${d}" fill="var(--color-vellum)"></path><g clip-path="url(#${id})"><path d="${d}" fill="${color}"></path><path d="M1 14.2 L9 7 L17 14.2 L17 17.8 L9 10.6 L1 17.8 Z" fill="var(--color-vellum)" fill-opacity="0.92"></path></g><path d="${d}" fill="none" stroke="var(--color-quill)" stroke-width="1.4" stroke-linejoin="round"></path></g></svg>`
}

/** The ally's badge, the links on the alliance's green (Emblem.tsx). */
export function allyBadge(size = 18) {
  return `<svg viewBox="0 0 22 22" role="img" aria-label="Ton allié" class="shrink-0 overflow-visible" style="width: calc(${size}px * var(--hud)); height: calc(${size}px * var(--hud));"><title>Ton allié</title><circle cx="11" cy="11" r="9.5" fill="var(--color-vellum)" stroke="var(--color-pact)" stroke-width="2.2"></circle><g transform="translate(3.74 3.74) scale(0.605)"><path d="M3 12 A4.5 4.5 0 0 1 7.5 7.5 H11 A4.5 4.5 0 0 1 11 16.5 H7.5 A4.5 4.5 0 0 1 3 12 Z" fill="none" stroke="var(--color-pact)" stroke-width="2.98" stroke-linejoin="round" stroke-linecap="round"></path><path d="M13 7.5 H16.5 A4.5 4.5 0 0 1 16.5 16.5 H13 A4.5 4.5 0 0 1 13 7.5 Z" fill="none" stroke="var(--color-pact)" stroke-width="2.98" stroke-linejoin="round" stroke-linecap="round"></path></g></svg>`
}

/** The sheet the list lies on (Sheet.tsx), its head the fold's button. */
export function sheet(body, { width = '', head = 'Les seigneurs' } = {}) {
  return `<div class="hud-enter relative rounded-md border-[1.5px] border-quill bg-vellum shadow-lift flex w-full flex-col gap-1 px-3 py-2 ${width}"><span class="pointer-events-none absolute inset-[3px] rounded-sm border border-gilt"></span><button type="button" aria-expanded="true" class="pointer-events-auto flex cursor-pointer items-center justify-between hud-press"><span class="hud-note">${head}</span><span aria-hidden="true" class="hud-note">▾</span></button>${body}</div>`
}

export const percent = (share) => `${share} %`
