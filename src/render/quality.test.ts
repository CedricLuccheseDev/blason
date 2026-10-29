import { describe, expect, it } from 'vitest'
import { bestQuality, quality, watchFrames } from './quality'
import type { Quality } from './quality'

const AIM = 1000 / 60

/** So many windows of frames, each frame so many ms. */
function play(
  watch: ReturnType<typeof watchFrames>,
  windows: number,
  ms: number,
) {
  for (let i = 0; i < windows * 90; i++) watch.frame(ms, AIM)
}

describe('the quality watching the frames', () => {
  it('steps down when the frames run long, and back up when there is room', () => {
    bestQuality()
    const told: Array<Quality> = []
    const watch = watchFrames((q) => told.push(q))
    play(watch, 3, 30)
    expect(quality().level).toBe(1)
    expect(told).toHaveLength(1)
    // The step helped: the frames are short again; the level comes back after a while.
    play(watch, 2, 16)
    expect(quality().level).toBe(1)
    play(watch, 10, 16)
    expect(quality().level).toBe(0)
  })

  it('undoes a step down that did not shorten the frames, and holds', () => {
    bestQuality()
    const watch = watchFrames(() => undefined)
    // A screen that caps the frames at 30 a second: nothing the map does helps.
    play(watch, 4, 33.3)
    expect(quality().level).toBe(1)
    play(watch, 1, 33.3)
    expect(quality().level).toBe(0)
    play(watch, 10, 33.3)
    expect(quality().level).toBe(0)
  })

  it('reads the middle frame, not the hiccups', () => {
    bestQuality()
    const watch = watchFrames(() => undefined)
    for (let i = 0; i < 90 * 6; i++) watch.frame(i % 10 === 0 ? 200 : 16, AIM)
    expect(quality().level).toBe(0)
  })

  it('begins at its best, never sharper than a pixel and a half a point', () => {
    const best = bestQuality()
    expect(best.resolution).toBeLessThanOrEqual(1.5)
    expect(best.shadows && best.bustle && best.turning).toBe(true)
  })
})
