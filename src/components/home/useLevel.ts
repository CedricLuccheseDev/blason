import { useEffect, useState } from 'react'
import { LEVELS } from '../../../engine'
import type { Level } from '../../../engine'

// The rivals' level chosen at the home, kept by the browser for the next
// visit: a convenience of this viewer's, so normal whenever it keeps nothing.

/** Where the browser keeps the bots' level last chosen, for the next visit. */
const LEVEL_KEY = 'blason.level'

/** Keeps the level chosen for the next visit, if the browser keeps anything. */
function keep(level: Level) {
  try {
    localStorage.setItem(LEVEL_KEY, level)
  } catch {
    // Kept for this visit only.
  }
}

/** The bots' level last chosen here, normal the first time or if the browser keeps nothing; turned by a step, or chosen. */
export function useLevel(): [
  Level,
  (step: 1 | -1, wrap?: boolean) => void,
  (level: Level) => void,
] {
  const [level, setLevel] = useState<Level>('normal')
  useEffect(() => {
    try {
      const kept = LEVELS.find((l) => l === localStorage.getItem(LEVEL_KEY))
      if (kept) setLevel(kept)
    } catch {
      // No storage (a private window): normal it stays.
    }
  }, [])
  // The arrows stop at either end; a click goes round.
  const turn = (step: 1 | -1, wrap = false) =>
    setLevel((now) => {
      const n = LEVELS.length
      const i = LEVELS.indexOf(now) + step
      const next = LEVELS[wrap ? (i + n) % n : Math.max(0, Math.min(n - 1, i))]
      keep(next)
      return next
    })
  const choose = (next: Level) => {
    keep(next)
    setLevel(next)
  }
  return [level, turn, choose]
}
