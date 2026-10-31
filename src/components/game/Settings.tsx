import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { Choices } from '../hud/Choices'
import { KeyCap } from '../hud/Emblem'
import { actClass } from '../hud/Act'
import { Caption, Inline, Panel } from '../hud/Layout'
import { Heading } from '../hud/Text'
import { Setting } from '../hud/Setting'
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

/** Pixels kept between the sheet and the screen's right edge. */
const EDGE = 12

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
  // The book's hierarchy (BookSettings.tsx): the sheet's title over a gold
  // rule, then each setting alike, its name small above, its control under it.
  return (
    <Panel
      gap="part"
      className="w-[calc(320px*var(--hud))] max-w-[calc(100vw-24px)]"
    >
      <Caption>
        <Heading>{m.title}</Heading>
      </Caption>
      {VOLUMES.map((volume) => (
        <Setting key={volume} name={m.volumes[volume]}>
          <Inline>
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
        </Setting>
      ))}
      <Setting name={m.mute} aside={<KeyCap k="M" />}>
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
      </Setting>
      <Setting name={m.language}>
        <Choices
          name={m.language}
          options={LOCALES}
          value={locale}
          onPick={choose}
        />
      </Setting>
    </Panel>
  )
}

/** The settings' button and, once pressed, its sheet: under it, or above it at the foot of a page (`up`). */
export function Settings({ up = false }: Readonly<{ up?: boolean }>) {
  const m = useMessages().settings
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLSpanElement>(null)
  const hung = useRef<HTMLSpanElement>(null)
  // Within the screen, as the bar's drawers: moved left as far as it runs past the right edge.
  const [shift, setShift] = useState(0)
  useLayoutEffect(() => {
    const rect = hung.current?.getBoundingClientRect()
    if (!open || !rect) return setShift(0)
    const over = rect.right - shift - (window.innerWidth - EDGE)
    setShift(Math.max(0, over))
  }, [open])

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
          ref={hung}
          className={`absolute left-0 z-30 w-max ${up ? 'bottom-full pb-2' : 'top-full pt-2'}`}
          style={{ transform: `translateX(${-shift}px)` }}
        >
          <Sheet />
        </span>
      )}
    </span>
  )
}
