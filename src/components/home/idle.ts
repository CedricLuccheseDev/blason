/**
 * Runs `run` when the browser has a moment, at the latest after `timeout`
 * ms; where it cannot say, a little after the page is painted. Returns how
 * to call it off.
 */
export function whenIdle(run: () => void, timeout: number): () => void {
  if ('requestIdleCallback' in window) {
    const id = requestIdleCallback(run, { timeout })
    return () => cancelIdleCallback(id)
  }
  const id = setTimeout(run, 300)
  return () => clearTimeout(id)
}
