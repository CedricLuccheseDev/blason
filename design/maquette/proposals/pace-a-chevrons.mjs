import { capture } from './hud.js'

// The pace of each army in the bar (« 50 % plus vite / moins vite », said
// only in its hint until now): beside the share it takes, so many chevrons
// in ink, three for the small troop, half again as fast, two for the common
// pace of the troop and the mercenaries, one for the large troop, at half
// the pace; read at a glance, as a fast-forward is, and told in words by
// the hint under the pointer.

const html = capture('minute-3-1920x1080')

const PACES = {
  'Petite troupe': 3,
  Troupe: 2,
  'Grande troupe': 1,
  Mercenaires: 2,
}

/** So many chevrons, drawn on a 7-unit step, in the colour of the words. */
const chevrons = (n) =>
  `<svg viewBox="0 0 ${7 * n + 4} 12" aria-hidden="true" class="shrink-0" style="height: calc(12px * var(--hud)); width: calc(${7 * n + 4}px * var(--hud));">${Array.from(
    { length: n },
    (_, i) =>
      `<path d="M${2 + 7 * i} 2 L${7 + 7 * i} 6 L${2 + 7 * i} 10" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></path>`,
  ).join('')}</svg>`

/** The army's button as the game draws it, its chevrons after its figure. */
function paced(label) {
  const at = html.indexOf(`aria-label="${label}"`)
  const start = html.lastIndexOf('<button', at)
  const end = html.indexOf('</button>', at) + '</button>'.length
  const button = html.slice(start, end)
  const close = button.lastIndexOf('</span></button>')
  return `${button.slice(0, close)}${chevrons(PACES[label])}${button.slice(close)}`
}

export default {
  title: 'L’allure des armées dans la barre',
  line: 'À côté de la part qu’elle prend, l’allure de chaque armée en chevrons : trois pour la petite troupe, 50 % plus vite ; deux pour la troupe et les mercenaires, l’allure commune ; un pour la grande troupe, 50 % moins vite. Lue d’un coup d’œil, comme une avance rapide, dite en mots dans la bulle.',
  moments: ['minute-3'],
  replace: Object.fromEntries(
    Object.keys(PACES).map((label) => [
      `button[aria-label="${label}"]`,
      paced(label),
    ]),
  ),
}
