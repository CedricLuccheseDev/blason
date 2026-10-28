/** A colour of the game as CSS. */
export function hex(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`
}

/** Seconds as m:ss, the way the game's clocks read. */
export function minutes(seconds: number): string {
  const m = Math.floor(seconds / 60)
  return `${m}:${String(seconds % 60).padStart(2, '0')}`
}

/**
 * A count as the game writes it, thousands set apart by a six-per-em space:
 * in Alegreya Sans the thin space is nearly as wide as a figure.
 */
export function count(n: number): string {
  return n.toLocaleString('fr-FR').replace(/\s/g, '\u2006')
}
