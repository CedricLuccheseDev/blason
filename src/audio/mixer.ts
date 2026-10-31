import { makeBeds } from './beds'
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
import { sway, takeOf, takesFor } from './takes'
import { gainOfVolume, listenSound, soundSettings, toggleMuted } from './settings'
import type { Hearing } from './beds'
import type { Cue, CueSpec } from './cues'
import type { Bus, Duck } from './mix'
import type { Scope } from './takes'

// The game's sound, by the browser's Web Audio, mixed as audio/mix.ts says:
// four buses, each its level and the duck that lowers it, into a master
// that mutes and a compressor. Each cue's files fetched once, played
// together through its own loudness, placed left or right where on the
// screen it happens; the beds looping under them, the music streamed. A
// cry to all lowers the rest while it passes; the end of the game silences
// all but itself, for good. Nothing sounds before the player's first
// gesture (the browser forbids it), nor while the page is hidden; M mutes,
// and the player's volumes set each its buses (audio/settings.ts), kept
// from one game to the next.

/** Which of the player's volumes sets each bus: the music, the beds, and the rest. */
const VOLUME_OF: Record<Bus, 'music' | 'beds' | 'effects'> = {
  cues: 'effects',
  world: 'effects',
  beds: 'beds',
  music: 'music',
  ui: 'effects',
}

export type Mixer = {
  /** A cue, placed from -1 (left) to 1 (right), at a share of its loudness (the world's, by how close it is). */
  play: (cue: Cue, pan?: number, level?: number) => void
  /** The beds as the screen has them. */
  hear: (hearing: Hearing) => void
  /** Mutes or unmutes; whether it is muted now. */
  toggle: () => boolean
  /** Whether a game's end was heard: everything after it silent. */
  ended: () => boolean
  destroy: () => void
}

export type { Scope } from './takes'

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
  let over = false
  let voices = 0

  const inputOf = (bus: Bus) => buses.get(bus)!.input
  const muted = () => soundSettings().muted

  /** The player's settings laid on the master and the buses, at once or over a moment. */
  function settle(glide = 0.05) {
    if (!ctx || !master) return
    const { volumes } = soundSettings()
    const now = ctx.currentTime
    const whole = muted() ? 0 : gainOfVolume(volumes.all)
    master.gain.setTargetAtTime(whole, now, glide)
    for (const [bus, { input }] of buses)
      input.gain.setTargetAtTime(
        gainOf(LEVELS[bus]) * gainOfVolume(volumes[VOLUME_OF[bus]]),
        now,
        glide,
      )
  }
  const unlisten = listenSound(() => settle())

  function load(file: string): Promise<AudioBuffer | null> {
    const known = buffers.get(file)
    if (known) return known
    const loading = fetch(`/sounds/${file}.ogg`)
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
    master.gain.value = 0
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
    settle(0.01)
    for (const take of takesFor(scope)) void load(take)
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

  /** What a cue casts as it sounds: the end silences all but the music's end, a cry or an informing cue lowers what lies under it. */
  function cast(spec: CueSpec, bus: Bus, now: number) {
    if (spec.last) {
      over = true
      for (const b of ['cues', 'world', 'beds', 'ui'] as const)
        buses.get(b)?.duck.gain.setTargetAtTime(0, now, FALL)
      music?.end()
    } else if (spec.cry) duck(DUCKS.cry, now)
    else if (bus === 'cues') duck(DUCKS.cue, now)
  }

  /** One of a cue's layers: a take of its family, fetched and played into the cue's output after its delay. */
  function sound(
    cue: Cue,
    i: number,
    { file, delay = 0 }: CueSpec['layers'][number],
    out: GainNode,
    now: number,
  ) {
    const spec = CUES[cue]
    const world = (spec.bus ?? 'cues') === 'world'
    const files = typeof file === 'string' ? [file] : file
    const key = `${cue}:${i}`
    const pick = takeOf(files, taken.get(key))
    taken.set(key, pick)
    if (world) voices += 1
    void load(files[pick]).then((buffer) => {
      if (!buffer || !ctx) {
        if (world) voices -= 1
        return
      }
      const source = ctx.createBufferSource()
      source.buffer = buffer
      // The end as recorded; every other take a little higher or lower.
      source.playbackRate.value = spec.last ? 1 : sway()
      source.connect(out)
      if (world) source.onended = () => (voices -= 1)
      source.start(Math.max(ctx.currentTime, now + delay))
    })
  }

  return {
    play(cue, pan = 0, level = 1) {
      if (!ctx || !master || muted() || over || document.hidden) return
      const spec = CUES[cue]
      const bus = spec.bus ?? 'cues'
      const now = ctx.currentTime
      if (now - (last.get(cue) ?? -Infinity) < spec.again) return
      if (bus === 'world' && voices >= VOICES) return
      last.set(cue, now)
      cast(spec, bus, now)
      const out = ctx.createGain()
      out.gain.value = spec.gain * level
      const place = ctx.createStereoPanner()
      place.pan.value = Math.max(-1, Math.min(1, pan))
      // A cry or the end is heard over the duck it casts.
      out.connect(place).connect(spec.cry || spec.last ? master : inputOf(bus))
      spec.layers.forEach((layer, i) => sound(cue, i, layer, out, now))
    },
    hear(hearing) {
      if (!over) beds?.set(hearing)
    },
    toggle: toggleMuted,
    ended: () => over,
    destroy() {
      unlisten()
      window.removeEventListener('pointerdown', wake)
      window.removeEventListener('keydown', wake)
      document.removeEventListener('visibilitychange', hide)
      beds?.stop()
      music?.stop()
      void ctx?.close()
    },
  }
}
