// Integer helpers: no floating point reaches the state, so every machine
// computes exactly the same game.

export function isqrt(n: number): number {
  if (n < 2) return n
  let x = n
  let y = Math.floor((x + 1) / 2)
  while (y < x) {
    x = y
    y = Math.floor((x + Math.floor(n / x)) / 2)
  }
  return x
}

// Seeded draws without a running state: a draw is a pure function of the
// seed and its keys, so adding a draw somewhere never shifts the others.
function hash(text: string): number {
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 2654435761)
    h2 = Math.imul(h2 ^ c, 1597334677)
  }
  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  // 21 bits of one half and 32 of the other: 53 bits, all a number holds exactly.
  return 4294967296 * (2097151 & h2) + (h1 >>> 0)
}

/** An integer in [0, n), the same every time for the same seed and keys. */
export function drawInt(
  seed: string,
  n: number,
  ...keys: Array<string | number>
): number {
  return hash(`${seed}|${keys.join('|')}`) % n
}

export function fingerprint(text: string): string {
  return hash(text).toString(16)
}
