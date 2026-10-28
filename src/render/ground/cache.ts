import type { Texture } from 'pixi.js'

// The ground's painted chunks kept on the graphics card, each for a level
// of zoom, the least lately seen let go first once they weigh more than a
// budget of pixels; a chunk painted before its land last changed is still
// shown until it is painted again.

export type Painted = {
  texture: Texture
  level: number
  version: number
  pixels: number
}

/** Some 24 million pixels: about four screens of a large display at two pixels a point. */
const BUDGET = 24e6

export function makeCache() {
  /** By chunk, then by level; a Map keeps the order they were last used in. */
  const kept = new Map<string, Painted>()
  /** Let go but still on screen, fading out: destroyed once no sprite shows them. */
  let retired: Array<Texture> = []
  let pixels = 0
  const keyOf = (chunk: number, level: number) => `${chunk}:${level}`

  function drop(key: string) {
    const p = kept.get(key)
    if (!p) return
    kept.delete(key)
    pixels -= p.pixels
    retired.push(p.texture)
  }

  return {
    /** A chunk at a level, marked as just used. */
    get(chunk: number, level: number): Painted | undefined {
      const key = keyOf(chunk, level)
      const p = kept.get(key)
      if (p) {
        kept.delete(key)
        kept.set(key, p)
      }
      return p
    },
    /** Of a chunk's painted levels, the nearest to one, a sharper one preferred. */
    nearest(chunk: number, level: number): Painted | undefined {
      let best: Painted | undefined
      let gap = Infinity
      for (let d = 0; d <= 12; d++)
        for (const l of [level + d, level - d]) {
          const p = kept.get(keyOf(chunk, l))
          const g = d + (l < level ? 0.5 : 0)
          if (p && g < gap) [best, gap] = [p, g]
        }
      return best
    },
    /** The textures let go that no sprite shows any more, destroyed. */
    sweep(inUse: Set<Texture>) {
      if (retired.length === 0) return
      const still: Array<Texture> = []
      for (const t of retired) {
        if (inUse.has(t)) still.push(t)
        else t.destroy(true)
      }
      retired = still
    },
    put(chunk: number, painted: Painted, inUse: Set<Texture>) {
      const key = keyOf(chunk, painted.level)
      drop(key)
      kept.set(key, painted)
      pixels += painted.pixels
      for (const [old, p] of kept) {
        if (pixels <= BUDGET) break
        if (!inUse.has(p.texture)) drop(old)
      }
    },
    destroy() {
      for (const key of [...kept.keys()]) drop(key)
      for (const t of retired) t.destroy(true)
      retired = []
    },
  }
}
