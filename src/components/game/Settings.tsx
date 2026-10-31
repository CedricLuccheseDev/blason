import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Choices } from '../hud/Choices'
import { KeyCap } from '../hud/Emblem'
import { actClass } from '../hud/Act'
import { Inline, Line, Panel } from '../hud/Layout'
import { Heading, Note, Word } from '../hud/Text'
import type { Volume } from '~/audio/settings'
import type { Locale } from '~/i18n/locale'
import {
  listenSound,
  setVolume,
  soundSettings,
  toggleMuted,
} from '~/audio/settings'
import { useChooseLocale, useLocale, useMessages } from '~/i18n'

// The settings (« la modale de réglages, avec les volumes », drawn on the
// maquette and taken, « Réglages niquel »): a button with a cogwheel in ink,
// the sign every player knows, beside the game's name and beside the player
// on the home; a click lays a sheet by it: four volumes, each its word, its
// slider and its figure; the sound on or cut, its key M; the language,
// changed at once. Escape or a click elsewhere puts it down.

const VOLUMES: ReadonlyArray<Volume> = ['all', 'music', 'beds', 'effects']
const LOCALES: ReadonlyArray<{ value: Locale; label: string }> = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
]

/** The cogwheel, in ink on parchment: its teeth a dashed ring, its hub. */
function Cog() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-6">
      <circle
        cx="12"
        cy="12"
        r="8.6"
        fill="none"
        stroke="var(--color-quill)"
        strokeWidth="4.2"
        strokeDasharray="3.4 3.35"
      />
      <circle
        cx="12"
        cy="12"
        r="7"
        fill="var(--color-vellum)"
        stroke="var(--color-quill)"
        strokeWidth="2"
      />
      <circle
        cx="12"
        cy="12"
        r="2.6"
        fill="none"
        stroke="var(--color-quill)"
        strokeWidth="2"
      />
    </svg>
  )
}

function Sheet() {
  const m = useMessages().settings
  const { volumes, muted } = useSyncExternalStore(
    listenSound,
    soundSettings,
    soundSettings,
  )
  const locale = useLocale()
  const choose = useChooseLocale()
  return (
    <Panel gap="hair" className="w-[calc(340px*var(--hud))] max-w-[90vw]">
      <Heading>{m.title}</Heading>
      <Note>{m.sound}</Note>
      {VOLUMES.map((volume) => (
        <Line key={volume} name={<Word>{m.volumes[volume]}</Word>}>
          <Inline className="w-full">
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={volumes[volume]}
              aria-label={m.volumes[volume]}
              onChange={(e) => setVolume(volume, Number(e.target.value))}
              className="hud-range"
            />
            <span className="hud-figure w-9 shrink-0 text-right">
              {volumes[volume]}
            </span>
          </Inline>
        </Line>
      ))}
      <Line
        name={
          <Inline gap="hair">
            <Word>{m.mute}</Word>
            <KeyCap k="M" />
          </Inline>
        }
      >
        <Choices
          name={m.mute}
          options={[
            { value: 'on', label: m.on },
            { value: 'off', label: m.off },
          ]}
          value={muted ? 'off' : 'on'}
          onPick={(v) => {
            if ((v === 'off') !== muted) toggleMuted()
          }}
        />
      </Line>
      <Note>{m.language}</Note>
      <Choices
        name={m.language}
        options={LOCALES}
        value={locale}
        onPick={choose}
      />
    </Panel>
  )
}

/** The settings' button and, once pressed, its sheet: under it, or above it at the foot of a page (`up`). */
export function Settings({ up = false }: Readonly<{ up?: boolean }>) {
  const m = useMessages().settings
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return
    const away = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false)
    }
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('pointerdown', away)
    window.addEventListener('keydown', key)
    return () => {
      window.removeEventListener('pointerdown', away)
      window.removeEventListener('keydown', key)
    }
  }, [open])

  return (
    <span ref={box} className="pointer-events-auto relative inline-flex">
      <button
        type="button"
        aria-label={m.open}
        title={m.open}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={actClass('plain')}
      >
        <Cog />
      </button>
      {open && (
        // norm-ok: the sheet hung by its button, the room between them as the drawers' (BarDrawer.tsx).
        <span
          className={`absolute left-0 z-30 w-max ${up ? 'bottom-full pb-2' : 'top-full pt-2'}`}
        >
          <Sheet />
        </span>
      )}
    </span>
  )
}
