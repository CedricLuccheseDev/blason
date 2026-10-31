// The maquette's captures, taken from the game itself: each moment's save
// (public/saves) opened in /play?save=<name>, or a page of the site (the
// home, `path: '/'`), in a headless Chrome at each size, staged as
// moments.mjs says, then once the map is drawn, captured apart: the map
// alone, the HUD hidden, as an image (<moment>-<w>x<h>.webp); the HUD as the
// page rendered it, its markup (<moment>-<w>x<h>.html), the map's place
// marked (data-map) and any other canvas of it (the land of the home's next
// game) as the image it showed; and once, the page's CSS (game.css) with
// what the document carries round the HUD (page.json: its language, its
// classes, the fonts' sheets). build.mjs lays them together again into
// maquette.html, planches.mjs into the boards. Then the interface's pieces,
// for the board of the HUD's system, drawn by the game's own components
// (pieces.tsx, the moment named `pieces`): their markup (pieces.html).
//   node design/maquette/capture.mjs [game url] [moment ...]
// The game must be served (npx vite dev), and the relay beside it for the
// home's next public game; the browser is found as browser.mjs says. The
// game is read in French (LOCALE=en for English), under reduced motion, so
// that its life holds still. SIZES=1920x1080,390x844 takes those sizes
// alone. PROOF=<dir> keeps the game's whole screen there too, to check a
// frame against.

import { mkdirSync, writeFileSync } from 'node:fs'
import { launch } from './browser.mjs'
import { MOMENTS, SIZES } from './moments.mjs'

const BASE = process.argv[2] ?? 'http://127.0.0.1:3000'
const ONLY = process.argv.slice(3)
/** The sizes to take: all the maquette's, unless SIZES names some. */
const TAKEN = process.env.SIZES
  ? process.env.SIZES.split(',').map((size) => size.split('x').map(Number))
  : SIZES
const OUT = new URL('captures/', import.meta.url)
const LOCALE = process.env.LOCALE === 'en' ? 'en-GB' : 'fr-FR'
/** A folder where the game's own screen, map and HUD together, is kept beside each capture, to hold a frame of the maquette against. */
const PROOF = process.env.PROOF
/** The map is drawn once two shots a little apart differ by less than this share of their pixels (the men still move); never waited for longer than so many ms. */
const STILL = 0.002
const LONGEST = 90_000

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

/** The map alone, once it is drawn: shots a little apart until two are alike, the HUD hidden before each; from the start again if the game was mounted anew meanwhile; never waited for past `longest` ms (a game that never holds still, as the home's). */
async function drawnMap(page, room, longest = LONGEST) {
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
    if (share < STILL || Date.now() - start > longest) break
  }
  await showHud(page, true)
  return { map: last, share }
}

/** The HUD's markup as rendered, the map's place in it left empty and marked, any other canvas as the image it shows, and the document round it. */
const hudMarkup = (page) =>
  page.evaluate((map) => {
    const root = document.body.firstElementChild
    const frame = root.cloneNode(true)
    const place = root.querySelector(map)
    const copies = [...frame.querySelectorAll('canvas')]
    for (const [i, canvas] of [...root.querySelectorAll('canvas')].entries()) {
      if (place?.contains(canvas)) continue
      const image = document.createElement('img')
      for (const { name, value } of canvas.attributes)
        image.setAttribute(name, value)
      image.setAttribute('src', canvas.toDataURL('image/webp', 0.9))
      copies[i].replaceWith(image)
    }
    const copy = frame.querySelector(map)
    copy?.replaceChildren()
    copy?.setAttribute('data-map', '')
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

/** What a player would do before the moment is seen: keys, the pointer at the middle, a right click there, a click on a piece. */
async function stage(page, moment, [width, height]) {
  for (const key of moment.keys ?? []) await page.keyboard.press(key)
  if (moment.pointer) await page.mouse.move(width / 2, height / 2)
  if (moment.menu)
    await page.mouse.click(width / 2, height / 2, { button: 'right' })
  if (moment.click) await page.click(moment.click)
  await page.waitForTimeout(1200)
}

/** A moment at a size, in a page of the context given: staged, its map once drawn, its HUD, and the first time the page's CSS. */
async function capture(context, room, moment, size, first) {
  const [width, height] = size
  const page = await context.newPage()
  page.on('pageerror', (e) => console.error(`  ${moment.name}: ${e.message}`))
  const path = moment.path ?? `/play?save=${moment.save ?? moment.name}`
  await page.goto(`${BASE}${path}`, { timeout: 120_000 })
  // The page as it should be: the game mounted from its save (a save
  // missing sends the page home) and its HUD laid; or what the moment waits
  // for on its page.
  await page.waitForFunction(
    ([map, ready]) =>
      ready
        ? document.querySelector(ready) && (!map || document.querySelector(map))
        : location.search.includes('save=') &&
          document.querySelector(map) &&
          document.querySelectorAll('main > *').length > 3,
    [moment.map === false ? null : MAP, moment.ready],
    { timeout: 120_000 },
  )
  await stage(page, moment, size)
  const name = `${moment.name}-${width}x${height}`
  // A page with no map behind (the home since 29/10): its HUD alone, its
  // canvases as the images they show.
  let share = 0
  if (moment.map !== false) {
    const drawn = await drawnMap(page, room, moment.longest)
    share = drawn.share
    writeFileSync(new URL(`${name}.webp`, OUT), await room.webp(drawn.map))
  }
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

/** The interface's pieces, drawn by the game's own components (pieces.tsx) in a page of the game, its Vite serving the module: their markup. */
async function capturePieces(browser) {
  const page = await browser.newPage({ locale: LOCALE })
  try {
    await page.goto(`${BASE}/legal`, { timeout: 120_000 })
    await page.waitForLoadState('networkidle')
    // The dev server does not watch design/: the module is asked for anew,
    // under a query of its own, lest it be served as first transformed.
    const markup = await page.evaluate(async (module) => {
      const pieces = await import(module)
      return pieces.piecesMarkup()
    }, `/design/maquette/pieces.tsx?at=${Date.now()}`)
    writeFileSync(new URL('pieces.html', OUT), `${markup}\n`)
  } finally {
    await page.close()
  }
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
const browser = await launch()
try {
  const room = await darkroom(browser)
  let first = true
  for (const moment of MOMENTS) {
    if (ONLY.length > 0 && !ONLY.includes(moment.name)) continue
    for (const size of TAKEN) {
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
  if (ONLY.length === 0 || ONLY.includes('pieces')) {
    await capturePieces(browser)
    console.log('pieces')
  }
} finally {
  await browser.close()
}
