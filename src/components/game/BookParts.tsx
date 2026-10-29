import { Act } from '../hud/Act'
import { Shield } from '../hud/Emblem'
import { hex } from './format'
import type { Book } from '../../../engine'
import { Flourish } from '~/components/home/Ornaments'
import { PLAYERS } from '~/render/palette'
import { useMessages } from '~/i18n'

// The pieces of the book of the game (GameBook.tsx): a setting turned by
// its arrows, a page's head, the lords seated by team, and the book's
// button over the camera's.

/** The next value of a list, a step forward or back, kept at its ends. */
export function stepped<T>(list: ReadonlyArray<T>, value: T, by: 1 | -1): T {
  const at = Math.max(0, list.indexOf(value))
  return list[Math.max(0, Math.min(list.length - 1, at + by))]
}

/** One setting: its name, and its value between two arrows; read only for whoever may not change it. */
export function Setting({
  name,
  value,
  onStep,
}: Readonly<{
  name: string
  value: string
  onStep?: (by: 1 | -1) => void
}>) {
  const m = useMessages().book
  const arrow = (by: 1 | -1) =>
    onStep && (
      <button
        type="button"
        aria-label={`${name} : ${by < 0 ? m.less : m.more}`}
        onClick={() => onStep(by)}
        className="hud-press inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center font-words text-hud-l text-gilt-deep hover:text-quill"
      >
        {by < 0 ? '‹' : '›'}
      </button>
    )
  return (
    <div className="flex items-center justify-between gap-3 border-b border-dotted border-quill/45">
      <span className="hud-note text-hud-m">{name}</span>
      <span className="flex items-center">
        {arrow(-1)}
        <span className="hud-word min-w-28 text-center">{value}</span>
        {arrow(1)}
      </span>
    </div>
  )
}

/** A page's head: a line above, its title in capitals, a gold rule. */
export function Head({
  kicker,
  title,
}: Readonly<{ kicker: string; title: string }>) {
  return (
    <header className="flex flex-col items-center gap-0.5 text-center">
      <span className="hud-note">{kicker}</span>
      <h2 className="font-caps text-hud-xl text-quill">{title}</h2>
      <span className="w-3/5">
        <Flourish />
      </span>
    </header>
  )
}

/** The lords in play: me and the bots, by team, a shield each. */
export function Seats({ book }: Readonly<{ book: Book }>) {
  const m = useMessages().book
  const lords = Array.from({ length: book.bots + 1 }, (_, i) => i)
  const sides =
    book.teams >= 2
      ? Array.from({ length: book.teams }, (_, t) =>
          lords.filter((i) => i % book.teams === t),
        )
      : [lords]
  return (
    <div className="flex flex-col gap-2">
      {sides.map((side, t) => (
        <div key={t} className="flex items-start gap-2">
          {book.teams >= 2 && (
            <span className="hud-figure w-6 pt-1 text-gilt-deep">
              {['I', 'II', 'III', 'IV'][t]}
            </span>
          )}
          <div className="flex flex-wrap gap-1">
            {side.map((i) => (
              <span
                key={i}
                title={i === 0 ? m.you : m.bot}
                className={i === 0 ? '' : 'opacity-55'}
              >
                <Shield color={hex(PLAYERS[i].color)} size="s" />
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/** The book's button, over the camera's: opens the book of the game. */
export function BookButton({ onOpen }: Readonly<{ onOpen: () => void }>) {
  const m = useMessages().book
  return (
    <Act tone="plain" label={m.open} onClick={onOpen}>
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-6">
        <path
          d="M12 6.5 Q8 4 3 4.5 V18.5 Q8 18 12 20.5 Q16 18 21 18.5 V4.5 Q16 4 12 6.5 Z M12 6.5 V20.5"
          fill="var(--color-vellum)"
          stroke="var(--color-quill)"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M5.5 8 Q8 7.6 10 8.6 M5.5 11 Q8 10.6 10 11.6 M14 8.6 Q16 7.6 18.5 8 M14 11.6 Q16 10.6 18.5 11"
          fill="none"
          stroke="var(--color-gilt)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
    </Act>
  )
}

/** The way back to the home, over the book's: a little gatehouse (« ça manque d'un bouton home pour revenir à l'accueil »). */
export function HomeButton({ onHome }: Readonly<{ onHome: () => void }>) {
  const m = useMessages().book
  return (
    <Act tone="plain" label={m.home} onClick={onHome}>
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-6">
        <path
          d="M4 20 V9 L7 6 L10 9 V11 H14 V9 L17 6 L20 9 V20 Z"
          fill="var(--color-vellum)"
          stroke="var(--color-quill)"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M10 20 V16 Q12 13.5 14 16 V20"
          fill="var(--color-gilt)"
          stroke="var(--color-quill)"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    </Act>
  )
}
