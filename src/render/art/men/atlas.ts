import { LOOKS } from './looks'
import { FRAMES } from './pose'
import type { Box, Look } from './looks'
import type { Layer, Sketch } from './kit'

// Every frame of a look on one canvas, drawn once for every lord: a row for
// each man of the look, each way he faces and each of his two layers, a
// column for each frame. Plain canvas, so that a page can draw the sheet
// without the game's renderer; the textures are cut out of it (textures.ts).

/** Pixels a local unit: a man some fifty-five pixels tall. */
export const RES = 5

export type Sheet = {
  canvas: HTMLCanvasElement
  box: Box
  /** A cell's size in pixels. */
  w: number
  h: number
  /** Men drawn, the standard-bearer last if the look has one. */
  men: number
  bearer: boolean
}

export type Cell = { x: number; y: number; w: number; h: number }

const LAYERS: ReadonlyArray<Layer> = ['dye', 'base']

/** A frame's cell: the man, the way he faces, the layer, the frame. */
export function cellOf(
  sheet: Sheet,
  man: number,
  face: 1 | -1,
  layer: Layer,
  frame: number,
): Cell {
  const row = (man * 2 + (face === 1 ? 0 : 1)) * 2 + LAYERS.indexOf(layer)
  return { x: frame * sheet.w, y: row * sheet.h, w: sheet.w, h: sheet.h }
}

/** Where the feet stand in a cell, as a share of its width and height. */
export function anchorOf(box: Box, face: 1 | -1) {
  const x = face === 1 ? -box.left : box.left + box.width
  return { x: x / box.width, y: -box.top / box.height }
}

/** One frame drawn in its cell, clipped to it, the man mirrored when he faces left. */
function drawCell(
  g: CanvasRenderingContext2D,
  sheet: Sheet,
  draw: (sk: Sketch, frame: number) => void,
  at: { man: number; face: 1 | -1; layer: Layer; frame: number },
) {
  const { man, face, layer, frame } = at
  const cell = cellOf(sheet, man, face, layer, frame)
  const anchor = anchorOf(sheet.box, face)
  g.save()
  g.beginPath()
  g.rect(cell.x, cell.y, cell.w, cell.h)
  g.clip()
  g.setTransform(
    face * RES,
    0,
    0,
    RES,
    cell.x + anchor.x * sheet.w,
    cell.y + anchor.y * sheet.h,
  )
  draw({ g, face, layer }, frame)
  g.restore()
}

export function drawSheet(
  look: Look,
  make: () => HTMLCanvasElement = () => document.createElement('canvas'),
): Sheet {
  const art = LOOKS[look]
  const { box } = art
  const w = Math.ceil(box.width * RES)
  const h = Math.ceil(box.height * RES)
  const canvas = make()
  canvas.width = w * FRAMES
  canvas.height = h * art.men.length * 4
  const sheet: Sheet = {
    canvas,
    box,
    w,
    h,
    men: art.men.length,
    bearer: art.bearer,
  }
  const g = canvas.getContext('2d')
  art.men.forEach((draw, man) => {
    for (const face of [1, -1] as const)
      for (const layer of LAYERS)
        for (let frame = 0; frame < FRAMES; frame++)
          if (g) drawCell(g, sheet, draw, { man, face, layer, frame })
  })
  return sheet
}
