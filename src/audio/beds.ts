import { chance } from './chance'

// The beds of the land (Concept, « La carte qu'on entend »): long loops, each
// one family of takes in public/sounds/, played on without a seam, each as
// loud as what makes it holds of the screen, and from the side of the screen
// it lies on (render/ambience.ts says how much and where). Mixed together as
// one (« Les sons doivent s'entremêler avec un mixage qui rend le tout
// bien »): each bed in its own band of the spectrum, so that they do not
// mask one another; war over life, life over nature, the lower ranks giving
// way while a higher one sounds; and their sum held under a ceiling, however
// many play. From afar the beds sound far, their highs filtered away. A bed
// is fetched only once it is first heard. A bed more is an entry here and
// its files.

export type Bed =
  | 'sea'
  | 'wind'
  | 'river'
  | 'wood'
  | 'village'
  | 'market'
  | 'castle'
  | 'port'
  | 'caravan'
  | 'march'
  | 'battle'
  | 'fire'
  | 'riot'

type BedSpec = {
  /** Its takes, without the extension, one drawn each time it starts. */
  files: ReadonlyArray<string>
  /** Its loudness at its fullest, 0 to 1. */
  gain: number
  /** Nature 0, life 1, war 2: a rank gives way while a higher one sounds. */
  rank: 0 | 1 | 2
  /** The band it is heard in, in hertz, from the lowest to the highest. */
  band: readonly [number, number]
}

export const BEDS: Record<Bed, BedSpec> = {
  sea: {
    files: ['sea-1', 'sea-2', 'sea-3'],
    gain: 0.8,
    rank: 0,
    band: [60, 7000],
  },
  wind: {
    files: ['wind-1', 'wind-2', 'wind-3'],
    gain: 0.7,
    rank: 0,
    band: [80, 3500],
  },
  river: {
    files: ['river-1', 'river-2'],
    gain: 0.5,
    rank: 0,
    band: [300, 9000],
  },
  wood: { files: ['wood-1', 'wood-2'], gain: 0.6, rank: 0, band: [900, 12000] },
  village: {
    files: ['village-1', 'village-2', 'village-3'],
    gain: 0.6,
    rank: 1,
    band: [200, 9000],
  },
  market: {
    files: ['market-1', 'market-2', 'market-3'],
    gain: 0.6,
    rank: 1,
    band: [250, 7000],
  },
  castle: {
    files: ['castle-1', 'castle-2', 'castle-3'],
    gain: 0.5,
    rank: 1,
    band: [150, 10000],
  },
  port: {
    files: ['port-1', 'port-2'],
    gain: 0.5,
    rank: 1,
    band: [150, 9000],
  },
  caravan: {
    files: ['caravan-1', 'caravan-2'],
    gain: 0.55,
    rank: 1,
    band: [120, 6000],
  },
  march: {
    files: ['march-1', 'march-2'],
    gain: 0.6,
    rank: 2,
    band: [70, 5000],
  },
  battle: {
    files: ['battle-1', 'battle-2', 'battle-3'],
    gain: 0.75,
    rank: 2,
    band: [120, 8000],
  },
  fire: { files: ['fire-1', 'fire-2'], gain: 0.6, rank: 2, band: [200, 10000] },
  riot: { files: ['riot-1', 'riot-2'], gain: 0.6, rank: 2, band: [200, 7000] },
}

/** How far a rank gives way while a higher one sounds at its fullest. */
const YIELD = 0.5
/** The most the beds may sound together, as one bed at its fullest (their power summed). */
const CEILING = 1
/** How fast a bed follows the screen, in seconds (a time constant): it comes and goes, it never jumps. */
const DRIFT = 1.5
/** The filter's cutoff from afar and up close, in hertz. */
const FAR_HZ = 700
const NEAR_HZ = 14000

/** A bed as the screen has it: how loud, 0 to 1, and from where, -1 (left) to 1 (right). */
type Heard = { level: number; pan: number }

/** Each bed as the screen has it, and how close the camera is, 0 (far) to 1 (up close). */
export type Hearing = { beds: Record<Bed, Heard>; near: number }

const entries = Object.entries(BEDS) as Array<[Bed, BedSpec]>

/** Each bed's loudness once mixed: its rank yielding to those above, the sum under the ceiling. */
function mixed(beds: Record<Bed, Heard>): Record<Bed, number> {
  const top = [0, 0, 0]
  for (const [bed, spec] of entries)
    top[spec.rank] = Math.max(top[spec.rank], beds[bed].level)
  const out = {} as Record<Bed, number>
  let power = 0
  for (const [bed, spec] of entries) {
    const above = Math.max(0, ...top.slice(spec.rank + 1))
    const level = beds[bed].level * spec.gain * (1 - YIELD * above)
    out[bed] = level
    power += level * level
  }
  const scale = Math.min(1, CEILING / Math.sqrt(power || 1))
  for (const [bed] of entries) out[bed] *= scale
  return out
}

type Voice = { gain: GainNode; pan: StereoPannerNode; started: boolean }

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
  const voices = new Map<Bed, Voice>()
  const sources: Array<AudioBufferSourceNode> = []

  for (const [bed, spec] of entries) {
    const gain = ctx.createGain()
    gain.gain.value = 0
    const low = ctx.createBiquadFilter()
    low.type = 'highpass'
    low.frequency.value = spec.band[0]
    const high = ctx.createBiquadFilter()
    high.type = 'lowpass'
    high.frequency.value = spec.band[1]
    const pan = ctx.createStereoPanner()
    gain.connect(low).connect(high).connect(pan).connect(filter)
    voices.set(bed, { gain, pan, started: false })
  }

  /** Its take fetched and looping, from a moment of its own, so that two never meet on a beat. */
  function start(bed: Bed, voice: Voice) {
    voice.started = true
    const { files } = BEDS[bed]
    const pick = Math.floor(chance() * files.length)
    void load(files[pick]).then((buffer) => {
      if (!buffer || ctx.state === 'closed') return
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.loop = true
      source.connect(voice.gain)
      source.start(0, chance() * buffer.duration)
      sources.push(source)
    })
  }

  return {
    set({ beds, near }: Hearing) {
      const now = ctx.currentTime
      const levels = mixed(beds)
      for (const [bed, voice] of voices) {
        if (!voice.started && levels[bed] > 0) start(bed, voice)
        voice.gain.gain.setTargetAtTime(levels[bed], now, DRIFT)
        voice.pan.pan.setTargetAtTime(beds[bed].pan, now, DRIFT)
      }
      const hz = FAR_HZ * (NEAR_HZ / FAR_HZ) ** near
      filter.frequency.setTargetAtTime(hz, now, DRIFT)
    },
    stop() {
      for (const source of sources) source.stop()
    },
  }
}
