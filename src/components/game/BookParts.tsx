import { useState } from 'react'
import { Act, Tap } from '../hud/Act'
import { Figure } from '../hud/Figure'
import { Inline, Line, Stack } from '../hud/Layout'
import { Call, Note, Title, Word } from '../hud/Text'
import { Shield } from '../hud/Emblem'
import { hex } from './format'
import type { ReactNode } from 'react'
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

/** A line of the book: its name, then its value (Line, the HUD's line of a list). */
const Row = ({
  name,
  children,
}: Readonly<{ name: string; children: ReactNode }>) => (
  <Line name={<Note>{name}</Note>}>{children}</Line>
)

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
      <Tap
        label={`${name} : ${by < 0 ? m.less : m.more}`}
        onClick={() => onStep(by)}
      >
        <Call className="text-current">{by < 0 ? '‹' : '›'}</Call>
      </Tap>
    )
  return (
    <Row name={name}>
      {arrow(-1)}
      <Word className="flex-1 text-center">{value}</Word>
      {arrow(1)}
    </Row>
  )
}

/** A page's head: a line above, its title in capitals, a gold rule. */
export function Head({
  kicker,
  title,
}: Readonly<{ kicker: string; title: string }>) {
  return (
    <header>
      <Stack gap="hair" align="center" className="text-center">
        <Note>{kicker}</Note>
        <h2>
          <Title>{title}</Title>
        </h2>
        <span className="w-3/5">
          <Flourish />
        </span>
      </Stack>
    </header>
  )
}

/** The lords in play: me and the bots, by team, a shield each. */
export function Seats({ book }: Readonly<{ book: Book }>) {
  const m = useMessages().book
  const guests = book.guests ?? 0
  const whoSits = (i: number) => {
    if (i === 0) return m.you
    return i <= guests ? m.guest : m.bot
  }
  const lords = Array.from(
    { length: Math.min(PLAYERS.length, 1 + guests + book.bots) },
    (_, i) => i,
  )
  const sides =
    book.teams >= 2
      ? Array.from({ length: book.teams }, (_, t) =>
          lords.filter((i) => i % book.teams === t),
        )
      : [lords]
  return (
    <Stack>
      {sides.map((side, t) => (
        <Inline key={t} justify="center">
          {book.teams >= 2 && (
            <span className="hud-figure w-6 text-gilt-deep">
              {['I', 'II', 'III', 'IV'][t]}
            </span>
          )}
          <Inline gap="hair" justify="center" wrap>
            {side.map((i) => (
              <span
                key={i}
                title={whoSits(i)}
                className={i <= guests ? '' : 'opacity-55'}
              >
                <Shield color={hex(PLAYERS[i].color)} size="s" />
              </span>
            ))}
          </Inline>
        </Inline>
      ))}
    </Stack>
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

/** The game's name top left, its mark in IM Fell on a sheet, the way back to the home (« met dans le header en haut à gauche, au moins le logo du jeu »). */
export function HomeMark({ onHome }: Readonly<{ onHome: () => void }>) {
  const m = useMessages().book
  // The HUD's one button, as the book's and the lords' beside it (« il faut
  // un seul type visuel »), its word the game's mark.
  return (
    <Act tone="plain" label={m.home} onClick={onHome}>
      {/* norm-ok: wordmark, not copy. Upright on a phone, its initial alone: the race needs the width, and the way home stays (« Y'a plus le bouton logo »). */}
      <span className="hud-word font-mark text-hud-xl leading-none text-quill">
        <span className="max-sm:hidden">Blason</span>
        <span className="sm:hidden">B</span>
      </span>
    </Act>
  )
}

/** The room's code, to give friends, and a click to copy it (« quand on host y'a pas de code »). */
export function Invite({ code }: Readonly<{ code: string }>) {
  const m = useMessages().book
  const [copied, setCopied] = useState(false)
  const copy = () => {
    void navigator.clipboard
      .writeText(code)
      .then(() => setCopied(true))
      .catch(() => setCopied(false))
  }
  return (
    <Row name={m.invite}>
      <span className="flex-1 text-center tracking-widest">
        <Figure size="l">{code}</Figure>
      </span>
      <Tap onClick={copy}>
        <Note className="text-current">{copied ? m.copied : m.copy}</Note>
      </Tap>
    </Row>
  )
}
