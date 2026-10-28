import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode, RefObject } from 'react'
import { Spectacle } from '~/components/home/Spectacle'
import { Act } from '~/components/hud/Act'
import { Shield } from '~/components/hud/Emblem'
import { Sheet } from '~/components/hud/Sheet'
import { useMessages } from '~/i18n'

export const Route = createFileRoute('/')({
  staticData: { chrome: false },
  component: Home,
})

const PORTFOLIO_URL = 'https://clhub.fr'

/** The room the menu's scroll takes on a screen wide enough to keep the map beside it. */
const MENU = 400
const WIDE = 640

// While the home is read, the next game's land is made: the click on Play
// lands straight in the opening, as on OpenFront.
function useGameAhead() {
  useEffect(() => {
    const ready = () =>
      void import('~/render/client').then(({ prepareGame }) => prepareGame())
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(ready, { timeout: 2500 })
      return () => cancelIdleCallback(id)
    }
    const id = setTimeout(ready, 1000)
    return () => clearTimeout(id)
  }, [])
}

/**
 * The home, as a game's title screen: behind, a game the bots play, watched
 * by a directed camera; on the left, on a scroll of parchment hanging rolled
 * at both ends, the shield and the name, then the menu, walked with the arrows and Enter, a gold lozenge
 * before the entry chosen; the version at the foot. To watch, the menu draws
 * aside and the camera takes the whole screen; Escape brings it back.
 */
function Home() {
  const m = useMessages()
  const [watching, setWatching] = useState(false)
  useGameAhead()
  const shown = useRef(true)
  shown.current = !watching
  const menu = useRef<HTMLElement>(null)
  // The room the menu takes: its width on the left of a wide screen, its
  // height at the bottom of a phone held upright, none while watching.
  const room = () => {
    if (!shown.current) return { left: 0, bottom: 0 }
    if (window.innerWidth >= WIDE) return { left: MENU, bottom: 0 }
    return { left: 0, bottom: (menu.current?.offsetHeight ?? 0) + 16 }
  }

  useEffect(() => {
    if (!watching) return
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') setWatching(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [watching])

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-vellum select-none">
      <Spectacle room={room} />
      {watching ? (
        <div className="absolute top-4 left-4">
          <Act tone="plain" onClick={() => setWatching(false)}>
            {m.home.back}
          </Act>
        </div>
      ) : (
        <Menu onWatch={() => setWatching(true)} menu={menu} />
      )}
    </main>
  )
}

function Menu({
  onWatch,
  menu,
}: Readonly<{ onWatch: () => void; menu: RefObject<HTMLElement | null> }>) {
  const m = useMessages()
  const [chosen, setChosen] = useState(0)
  const list = useRef<HTMLUListElement>(null)
  const items = () =>
    Array.from(
      list.current?.querySelectorAll<HTMLElement>('[data-entry]') ?? [],
    )

  // As in a game, the first entry is in hand from the start.
  useEffect(() => items()[0]?.focus({ preventScroll: true }), [])

  function onKey(e: KeyboardEvent) {
    const step = { ArrowDown: 1, ArrowUp: -1 }[e.key]
    if (!step) return
    e.preventDefault()
    const all = items()
    all[(chosen + step + all.length) % all.length]?.focus()
  }

  const entry = (i: number) => ({
    'data-entry': true,
    'data-chosen': chosen === i,
    onFocus: () => setChosen(i),
    onMouseEnter: (e: { currentTarget: HTMLElement }) =>
      e.currentTarget.focus({ preventScroll: true }),
  })

  return (
    <nav
      ref={menu}
      aria-label={m.home.menu}
      onKeyDown={onKey}
      className="absolute inset-x-4 bottom-4 sm:top-6 sm:right-auto sm:bottom-6 sm:left-6 sm:w-[340px] short:top-4 short:bottom-4"
    >
      <Sheet
        rolled="ends"
        className="flex flex-col justify-between gap-6 p-6 sm:h-full short:gap-3 short:p-4"
      >
        <header className="flex flex-col gap-3">
          <span className="short:hidden">
            <Shield color="var(--color-gilt)" size="l" />
          </span>
          {/* norm-ok: wordmark, not copy */}
          <h1 className="font-caps text-6xl leading-none text-quill">Blason</h1>
          <p className="hud-note text-hud-m short:hidden">{m.home.tagline}</p>
          <Flourish />
        </header>
        <ul ref={list} className="flex flex-col gap-2">
          <li>
            <Link to="/play" {...entry(0)} className={ENTRY}>
              <Lozenge />
              <span className="text-hud-xl">{m.home.play}</span>
            </Link>
          </li>
          <li>
            <button
              type="button"
              onClick={onWatch}
              {...entry(1)}
              className={ENTRY}
            >
              <Lozenge />
              <span className="text-hud-xl">{m.home.watch}</span>
            </button>
          </li>
          <li className="mt-6">
            <Link to="/blog" {...entry(2)} className={ENTRY}>
              <Lozenge />
              <Second>{m.home.journal}</Second>
            </Link>
          </li>
        </ul>
        <footer className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="hud-figure text-hud-s opacity-70">
            v{__APP_VERSION__}
            {__APP_VERSION__.startsWith('0.') ? ' alpha' : ''}
          </span>
          <Link to="/about" className={FOOT}>
            {m.common.about}
          </Link>
          <Link to="/legal" className={FOOT}>
            {m.common.legal}
          </Link>
          <a href={PORTFOLIO_URL} className={FOOT}>
            {m.common.author}
          </a>
        </footer>
      </Sheet>
    </nav>
  )
}

/** The links at the foot of the scroll: the rest of the site, discreet. */
const FOOT =
  'hud-note hud-press inline-flex min-h-11 items-center hover:text-quill'

/** A gold rule across the scroll, a lozenge at its middle, between the title and the menu. */
function Flourish() {
  return (
    <span aria-hidden="true" className="relative mt-3 h-px w-full bg-gilt">
      <span className="absolute top-1/2 left-1/2 size-2.5 -translate-1/2 rotate-45 border border-quill bg-gilt" />
    </span>
  )
}

/** An entry of the menu: in IM Fell, pushed a little aside and gilt when chosen. */
// norm-ok: focus moves the choice, and the chosen entry's gold lozenge, colour and shift are its visible focus.
const ENTRY =
  'group flex min-h-11 w-fit cursor-pointer items-center gap-3 font-fell text-quill outline-none transition-[color,translate] duration-(--duration-hud-press) ease-hud data-[chosen=true]:translate-x-2 data-[chosen=true]:text-gilt-deep motion-reduce:transition-none'

/** The lozenge before the entry chosen. */
function Lozenge() {
  return (
    <span
      aria-hidden="true"
      className="size-3 shrink-0 rotate-45 border-[1.5px] border-quill bg-gilt opacity-0 transition-opacity duration-(--duration-hud-press) ease-hud group-data-[chosen=true]:opacity-100"
    />
  )
}

/** A second entry, smaller, with a note beside it if need be. */
function Second({
  children,
  note,
}: Readonly<{ children: ReactNode; note?: string }>) {
  return (
    <span className="flex items-baseline gap-2">
      <span className="text-hud-l">{children}</span>
      {note && <span className="hud-note">{note}</span>}
    </span>
  )
}
