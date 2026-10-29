import { UPDATE_PRIORITY } from 'pixi.js'
import type { Application } from 'pixi.js'

// The frame's account, for whoever plays with ?perf in the address
// (« le jeu rame quand il commence à voir pas mal de choses »): each second,
// the frames drawn, the longest, and the time the game spent on each part of
// a frame, the simulation, each layer of the map, the rest of the frame
// (Pixi's own drawing and the browser's) by difference; written in a corner.
// Nothing is measured without it.

export type Measure = <T>(name: string, part: () => T) => T

/** No account kept: the part run as it is. */
export const unmeasured: Measure = (_, part) => part()

export function makePerf(app: Application, on: boolean) {
  if (!on)
    return {
      measure: unmeasured,
      frame: () => {},
      mark: () => {},
      since: () => {},
      destroy: () => {},
    }
  const spent = new Map<string, number>()
  let frames = 0
  let longest = 0
  let last = performance.now()
  let counted = last
  const board = document.createElement('pre')
  board.style.cssText =
    'position:fixed;top:8px;right:8px;z-index:60;margin:0;padding:8px 10px;background:rgb(246 238 219 / 0.92);border:1px solid #2b1e12;font:12px/1.35 monospace;color:#2b1e12;pointer-events:none;white-space:pre'
  document.body.appendChild(board)

  let marked = 0
  /** The time from the last mark to now, counted to the part: Pixi's drawing after the game's. */
  const since = (name: string) => {
    spent.set(name, (spent.get(name) ?? 0) + performance.now() - marked)
  }

  // Pixi draws after the game's work: its time, from the game's last mark.
  app.ticker.add(() => since('pixi'), undefined, UPDATE_PRIORITY.UTILITY)

  const measure: Measure = (name, part) => {
    const start = performance.now()
    const result = part()
    spent.set(name, (spent.get(name) ?? 0) + performance.now() - start)
    return result
  }

  /** A frame begun: the last one counted, and the account written each second. */
  function frame() {
    const now = performance.now()
    longest = Math.max(longest, now - last)
    last = now
    frames += 1
    if (now - counted < 1000) return
    const per = (ms: number) => (ms / frames).toFixed(1).padStart(5)
    const total = (now - counted) / frames
    const ours = [...spent.values()].reduce((a, b) => a + b, 0) / frames
    const parts = [...spent]
      .sort((a, b) => b[1] - a[1])
      .map(([name, ms]) => `${name.padEnd(9)}${per(ms)} ms`)
    board.textContent = [
      `${frames} images/s, la plus longue ${longest.toFixed(0)} ms`,
      `image     ${total.toFixed(1).padStart(5)} ms`,
      ...parts,
      `attente  ${(total - ours).toFixed(1).padStart(5)} ms (libre, ou la carte graphique)`,
    ].join('\n')
    spent.clear()
    frames = 0
    longest = 0
    counted = now
  }

  return {
    measure,
    frame,
    mark: () => {
      marked = performance.now()
    },
    since,
    destroy: () => board.remove(),
  }
}
