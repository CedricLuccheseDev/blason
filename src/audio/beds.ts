import { chance } from './chance'

// The beds of the land (Concept, « La carte qu'on entend »): long loops,
// the sea, the wind, the woods, the villages, each one family of takes in
// public/sounds/, played on without a seam and always, each as loud as the
// share of the screen it holds (render/ambience.ts says how much). From afar
// the beds sound far, their highs filtered away; up close, whole. A bed
// more is an entry here and its files.

export type Bed = 'sea' | 'wind' | 'wood' | 'village'

type BedSpec = {
  /** Its takes, without the extension; the first the one heard unless the bed turns. */
  files: ReadonlyArray<string>
  /** A take drawn for each game rather than the first. */
  turn?: boolean
  /** Its loudness at its fullest, 0 to 1. */
  gain: number
}

const BEDS: Record<Bed, BedSpec> = {
  sea: { files: ['sea-1', 'sea-2', 'sea-3'], gain: 0.8 },
  wind: { files: ['wind-1', 'wind-2', 'wind-3'], gain: 0.7 },
  wood: { files: ['wood-1', 'wood-2'], gain: 0.6 },
  village: { files: ['village-1', 'village-2', 'village-3'], gain: 0.6 },
}

/** How fast a bed follows the screen, in seconds (a time constant): it comes and goes, it never jumps. */
const DRIFT = 1.5
/** The filter's cutoff from afar and up close, in hertz. */
const FAR_HZ = 700
const NEAR_HZ = 14000

/** Each bed's level, 0 to 1, and how close the camera is, 0 (far) to 1 (up close). */
export type Hearing = { levels: Record<Bed, number>; near: number }

/** The beds looping into `out`, silent until they are set. */
export function makeBeds(
  ctx: AudioContext,
  out: AudioNode,
  load: (file: string) => Promise<AudioBuffer | null>,
) {
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = FAR_HZ
  filter.connect(out)
  const gains = new Map<Bed, GainNode>()
  const sources: Array<AudioBufferSourceNode> = []

  for (const [bed, spec] of Object.entries(BEDS) as Array<[Bed, BedSpec]>) {
    const gain = ctx.createGain()
    gain.gain.value = 0
    gain.connect(filter)
    gains.set(bed, gain)
    const pick = spec.turn ? Math.floor(chance() * spec.files.length) : 0
    void load(spec.files[pick]).then((buffer) => {
      if (!buffer || ctx.state === 'closed') return
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.loop = true
      source.connect(gain)
      // Each from its own moment, so that two takes never meet on a beat.
      source.start(0, chance() * buffer.duration)
      sources.push(source)
    })
  }

  return {
    set({ levels, near }: Hearing) {
      const now = ctx.currentTime
      for (const [bed, gain] of gains)
        gain.gain.setTargetAtTime(levels[bed] * BEDS[bed].gain, now, DRIFT)
      const hz = FAR_HZ * (NEAR_HZ / FAR_HZ) ** near
      filter.frequency.setTargetAtTime(hz, now, DRIFT)
    },
    stop() {
      for (const source of sources) source.stop()
    },
  }
}
