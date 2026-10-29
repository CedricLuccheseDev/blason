// How much the map may cost the machine it runs on: drawn at its best, but
// never sharper than a pixel and a half a point, past which the eye gains
// little and the card pays much. Read where it matters, as the reduced
// motion is (ground/detail.ts): one game on a page at a time.

type Level = 0 | 1 | 2 | 3

type Quality = {
  level: Level
  /** The renderer's pixels a point, and so the canvases painted for it. */
  resolution: number
  /** The decoration's cast shadows, painted with it. */
  shadows: boolean
  /** The life on the land: the mills' sails turning; up close the smoke, the glints and the peasants at work. */
  turning: boolean
  bustle: boolean
  /** The men's shadows under their feet. */
  footing: boolean
  /** Ms a frame may spend painting the decoration. */
  paintMs: number
}

/** The sharpest the map is drawn, in pixels a point. */
const SHARPEST = 1.5

/** The pixels a point at the best: the screen's, never over a pixel and a half. */
export const sharpest = () =>
  Math.min(SHARPEST, globalThis.devicePixelRatio || 1)

function settingsOf(level: Level): Quality {
  return {
    level,
    resolution: sharpest(),
    shadows: true,
    turning: true,
    bustle: true,
    footing: true,
    paintMs: 3,
  }
}

let current = settingsOf(0)

/** The quality the map is drawn at now. */
export const quality = (): Quality => current

/** Back to the best, as each game begins. */
export function bestQuality(): Quality {
  current = settingsOf(0)
  return current
}
