import { Link } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { Flourish, Lozenge, Second } from './Ornaments'
import { useLevel } from './useLevel'
import type { KeyboardEvent } from 'react'
import { Shield } from '~/components/hud/Emblem'
import { Sheet } from '~/components/hud/Sheet'
import { useMessages } from '~/i18n'

// The home where no table can be set (no WebGL): the menu alone, on a scroll
// of parchment rolled at both ends, the shield and the name, then Play, the
// rivals' level (left and right turn it), the journal; the version and the
// rest of the site at its foot. Walked with the arrows and Enter.

const PORTFOLIO_URL = 'https://clhub.fr'

export function PlainMenu() {
  const m = useMessages()
  const [chosen, setChosen] = useState(0)
  const [level, turn] = useLevel()
  const list = useRef<HTMLUListElement>(null)
  const items = () =>
    Array.from(
      list.current?.querySelectorAll<HTMLElement>('[data-entry]') ?? [],
    )

  // As in a game, the first entry is in hand from the start.
  useEffect(() => items()[0]?.focus({ preventScroll: true }), [])

  function onKey(e: KeyboardEvent) {
    // On the rivals' entry, left and right change their level.
    const side = { ArrowRight: 1, ArrowLeft: -1 }[e.key] as 1 | -1 | undefined
    if (side && chosen === 1) {
      e.preventDefault()
      turn(side)
      return
    }
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
    <main className="grid h-dvh w-full place-items-center bg-vellum p-4 select-none">
      <nav
        aria-label={m.home.menu}
        onKeyDown={onKey}
        className="w-full max-w-[340px]"
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
            <h1 className="font-caps text-6xl leading-none text-quill">
              Blason
            </h1>
            <p className="hud-note text-hud-m short:hidden">{m.home.tagline}</p>
            <Flourish />
          </header>
          <ul ref={list} className="flex flex-col gap-2">
            <li>
              <Link
                to="/play"
                search={{ level }}
                {...entry(0)}
                className={ENTRY}
              >
                <Lozenge />
                <span className="text-hud-xl">{m.home.play}</span>
              </Link>
            </li>
            <li>
              <button
                type="button"
                onClick={() => turn(1, true)}
                {...entry(1)}
                className={ENTRY}
              >
                <Lozenge />
                <Second note={chosen === 1 ? m.home.levelHint : undefined}>
                  {m.home.rivals} : {m.home.levels[level]}
                </Second>
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
    </main>
  )
}

/** The links at the foot of the scroll: the rest of the site, discreet. */
const FOOT =
  'hud-note hud-press inline-flex min-h-11 items-center hover:text-quill'

/** An entry of the menu: in IM Fell, pushed a little aside and gilt when chosen. */
// norm-ok: focus moves the choice, and the chosen entry's gold lozenge, colour and shift are its visible focus.
const ENTRY =
  'group flex min-h-11 w-fit cursor-pointer items-center gap-3 font-fell text-quill outline-none transition-[color,translate] duration-(--duration-hud-press) ease-hud data-[chosen=true]:translate-x-2 data-[chosen=true]:text-gilt-deep motion-reduce:transition-none'
