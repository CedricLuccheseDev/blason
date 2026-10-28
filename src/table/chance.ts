// The table's chance: the die's fall, and the mode it draws. Nothing rides
// on it but a card turned, yet it is drawn from the browser's crypto all
// the same, as the game's seeds are (render/ahead.ts).

/** A number in [0, 1). */
export const chance = () =>
  crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32
