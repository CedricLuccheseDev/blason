// The simulation's two units. It steps ten times a second and never reads
// the clock; men and gold are counted in thousandths, so every rate stays an
// integer and a game plays out the same on every machine.

export const TICKS_PER_SECOND = 10
export const UNIT = 1000
