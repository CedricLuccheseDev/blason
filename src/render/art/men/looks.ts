import { TONE } from '../../palette'
import { drawFootman } from './footman'
import { IRON } from './heads'
import { drawRider } from './rider'
import type { Garb } from './body'
import type { FootKit } from './footman'
import type { Sketch } from './kit'

// The four looks of the men, so that an army's kind reads at a glance: the
// raid rides, the host comes in iron and in its lord's surcoat, the levy
// comes as it could, in hoods and caps, with bills, axes and clubs, no two
// alike; the peasants who hold a land against an attack wear their straw
// hats and their smocks, their forks in their hands. A few men each, and a
// standard-bearer for the armies; one more look is one more entry here.

export type Look = 'raid' | 'host' | 'ban' | 'peasant'

/** The box each of a look's frames is drawn in, in local units, his feet at (0, 0). */
export type Box = { left: number; top: number; width: number; height: number }

export type Art = {
  box: Box
  /** Each man of the look, then the standard-bearer if the look has one. */
  men: Array<(sk: Sketch, frame: number) => void>
  bearer: boolean
  /** The shadow under him: how far forward of his feet, how wide, how deep. */
  shadow: { x: number; rx: number; ry: number }
}

const LIGHT = TONE.parchment
const BELT = 0x5b3d22

const foot = (kit: FootKit) => (sk: Sketch, frame: number) =>
  drawFootman(sk, kit, frame)

const MAIL: Garb = {
  hose: IRON,
  coat: 'dye',
  sleeves: IRON,
  hem: 1.9,
  flare: 1.7,
  belt: BELT,
  chevron: LIGHT,
}
const SPEAR = { grip: [0.7, 2.7] as const, angle: 0.1 }

const host: Array<FootKit> = [
  {
    garb: MAIL,
    head: { kind: 'nasal' },
    weapon: 'spear',
    blow: 'spear',
    carry: SPEAR,
    shield: 'kite',
  },
  {
    garb: { ...MAIL, hem: 1.6 },
    head: { kind: 'barrel' },
    weapon: 'spear',
    blow: 'spear',
    carry: SPEAR,
    shield: 'kite',
  },
  {
    garb: { ...MAIL, flare: 1.9 },
    head: { kind: 'kettle' },
    weapon: 'spear',
    blow: 'spear',
    carry: SPEAR,
    shield: 'kite',
  },
  {
    garb: MAIL,
    head: { kind: 'nasal' },
    weapon: null,
    blow: 'spear',
    carry: SPEAR,
  },
]

const LINEN = 0xc9b48a
const SHOULDER = { grip: [1.3, 2.6] as const, angle: 0.2 }
const jack = (coat: Garb['coat'], hose: number, hem = 1.1): Garb => ({
  hose,
  coat,
  sleeves: coat === 'dye' ? LINEN : coat,
  hem,
  flare: 1.55,
  belt: BELT,
})

const ban: Array<FootKit> = [
  {
    garb: jack(LINEN, 0x6b5a45),
    head: { kind: 'hood', tone: 'dye' },
    weapon: 'bill',
    blow: 'chop',
    carry: SHOULDER,
  },
  {
    garb: jack('dye', 0x7a6a50, 0.8),
    head: { kind: 'cap', tone: 0x6a4a30 },
    weapon: 'axe',
    blow: 'chop',
    carry: { grip: [1.4, 3], angle: 0.6 },
  },
  {
    garb: jack('dye', 0x5d5040, 1.4),
    head: { kind: 'kettle' },
    weapon: 'club',
    blow: 'chop',
    carry: { grip: [0.9, 2.6], angle: 0.35 },
    shield: 'round',
  },
  {
    garb: jack('dye', 0x4e4436),
    head: { kind: 'hood', tone: 0x8c7a5a },
    weapon: 'bill',
    blow: 'thrust',
    carry: { grip: [1.2, 2.4], angle: 0.3 },
  },
  {
    garb: jack(0x7d7f5c, 0x6b5a45, 0.9),
    head: { kind: 'cap', tone: 'dye' },
    weapon: 'axe',
    blow: 'chop',
    carry: { grip: [1, 2.6], angle: 0.3 },
    shield: 'round',
  },
  {
    garb: jack(LINEN, 0x6b5a45),
    head: { kind: 'hood', tone: 'dye' },
    weapon: null,
    blow: 'chop',
    carry: SHOULDER,
  },
]

const SMOCK: Garb = {
  hose: 0xb8a47c,
  coat: 'dye',
  sleeves: 0xd8c8a4,
  hem: 1.6,
  flare: 2.1,
}
const FORK = { grip: [1.3, 2.5] as const, angle: 0.55 }

const peasant: Array<FootKit> = [
  {
    garb: SMOCK,
    head: { kind: 'straw' },
    weapon: 'fork',
    blow: 'thrust',
    carry: FORK,
  },
  {
    garb: { ...SMOCK, hem: 1.3, belt: 0x8a6a3c },
    head: { kind: 'straw' },
    weapon: 'fork',
    blow: 'thrust',
    carry: { grip: [1.1, 2.7], angle: 0.4 },
  },
  {
    garb: { ...SMOCK, flare: 1.8 },
    head: { kind: 'hood', tone: 0x9a8a68 },
    weapon: 'fork',
    blow: 'thrust',
    carry: FORK,
  },
]

const rider =
  (horse: number, mane: number, head: 'nasal' | 'barrel', bearer = false) =>
  (sk: Sketch, frame: number) =>
    drawRider(sk, { horse, mane, head: { kind: head }, bearer }, frame)

const FOOT: Box = { left: -6.5, top: -17.5, width: 18.5, height: 18.5 }
const ON_FOOT = { x: 0.3, rx: 2.5, ry: 0.75 }

export const LOOKS: Record<Look, Art> = {
  raid: {
    box: { left: -7.5, top: -22, width: 23, height: 23 },
    men: [
      rider(0x7a4a2c, 0x2e211a, 'nasal'),
      rider(0xb8b0a2, 0x8a8478, 'barrel'),
      rider(0x3a2e28, 0x1e1712, 'nasal'),
      rider(0x9a5a30, 0x5a3418, 'barrel', true),
    ],
    bearer: true,
    shadow: { x: 1.4, rx: 6.6, ry: 1.45 },
  },
  host: { box: FOOT, men: host.map(foot), bearer: true, shadow: ON_FOOT },
  ban: { box: FOOT, men: ban.map(foot), bearer: true, shadow: ON_FOOT },
  peasant: {
    box: FOOT,
    men: peasant.map(foot),
    bearer: false,
    shadow: ON_FOOT,
  },
}
