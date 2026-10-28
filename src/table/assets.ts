import { radial, svgImage, texture } from './paint/canvas'
import { VIGNETTES, shieldSvg, suitSvg } from './paint/drawings'
import { woodCanvas } from './paint/wood'
import { boardTopCanvas, lidCanvas, lidSideCanvas } from './paint/printed'
import { cardBackCanvas, cardFrontCanvas, tagCanvas } from './paint/cards'
import { sealCanvases } from './paint/seal'
import {
  coinCanvas,
  dieFaceCanvas,
  flameCanvas,
  leatherCanvas,
  pageCanvas,
  pageEdgeCanvas,
  ribbonCanvas,
} from './paint/trinkets'
import { MODES } from './modes'
import type { CanvasTexture } from 'three'
import type { Suit } from './paint/drawings'
import type { Mode } from './modes'

// Everything painted for the table, made once per table: the canvases and
// the textures they become. The few words painted into them (the name on
// the lid, the line under it, the cartouche) come from the messages.

/** The suit each mode's card bears. */
const SUIT: Record<Mode, Suit> = {
  bots: 'sword',
  online: 'tower',
  private: 'lock',
}

export type Words = { name: string; line: string; mark: string }

const shield = (colour: string, chevron: string, w: number, h: number) =>
  svgImage(
    shieldSvg(54, 66, colour, { stroke: 2.2, chevronColour: chevron }),
    w,
    h,
  )

export async function makeAssets(words: Words, player: string) {
  const [lidShield, myShield, backShield, ...pictures] = await Promise.all([
    shield('#b3302a', '#f4d277', 324, 396),
    svgImage(shieldSvg(34, 41, player, { stroke: 1.8 }), 300, 362),
    shield('#1d4a83', '#f4d277', 336, 412),
    ...MODES.map((m) => svgImage(VIGNETTES[m], 1008, 510)),
    ...MODES.map((m) => svgImage(suitSvg(SUIT[m], 60), 162, 162)),
  ])
  const wood = woodCanvas()
  const seal = sealCanvases()
  return {
    wood: texture(wood, { repeat: [4, 2.7] }),
    woodBump: texture(wood, { repeat: [4, 2.7], data: true }),
    boardTop: texture(boardTopCanvas(words.mark)),
    lidTop: texture(lidCanvas(lidShield, words.name, words.line)),
    lidSide: texture(lidSideCanvas()),
    fronts: MODES.map((_, i) =>
      texture(cardFrontCanvas(pictures[3 + i], pictures[i])),
    ),
    back: texture(cardBackCanvas(backShield)),
    tag: texture(tagCanvas(myShield)),
    pages: [texture(pageCanvas(-1)), texture(pageCanvas(1))],
    pageEdge: texture(pageEdgeCanvas()),
    ribbon: texture(ribbonCanvas()),
    seal: texture(seal.color),
    sealBump: texture(seal.bump, { data: true }),
    sealGlow: texture(seal.glow),
    // The die's faces in the box's order (+x, -x, +y, -y, +z, -z).
    die: [3, 4, 5, 2, 1, 6].map((n) => texture(dieFaceCanvas(n))),
    coin: texture(coinCanvas(false)),
    coinBump: texture(coinCanvas(true), { data: true }),
    flame: texture(flameCanvas()),
    glow: texture(
      radial(256, [
        [0, 'rgba(255,200,120,1)'],
        [0.25, 'rgba(255,170,80,0.45)'],
        [1, 'rgba(255,140,60,0)'],
      ]),
    ),
    blob: texture(
      radial(128, [
        [0, 'rgba(0,0,0,1)'],
        [0.45, 'rgba(0,0,0,0.6)'],
        [1, 'rgba(0,0,0,0)'],
      ]),
    ),
    leather: texture(leatherCanvas(), { data: true, repeat: [3, 2] }),
  }
}

export type Assets = Awaited<ReturnType<typeof makeAssets>>

/** Every texture of the table, to let go of when it is cleared. */
export function texturesOf(a: Assets): Array<CanvasTexture> {
  return Object.values(a).flatMap((v) => (Array.isArray(v) ? v : [v]))
}
