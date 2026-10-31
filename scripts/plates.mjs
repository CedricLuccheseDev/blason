// The maps of the atlas drawn once for their cards in the book
// (`npm run plates`): each as the book showed it, drawn in the browser by
// render/sketch.ts, saved light in public/lands/<map>.webp. The book shows
// the picture, and no longer builds every map of the atlas, the World's
// 694 000 tiles among them, to draw its card. A map of the atlas changed
// (`npm run atlas`, `npm run legend`) is drawn again by this command.

import { mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'vite'
import { launch } from '../design/maquette/browser.mjs'

/** A card's size in the page's pixels, as the book lays it out (MapList.tsx), and how many of the picture's for each. */
const [WIDTH, HEIGHT, SHARP] = [240, 160, 2]
const OUT = 'public/lands'

const server = await createServer({
  server: { port: 3107 },
  logLevel: 'error',
})
await server.listen()
const browser = await launch()
try {
  const page = await browser.newPage({
    viewport: { width: 800, height: 600 },
    deviceScaleFactor: SHARP,
  })
  // Any page of the site: only its modules are imported there.
  await page.goto('http://localhost:3107/blog', { waitUntil: 'domcontentloaded' })
  const plates = await page.evaluate(
    async ([width, height]) => {
      const { ATLAS_MAPS } = await import('/engine/index.ts')
      const { sketchGame } = await import('/src/render/sketch.ts')
      const out = {}
      for (const map of ATLAS_MAPS) {
        const canvas = document.createElement('canvas')
        canvas.style.cssText = `position:fixed;left:0;top:0;width:${width}px;height:${height}px`
        document.body.append(canvas)
        sketchGame(canvas, 'atlas', { kind: 'real', map }, true)
        out[map] = canvas.toDataURL('image/webp', 0.86)
        canvas.remove()
      }
      return out
    },
    [WIDTH, HEIGHT],
  )
  mkdirSync(OUT, { recursive: true })
  for (const [map, url] of Object.entries(plates)) {
    const bytes = Buffer.from(url.split(',')[1], 'base64')
    writeFileSync(`${OUT}/${map}.webp`, bytes)
    console.log(`${map}: ${Math.round(bytes.length / 1024)} Ko`)
  }
} finally {
  await browser.close()
  await server.close()
}
