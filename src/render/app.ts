import { Application, CullerPlugin, extensions } from 'pixi.js'
import { TONE } from './palette'
import { bestQuality } from './quality'

// What lies off the screen is left out of the drawing (« Le jeu ram quand
// y'a beaucoup trop de bâtiments unités … faire du culling »): pixi's
// culler, before each frame, against the screen, once for every game; the
// scene says what may be left out (scene.ts).
extensions.add(CullerPlugin)

/** The map's canvas, made to fill the element and laid in it. */
export async function makeApp(element: HTMLElement): Promise<Application> {
  const app = new Application()
  await app.init({
    preference: 'webgl',
    resizeTo: element,
    background: TONE.edge,
    antialias: true,
    resolution: bestQuality().resolution,
    autoDensity: true,
    // The game reads its own gestures and has no filters: neither pixi's
    // events, which test the whole map under every move, nor its filters,
    // its DOM layer or its accessibility overlay are loaded.
    skipExtensionImports: true,
    // Each piece measured where it stands this frame: the layers are render
    // groups, whose kept transforms are those of the last frame, so that a
    // piece moved or drawn anew was measured where it no longer is and left
    // out, and the works and the "+" of gold blinked.
    culler: { updateTransform: true },
  })
  element.appendChild(app.canvas)
  return app
}
