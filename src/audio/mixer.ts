import { CUES } from './cues'
import type { Cue } from './cues'

// The game's sound, by the browser's Web Audio: each cue's files fetched
// once, played together through its own loudness and placed left or right,
// where on the screen it happens. A cry to all lowers the other sounds while
// it passes; the end of the game silences them for good. Nothing sounds
// before the player's first gesture (the browser forbids it), nor while the
// page is hidden; M mutes, remembered from one game to the next.

/** Where the player's choice to mute is kept. */
const MUTED = 'blason-muted'
/** How low the other sounds fall under a cry, for how long, and how fast they fall and come back, in seconds. */
const DUCK = 0.3
const CRY = 2
const FALL = 0.08
const RISE = 0.6

export type Mixer = {
  /** A cue, placed from -1 (left) to 1 (right). */
  play: (cue: Cue, pan?: number) => void
  /** Mutes or unmutes; whether it is muted now. */
  toggle: () => boolean
  destroy: () => void
}

function readMuted(): boolean {
  try {
    return window.localStorage.getItem(MUTED) === '1'
  } catch {
    return false
  }
}

function keepMuted(muted: boolean) {
  try {
    window.localStorage.setItem(MUTED, muted ? '1' : '0')
  } catch {
    // Storage refused: muted for this game only.
  }
}

export function makeMixer(): Mixer {
  let ctx: AudioContext | null = null
  let master: GainNode | null = null
  let effects: GainNode | null = null
  const buffers = new Map<string, Promise<AudioBuffer | null>>()
  const last = new Map<Cue, number>()
  let muted = readMuted()
  let over = false

  function load(file: string): Promise<AudioBuffer | null> {
    const known = buffers.get(file)
    if (known) return known
    const loading = fetch(`/sounds/${file}.mp3`)
      .then((r) => r.arrayBuffer())
      .then((bytes) => ctx?.decodeAudioData(bytes) ?? null)
      .catch(() => null)
    buffers.set(file, loading)
    return loading
  }

  /** At the first gesture: the context, its two levels, every file fetched. */
  function wake() {
    if (ctx) return
    ctx = new AudioContext()
    master = ctx.createGain()
    master.gain.value = muted ? 0 : 1
    master.connect(ctx.destination)
    effects = ctx.createGain()
    effects.connect(master)
    for (const spec of Object.values(CUES))
      for (const layer of spec.layers) void load(layer.file)
  }

  function hide() {
    if (!ctx) return
    void (document.hidden ? ctx.suspend() : ctx.resume())
  }

  window.addEventListener('pointerdown', wake)
  window.addEventListener('keydown', wake)
  document.addEventListener('visibilitychange', hide)

  /** The other sounds lowered while a cry passes. */
  function duck(level: GainNode, now: number) {
    level.gain.cancelScheduledValues(now)
    level.gain.setTargetAtTime(DUCK, now, FALL)
    level.gain.setTargetAtTime(1, now + CRY, RISE)
  }

  return {
    play(cue, pan = 0) {
      if (!ctx || !master || !effects || muted || over || document.hidden)
        return
      const spec = CUES[cue]
      const now = ctx.currentTime
      if (now - (last.get(cue) ?? -Infinity) < spec.again) return
      last.set(cue, now)
      if (spec.last) {
        over = true
        effects.gain.setTargetAtTime(0, now, FALL)
      } else if (spec.cry) duck(effects, now)
      const out = ctx.createGain()
      out.gain.value = spec.gain
      const place = ctx.createStereoPanner()
      place.pan.value = Math.max(-1, Math.min(1, pan))
      out.connect(place).connect(spec.cry || spec.last ? master : effects)
      for (const { file, delay = 0 } of spec.layers)
        void load(file).then((buffer) => {
          if (!buffer || !ctx) return
          const source = ctx.createBufferSource()
          source.buffer = buffer
          source.connect(out)
          source.start(Math.max(ctx.currentTime, now + delay))
        })
    },
    toggle() {
      muted = !muted
      keepMuted(muted)
      if (ctx && master)
        master.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.05)
      return muted
    },
    destroy() {
      window.removeEventListener('pointerdown', wake)
      window.removeEventListener('keydown', wake)
      document.removeEventListener('visibilitychange', hide)
      void ctx?.close()
    },
  }
}
