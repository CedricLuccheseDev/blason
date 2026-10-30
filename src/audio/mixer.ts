import { makeBeds } from './beds'
import { chance } from './chance'
import { CUES } from './cues'
import {
  COMPRESSOR,
  DUCKS,
  FALL,
  LEVELS,
  RISE,
  ROOM,
  VOICES,
  gainOf,
} from './mix'
import { makeMusic } from './music'
import { makeRoom } from './room'
import type { Hearing } from './beds'
import type { Cue } from './cues'
import type { Bus, Duck } from './mix'

// The game's sound, by the browser's Web Audio, mixed as audio/mix.ts says:
// four buses, each its level and the duck that lowers it, into a master
// that mutes and a compressor. Each cue's files fetched once, played
// together through its own loudness, placed left or right where on the
// screen it happens; the beds looping under them, the music streamed. A
// cry to all lowers the rest while it passes; the end of the game silences
// all but itself, for good. Nothing sounds before the player's first
// gesture (the browser forbids it), nor while the page is hidden; M mutes,
// remembered from one game to the next.

/** Where the player's choice to mute is kept. */
const MUTED = 'blason-muted'

export type Mixer = {
  /** A cue, placed from -1 (left) to 1 (right), at a share of its loudness (the world's, by how close it is). */
  play: (cue: Cue, pan?: number, level?: number) => void
  /** The beds as the screen has them. */
  hear: (hearing: Hearing) => void
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

/** A take of a layer's family, any but the last heard (« les sons sont toujours les mêmes … on se lasse »). */
function takeOf(files: ReadonlyArray<string>, last = -1) {
  if (files.length < 2) return 0
  if (last < 0) return Math.floor(chance() * files.length)
  const i = Math.floor(chance() * (files.length - 1))
  return i >= last ? i + 1 : i
}

/** How far a take may play above or below its pitch, so that one blow heard twice is never quite the same. */
const SWAY = 0.03

/** A take's pitch this time: swayed a little, the end's as recorded. */
function pitchOf(last = false) {
  return last ? 1 : 1 + (chance() * 2 - 1) * SWAY
}

/** The whole game's sound, or the home's: its interface's clicks alone, no beds and no music (« Les son de hud doivent être aussi dans la home »). */
export type Scope = 'game' | 'home'

export function makeMixer(scope: Scope = 'game'): Mixer {
  let ctx: AudioContext | null = null
  let master: GainNode | null = null
  /** Each bus: where its sounds go in, and the gain its ducks move. */
  const buses = new Map<Bus, { input: GainNode; duck: GainNode }>()
  const buffers = new Map<string, Promise<AudioBuffer | null>>()
  const last = new Map<Cue, number>()
  const taken = new Map<string, number>()
  let beds: ReturnType<typeof makeBeds> | null = null
  let music: ReturnType<typeof makeMusic> | null = null
  let muted = readMuted()
  let over = false
  let voices = 0

  const inputOf = (bus: Bus) => buses.get(bus)!.input

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

  /** At the first gesture: the context, its buses and master, every cue's files fetched, the beds and the music begun. */
  function wake() {
    if (ctx) return
    ctx = new AudioContext()
    const squeeze = ctx.createDynamicsCompressor()
    for (const [k, v] of Object.entries(COMPRESSOR))
      squeeze[k as keyof typeof COMPRESSOR].value = v
    squeeze.connect(ctx.destination)
    master = ctx.createGain()
    master.gain.value = muted ? 0 : 1
    master.connect(squeeze)
    const room = makeRoom(ctx, ROOM.decay)
    room.connect(master)
    for (const [bus, db] of Object.entries(LEVELS) as Array<[Bus, number]>) {
      const input = ctx.createGain()
      input.gain.value = gainOf(db)
      const lowered = ctx.createGain()
      input.connect(lowered).connect(master)
      // A share of each bus into the one room, after its duck.
      const send = ctx.createGain()
      send.gain.value = ROOM.sends[bus]
      lowered.connect(send).connect(room)
      buses.set(bus, { input, duck: lowered })
    }
    for (const spec of Object.values(CUES)) {
      if (scope === 'home' && spec.bus !== 'ui') continue
      for (const { file } of spec.layers)
        for (const f of typeof file === 'string' ? [file] : file) void load(f)
    }
    if (scope === 'home') return
    beds = makeBeds(ctx, inputOf('beds'), load)
    music = makeMusic(ctx, inputOf('music'))
  }

  function hide() {
    if (!ctx) return
    if (document.hidden) {
      void ctx.suspend()
      music?.pause()
    } else {
      void ctx.resume()
      music?.resume()
    }
  }

  window.addEventListener('pointerdown', wake)
  window.addEventListener('keydown', wake)
  document.addEventListener('visibilitychange', hide)

  /** The buses lowered while a cue or a cry passes, back after its hold. */
  function duck({ under, depth, hold }: Duck, now: number) {
    for (const bus of under) {
      const gain = buses.get(bus)?.duck.gain
      if (!gain) continue
      gain.cancelScheduledValues(now)
      gain.setTargetAtTime(gainOf(depth), now, FALL)
      gain.setTargetAtTime(1, now + hold, RISE)
    }
  }

  return {
    play(cue, pan = 0, level = 1) {
      if (!ctx || !master || muted || over || document.hidden) return
      const spec = CUES[cue]
      const bus = spec.bus ?? 'cues'
      const now = ctx.currentTime
      if (now - (last.get(cue) ?? -Infinity) < spec.again) return
      if (bus === 'world' && voices >= VOICES) return
      last.set(cue, now)
      if (spec.last) {
        over = true
        for (const b of ['cues', 'world', 'beds', 'ui'] as const)
          buses.get(b)?.duck.gain.setTargetAtTime(0, now, FALL)
        music?.end()
      } else if (spec.cry) duck(DUCKS.cry, now)
      else if (bus === 'cues') duck(DUCKS.cue, now)
      const out = ctx.createGain()
      out.gain.value = spec.gain * level
      const place = ctx.createStereoPanner()
      place.pan.value = Math.max(-1, Math.min(1, pan))
      // A cry or the end is heard over the duck it casts.
      out.connect(place).connect(spec.cry || spec.last ? master : inputOf(bus))
      spec.layers.forEach(({ file, delay = 0 }, i) => {
        const files = typeof file === 'string' ? [file] : file
        const key = `${cue}:${i}`
        const pick = takeOf(files, taken.get(key))
        taken.set(key, pick)
        if (bus === 'world') voices += 1
        void load(files[pick]).then((buffer) => {
          if (!buffer || !ctx) {
            if (bus === 'world') voices -= 1
            return
          }
          const source = ctx.createBufferSource()
          source.buffer = buffer
          source.playbackRate.value = pitchOf(spec.last)
          source.connect(out)
          if (bus === 'world') source.onended = () => (voices -= 1)
          source.start(Math.max(ctx.currentTime, now + delay))
        })
      })
    },
    hear(hearing) {
      if (!over) beds?.set(hearing)
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
      beds?.stop()
      music?.stop()
      void ctx?.close()
    },
  }
}
