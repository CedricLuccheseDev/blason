// What the player set of the sound (« la modale de réglages, avec les
// volumes »): four volumes, the whole, the music, the beds, the rest (the
// cues, the world up close and the interface), from 0 to 100, and whether
// it is muted (M); kept in the browser from one visit to the next, and told
// to whoever listens, the mixer of the game or of the home, the settings'
// sheet. It knows nothing of the game.

export type Volume = 'all' | 'music' | 'beds' | 'effects'
type Volumes = Readonly<Record<Volume, number>>
export type SoundSettings = Readonly<{ volumes: Volumes; muted: boolean }>

/** Where they are kept; the mute where it was before the volumes came. */
const VOLUMES = 'blason-volumes'
const MUTED = 'blason-muted'

const FULL: Volumes = { all: 100, music: 100, beds: 100, effects: 100 }

function read(): SoundSettings {
  try {
    const kept = JSON.parse(
      window.localStorage.getItem(VOLUMES) ?? '{}',
    ) as Partial<Record<Volume, unknown>>
    const volumes = Object.fromEntries(
      Object.entries(FULL).map(([k, full]) => {
        const v = kept[k as Volume]
        return [k, typeof v === 'number' ? Math.max(0, Math.min(100, v)) : full]
      }),
    ) as Volumes
    return {
      volumes,
      muted: window.localStorage.getItem(MUTED) === '1',
    }
  } catch {
    return { volumes: FULL, muted: false }
  }
}

function keep({ volumes, muted }: SoundSettings) {
  try {
    window.localStorage.setItem(VOLUMES, JSON.stringify(volumes))
    window.localStorage.setItem(MUTED, muted ? '1' : '0')
  } catch {
    // Storage refused: kept for this visit only.
  }
}

let current: SoundSettings | null = null
const listeners = new Set<() => void>()

/** The settings as they stand, the same object until they change. */
export function soundSettings(): SoundSettings {
  current ??= read()
  return current
}

function change(next: SoundSettings) {
  current = next
  keep(next)
  for (const listener of listeners) listener()
}

/** One volume set, from 0 to 100. */
export function setVolume(volume: Volume, value: number) {
  const { volumes, muted } = soundSettings()
  change({ volumes: { ...volumes, [volume]: value }, muted })
}

/** Muted or back; whether it is muted now. */
export function toggleMuted(): boolean {
  const { volumes, muted } = soundSettings()
  change({ volumes, muted: !muted })
  return !muted
}

/** Told of every change; the call returned stops it. */
export function listenSound(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** A volume as a gain: heard as loudness is, a half on the slider a quarter of the power. */
export const gainOfVolume = (value: number) => (value / 100) ** 2
