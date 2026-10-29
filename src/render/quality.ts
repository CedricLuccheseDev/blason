// How much the map may cost the machine it runs on. The game is drawn at
// its best, but never sharper than a pixel and a half a point, and it is
// watched: when the frames run long, the drawing steps down a level (fewer
// pixels, the decoration painted plainer and without its shadows, less life
// on the land), and back up when there is room again. A level that had to
// be left is tried again later and later. Read where it matters, as the
// reduced motion is (ground/detail.ts): one game on a page at a time.

import type { Application } from 'pixi.js'

export type Level = 0 | 1 | 2 | 3

export type Quality = {
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

/** The sharpest the map is drawn, in pixels a point: past it the eye gains little and the card pays much. */
const SHARPEST = 1.5
/** Each level's share of the sharpest resolution, never under half a pixel a point. */
const SHARE: Record<Level, number> = { 0: 1, 1: 0.85, 2: 0.7, 3: 0.5 }

/** The pixels a point at the best: the screen's, never over a pixel and a half. */
export const sharpest = () =>
  Math.min(SHARPEST, globalThis.devicePixelRatio || 1)

function settingsOf(level: Level): Quality {
  const best = sharpest()
  return {
    level,
    resolution: Math.max(0.5, Math.round(best * SHARE[level] * 20) / 20),
    shadows: level < 2,
    turning: level < 3,
    bustle: level < 1,
    footing: level < 3,
    paintMs: level < 2 ? 3 : 1.5,
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

/** Frames a verdict is read over; how much longer than the frame aimed at the middle frame may run before the drawing steps down, and how near it must be to step up. */
const WINDOW = 90
const SLOW = 1.35
const ROOM = 1.12
/** Windows of room before a level up is tried, doubled each time that level had to be left again; windows a step down that did not help forbids another. */
const PATIENCE = 4
const HOLD = 20

/**
 * Watches the frames, `aim` ms each (a 60th of a second, or the cap a page
 * set): when the middle frame of a window runs much longer, one level
 * down; after several windows with room, one up. A step down that did not
 * shorten the frames is undone and none is tried for a while: what holds
 * them is not the map (a screen or a battery that caps them). The window
 * after a change, and the first ones, are not read: the map is painted
 * again then. `onChange` is told the new quality.
 */
export function watchFrames(onChange: (q: Quality) => void) {
  const frames = new Float32Array(WINDOW)
  let n = 0
  let calm = 2
  let roomy = 0
  let hold = 0
  let tried: { from: Level; middle: number } | null = null
  /** Windows of room needed before each level is tried again. */
  const wait: Record<Level, number> = {
    0: PATIENCE,
    1: PATIENCE,
    2: PATIENCE,
    3: PATIENCE,
  }

  function set(level: Level) {
    current = settingsOf(level)
    calm = 1
    roomy = 0
    onChange(current)
  }

  function judge(middle: number, aim: number) {
    const { level } = current
    if (tried) {
      const { from, middle: before } = tried
      tried = null
      if (middle > before * 0.9) {
        hold = HOLD
        set(from)
        return
      }
    }
    if (hold > 0) hold--
    if (middle > aim * SLOW) {
      if (level === 3 || hold > 0) return
      tried = { from: level, middle }
      // The level left is tried again later, the longer the more often it fails.
      wait[level] = Math.min(64, wait[level] * 2)
      set((level + 1) as Level)
    } else if (middle < aim * ROOM && level > 0) {
      const up = (level - 1) as Level
      if (++roomy >= wait[up]) set(up)
    } else roomy = 0
  }

  return {
    /** A frame drawn, so many ms after the last, against the ms aimed at. */
    frame(ms: number, aim: number) {
      frames[n++] = ms
      if (n < WINDOW) return
      n = 0
      if (calm > 0) {
        calm--
        return
      }
      judge(frames.slice().sort()[WINDOW >> 1], aim)
    },
    /** The frames forgotten, after the page was hidden. */
    reset() {
      n = 0
      calm = Math.max(calm, 1)
    },
  }
}

/**
 * The game's frames watched, its renderer's resolution following the
 * quality; while the page is hidden the ticker stops, and its frames are
 * forgotten. `frameMs`: the frame aimed at. Returns what undoes it.
 */
export function governFrames(app: Application, frameMs: number) {
  const frames = watchFrames((q) =>
    app.renderer.resize(app.screen.width, app.screen.height, q.resolution),
  )
  let first = true
  const watch = () => {
    if (!first) frames.frame(app.ticker.elapsedMS, frameMs)
    first = false
  }
  const onVisibility = () => {
    if (document.hidden) app.ticker.stop()
    else {
      frames.reset()
      first = true
      app.ticker.start()
    }
  }
  app.ticker.add(watch)
  document.addEventListener('visibilitychange', onVisibility)
  return () => {
    app.ticker.remove(watch)
    document.removeEventListener('visibilitychange', onVisibility)
  }
}
