import { chance } from './chance'

// The game's one room (audio/mix.ts, ROOM): a reverberation made in the
// page rather than recorded, two channels of noise dying away, its highs
// first, as a sound does under an open sky.

/** A convolver whose response lasts `decay` seconds. */
export function makeRoom(ctx: AudioContext, decay: number): ConvolverNode {
  const length = Math.floor(ctx.sampleRate * decay)
  const response = ctx.createBuffer(2, length, ctx.sampleRate)
  for (let c = 0; c < 2; c++) {
    const data = response.getChannelData(c)
    let soft = 0
    for (let i = 0; i < length; i++) {
      const left = 1 - i / length
      // Smoothed more as it dies: the highs go before the lows.
      soft += (chance() * 2 - 1 - soft) * (0.15 + 0.85 * left)
      data[i] = soft * left ** 3
    }
  }
  const room = ctx.createConvolver()
  room.buffer = response
  return room
}
