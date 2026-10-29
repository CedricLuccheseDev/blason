// The headless Chrome the maquette is made in (capture.mjs, planches.mjs):
// playwright-core looked for in PLAYWRIGHT_CORE, the project, then the
// machine's shots tool; Chrome in CHROME, else playwright's own; drawing
// WebGL without a graphics card.

import { existsSync } from 'node:fs'

const PLACES = [
  process.env.PLAYWRIGHT_CORE,
  'playwright-core',
  '/root/Perso/.shots/node_modules/playwright-core/index.mjs',
]

const CHROME =
  process.env.CHROME ??
  '/root/.cache/ms-playwright/chromium-1247/chrome-linux64/chrome'

async function findChromium() {
  for (const place of PLACES.filter(Boolean)) {
    try {
      return (await import(place)).chromium
    } catch {
      // Not there: the next place.
    }
  }
  throw new Error('No playwright-core: set PLAYWRIGHT_CORE to its index.mjs')
}

/** The browser, launched. */
export async function launch() {
  const chromium = await findChromium()
  return chromium.launch({
    ...(existsSync(CHROME) ? { executablePath: CHROME } : {}),
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  })
}
