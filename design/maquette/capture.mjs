// The maquette's captures, taken from the game itself: each moment's save
// (public/saves) opened in /play?save=<name> in a headless Chrome at each
// size, staged as moments.mjs says, then once the map is drawn, captured
// apart: the map alone, the HUD hidden, as an image (<moment>-<w>x<h>.webp);
// the HUD as the page rendered it, its markup (<moment>-<w>x<h>.html); and
// once, the page's CSS (game.css) with what the document carries round the
// HUD (page.json: its language, its classes, the fonts' sheets). build.mjs
// lays them together again into maquette.html.
//   node design/maquette/capture.mjs [game url] [moment ...]
// The game must be served (npx vite dev); playwright-core is looked for in
// PLAYWRIGHT_CORE, the project, then the machine's shots tool, and Chrome in
// CHROME, else playwright's own. The game is read in French (LOCALE=en for
// English), under reduced motion, so that its life holds still. PROOF=<dir>
// keeps the game's whole screen there too, to check a frame against.

import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { MOMENTS, SIZES } from './moments.mjs'

const BASE = process.argv[2] ?? 'http://127.0.0.1:3000'
const ONLY = process.argv.slice(3)
const OUT = new URL('captures/', import.meta.url)
const LOCALE = process.env.LOCALE === 'en' ? 'en-GB' : 'fr-FR'
/** A folder where the game's own screen, map and HUD together, is kept beside each capture, to hold a frame of the maquette against. */
const PROOF = process.env.PROOF
/** The map is drawn once two shots a little apart differ by less than this share of their pixels (the men still move); never waited for longer than so many ms. */
const STILL = 0.002
const LONGEST = 90_000

async function findChromium() {
  const places = [
    process.env.PLAYWRIGHT_CORE,
    'playwright-core',
    '/root/Perso/.shots/node_modules/playwright-core/index.mjs',
  ]
  for (const place of places.filter(Boolean)) {
    try {
      return (await import(place)).chromium
    } catch {
      // Not there: the next place.
    }
  }
  throw new Error('No playwright-core: set PLAYWRIGHT_CORE to its index.mjs')
}

const CHROME =
  process.env.CHROME ??
  '/root/.cache/ms-playwright/chromium-1247/chrome-linux64/chrome'

/** A blank page of the same browser where the shots are compared and the map encoded: the browser's own codecs, no image library. */
async function darkroom(browser) {
  const page = await browser.newPage()
  await page.evaluate(() => {
    globalThis.decode = (data) => {
      const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0))
      return createImageBitmap(new Blob([bytes], { type: 'image/png' }))
    }
  })
  return {
    /** The share of pixels two shots differ by, compared small. */
    differ: (a, b) =>
      page.evaluate(
        async ([a, b]) => {
          const [x, y] = await Promise.all([decode(a), decode(b)])
          const w = 320
          const h = Math.round((w * x.height) / x.width)
          const pixels = (image) => {
            const pen = new OffscreenCanvas(w, h).getContext('2d')
            pen.drawImage(image, 0, 0, w, h)
            return pen.getImageData(0, 0, w, h).data
          }
          const [p, q] = [pixels(x), pixels(y)]
          let differ = 0
          for (let i = 0; i < p.length; i += 4) {
            const d =
              Math.abs(p[i] - q[i]) +
              Math.abs(p[i + 1] - q[i + 1]) +
              Math.abs(p[i + 2] - q[i + 2])
            if (d > 24) differ++
          }
          return differ / (w * h)
        },
        [a.toString('base64'), b.toString('base64')],
      ),
    /** A shot as WebP, its bytes. */
    webp: async (png) => {
      const data = await page.evaluate(async (png) => {
        const image = await decode(png)
        const canvas = new OffscreenCanvas(image.width, image.height)
        canvas.getContext('2d').drawImage(image, 0, 0)
        const blob = await canvas.convertToBlob({
          type: 'image/webp',
          quality: 0.9,
        })
        const bytes = new Uint8Array(await blob.arrayBuffer())
        let text = ''
        for (let i = 0; i < bytes.length; i += 0x8000)
          text += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
        return btoa(text)
      }, png.toString('base64'))
      return Buffer.from(data, 'base64')
    },
  }
}

/** The map's place on the game's screen: the child of it that holds the map's canvas. */
const MAP = 'main > :has(> canvas)'

/** Everything over the map hidden, or shown again: the HUD is every child of the game's screen but the map's. */
const showHud = (page, shown) =>
  page.evaluate(
    ([shown, map]) => {
      for (const piece of document.querySelectorAll('main > *')) {
        if (piece.matches(map)) continue
        piece.style.visibility = shown ? '' : 'hidden'
        if (piece.getAttribute('style') === '') piece.removeAttribute('style')
      }
    },
    [shown, MAP],
  )

/** Whether the map is still the one first drawn: the game mounted again (a page reloaded by the dev server) draws on a new canvas. */
const sameMap = (page) =>
  page.evaluate((map) => {
    const canvas = document.querySelector(`${map} > canvas`)
    if (!canvas) return false
    const known = canvas.dataset.capture === 'seen'
    canvas.dataset.capture = 'seen'
    return known
  }, MAP)

/** The map alone, once it is drawn: shots a little apart until two are alike, the HUD hidden before each; from the start again if the game was mounted anew meanwhile. */
async function drawnMap(page, room) {
  // A frame of the map can take seconds without a graphics card.
  const shoot = async () => {
    await showHud(page, false)
    return page.screenshot({ timeout: 180_000 })
  }
  const start = Date.now()
  await sameMap(page)
  let last = await shoot()
  let share = 1
  for (;;) {
    await page.waitForTimeout(2500)
    const shot = await shoot()
    share = await room.differ(last, shot)
    last = shot
    if (!(await sameMap(page))) continue
    if (share < STILL || Date.now() - start > LONGEST) break
  }
  await showHud(page, true)
  return { map: last, share }
}

/** The HUD's markup as rendered, the map's place in it left empty, and the document round it. */
const hudMarkup = (page) =>
  page.evaluate((map) => {
    const frame = document.body.firstElementChild.cloneNode(true)
    frame.querySelector(map).replaceChildren()
    const attributes = (element) =>
      Object.fromEntries([...element.attributes].map((a) => [a.name, a.value]))
    return {
      markup: frame.outerHTML,
      page: {
        html: attributes(document.documentElement),
        body: attributes(document.body),
        fonts: [...document.querySelectorAll('link[rel="stylesheet"]')]
          .map((link) => link.href)
          .filter((href) => !href.startsWith(location.origin)),
      },
    }
  }, MAP)

/** Every rule of the page's own sheets, as the browser holds them: the HUD's tokens and utilities with them. */
const pageCss = (page) =>
  page.evaluate(() =>
    [...document.styleSheets]
      .flatMap((sheet) => {
        try {
          return [...sheet.cssRules].map((rule) => rule.cssText)
        } catch {
          return [] // Another origin's sheet, the fonts': linked, not copied.
        }
      })
      .join('\n'),
  )

/** What a player would do before the moment is seen: keys, the pointer at the middle, a click on a piece. */
async function stage(page, moment, [width, height]) {
  for (const key of moment.keys ?? []) await page.keyboard.press(key)
  if (moment.pointer) await page.mouse.move(width / 2, height / 2)
  if (moment.click) await page.click(moment.click)
  await page.waitForTimeout(1200)
}

/** A moment at a size, in a page of the context given: staged, its map once drawn, its HUD, and the first time the page's CSS. */
async function capture(context, room, moment, size, first) {
  const [width, height] = size
  const page = await context.newPage()
  page.on('pageerror', (e) => console.error(`  ${moment.name}: ${e.message}`))
  const save = moment.save ?? moment.name
  await page.goto(`${BASE}/play?save=${save}`, { timeout: 120_000 })
  // The game mounted from its save (a save missing sends the page home), and its HUD laid.
  await page.waitForFunction(
    (map) =>
      location.search.includes('save=') &&
      document.querySelector(map) &&
      document.querySelectorAll('main > *').length > 3,
    MAP,
    { timeout: 120_000 },
  )
  await stage(page, moment, size)
  const { map, share } = await drawnMap(page, room)
  const name = `${moment.name}-${width}x${height}`
  writeFileSync(new URL(`${name}.webp`, OUT), await room.webp(map))
  const { markup, page: around } = await hudMarkup(page)
  writeFileSync(new URL(`${name}.html`, OUT), `${markup}\n`)
  if (PROOF)
    await page.screenshot({ path: `${PROOF}/${name}.png`, timeout: 180_000 })
  if (first) {
    writeFileSync(new URL('game.css', OUT), await pageCss(page))
    writeFileSync(
      new URL('page.json', OUT),
      `${JSON.stringify(around, null, 2)}\n`,
    )
  }
  return { name, share }
}

/** A frame taken in a page of its own, and once more in a fresh one should the first fail (a page the dev server could not serve whole). */
async function captureFrame(browser, ...rest) {
  for (let attempt = 1; ; attempt++) {
    const context = await browser.newContext({
      viewport: { width: rest[2][0], height: rest[2][1] },
      deviceScaleFactor: 1,
      locale: LOCALE,
      reducedMotion: 'reduce',
    })
    try {
      return await capture(context, ...rest)
    } catch (error) {
      if (attempt > 1) throw error
      console.error(`  again, after: ${error.message.split('\n')[0]}`)
    } finally {
      await context.close()
    }
  }
}

mkdirSync(OUT, { recursive: true })
const chromium = await findChromium()
const browser = await chromium.launch({
  ...(existsSync(CHROME) ? { executablePath: CHROME } : {}),
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
try {
  const room = await darkroom(browser)
  let first = true
  for (const moment of MOMENTS) {
    if (ONLY.length > 0 && !ONLY.includes(moment.name)) continue
    for (const size of SIZES) {
      const started = Date.now()
      const { name, share } = await captureFrame(
        browser,
        room,
        moment,
        size,
        first,
      )
      first = false
      const seconds = ((Date.now() - started) / 1000).toFixed(0)
      const moving = (share * 100).toFixed(2)
      console.log(`${name.padEnd(22)} ${seconds} s, ${moving} % still moving`)
    }
  }
} finally {
  await browser.close()
}
