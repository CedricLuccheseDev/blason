import { useState } from 'react'
import { Act } from '../hud/Act'
import { GAP, Stack } from '../hud/Layout'
import { Fine, Note, Title } from '../hud/Text'
import { Shield } from '../hud/Emblem'
import { Icon } from '../hud/Figure'
import type { IconName } from '../hud/Figure'
import { hex } from './format'
import type { ReactNode } from 'react'
import { LEVELS } from '../../../engine'
import type { Book } from '../../../engine'
import { Flourish } from '~/components/home/Ornaments'
import { PLAYERS } from '~/render/palette'
import { useMessages } from '~/i18n'

// The pieces of the book of the game (GameBook.tsx): a setting's line, a
// page's head, the lords seated by team, the link to invite friends, and
// the book's button over the camera's.

/** One setting: its name above, its control (Choices.tsx) the page's width under it. */
export function Setting({
  name,
  icon,
  children,
}: Readonly<{ name: string; icon: IconName; children: ReactNode }>) {
  return (
    <Stack gap="hair">
      <span className={`flex items-center ${GAP.hair}`}>
        <Icon name={icon} size={18} />
        <Note>{name}</Note>
      </span>
      {children}
    </Stack>
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

// norm-ok: a seat's small controls, a bot's level and the way to another team, form controls of the book.
const CHIP =
  'hud-press flex items-center rounded-sm border border-quill/30 px-1'

/** The numerals of the teams. */
const NUMERALS = ['I', 'II', 'III', 'IV']

/**
 * The lords in play (« fais plutot une grille avec les noms comme ça on voit
 * bien quand un joueur a rejoins », « range mieux les équipes, et il faut
 * pouvoir les bouger, et il faut choisir le niveau des bots par bot »): with
 * teams, a box for each, a lord dragged from one to another or sent on by
 * his arrow; without, a fixed grid of every seat, the free ones faded. Me,
 * the friends by their names, the bots marked as such, each its level a
 * click away. The host's to change; read only for a guest.
 */
export function Seats({
  book,
  names = [],
  onChange,
}: Readonly<{
  book: Book
  names?: Array<string>
  onChange?: (book: Book) => void
}>) {
  const m = useMessages()
  const guests = book.guests ?? 0
  const lords = 1 + guests + book.bots
  const teams = book.teams >= 2 ? book.teams : 0
  const teamOf = (i: number) => {
    const moved = book.teamOf?.[i]
    return moved !== undefined && moved < teams ? moved : i % teams
  }
  const move = (i: number, team: number) => {
    const teamOfAll = Array.from({ length: PLAYERS.length }, (_, k) =>
      k === i ? team : teamOf(k),
    )
    onChange?.({ ...book, teamOf: teamOfAll })
  }
  const level = (i: number) => {
    const now = book.levels?.[i] ?? book.level
    const next = LEVELS[(LEVELS.indexOf(now) + 1) % LEVELS.length]
    const levels = Array.from(
      { length: PLAYERS.length },
      (_, k) => book.levels?.[k] ?? book.level,
    )
    levels[i] = next
    onChange?.({ ...book, levels })
  }
  const botAt = (i: number) => guests < i && i < lords
  const seat = (i: number) => (
    <SeatLine
      key={i}
      i={i}
      book={book}
      who={whoOf(i, guests, names, m)}
      bot={botAt(i)}
      onLevel={onChange && (() => level(i))}
      onMove={
        onChange && teams ? () => move(i, (teamOf(i) + 1) % teams) : undefined
      }
    />
  )
  if (!teams)
    return (
      <ul className={`grid grid-cols-2 ${GAP.hair}`}>
        {PLAYERS.map((_, i) =>
          i < lords ? seat(i) : <FreeSeat key={i} i={i} />,
        )}
      </ul>
    )
  const seated = Array.from({ length: lords }, (_, i) => i)
  return (
    <Stack gap="part">
      <div className={`grid grid-cols-2 ${GAP.part}`}>
        {Array.from({ length: teams }, (_, t) => (
          <section
            key={t}
            onDragOver={(e) => onChange && e.preventDefault()}
            onDrop={(e) => {
              const i = Number(e.dataTransfer.getData('text/plain'))
              if (Number.isInteger(i)) move(i, t)
            }}
            className="border-t border-gilt/60"
          >
            <Stack gap="hair">
              <span className={`flex items-center text-gilt-deep ${GAP.hair}`}>
                <Icon name="banner" size={16} />
                <Fine>{m.book.team(NUMERALS[t])}</Fine>
              </span>
              <ul className={`flex flex-col ${GAP.hair}`}>
                {seated.filter((i) => teamOf(i) === t).map(seat)}
              </ul>
            </Stack>
          </section>
        ))}
      </div>
      <Fine className="text-center">
        {m.book.freeSeats(PLAYERS.length - lords)}
      </Fine>
    </Stack>
  )
}

/** Who sits a seat, by his name. */
function whoOf(
  i: number,
  guests: number,
  names: Array<string>,
  m: ReturnType<typeof useMessages>,
) {
  if (i === 0) return names[0] || m.book.you
  if (i <= guests) return names[i] || m.book.guest
  return m.game.colors[PLAYERS[i].key]
}

/** A lord's line: his shield, his name, a bot's level, and for the host the way to another team. */
function SeatLine({
  i,
  book,
  who,
  bot,
  onLevel,
  onMove,
}: Readonly<{
  i: number
  book: Book
  who: string
  bot: boolean
  onLevel?: () => void
  onMove?: () => void
}>) {
  const m = useMessages().book
  const level = book.levels?.[i] ?? book.level
  return (
    <li
      draggable={onMove !== undefined}
      onDragStart={(e) => e.dataTransfer.setData('text/plain', String(i))}
      className={`flex min-w-0 items-center ${GAP.hair} ${onMove ? 'cursor-grab' : ''}`}
    >
      <Shield color={hex(PLAYERS[i].color)} size="s" />
      {bot && (
        <span title={m.bot} className="text-lead-deep">
          <Icon name="bot" size={16} />
        </span>
      )}
      <Fine className="min-w-0 flex-1 truncate">{who}</Fine>
      {bot && (
        <button
          type="button"
          disabled={!onLevel}
          title={m.nextLevel}
          onClick={onLevel}
          className={`${CHIP} ${GAP.hair} ${onLevel ? 'cursor-pointer hover:bg-shade' : ''}`}
        >
          <Icon name="crown" size={14} />
          <Fine>{m.level1[level]}</Fine>
        </button>
      )}
      {onMove && (
        <button
          type="button"
          title={m.moveTeam}
          aria-label={m.moveTeam}
          onClick={onMove}
          className={`${CHIP} cursor-pointer border-transparent text-gilt-deep hover:bg-shade`}
        >
          <Icon name="banner" size={14} />
        </button>
      )}
    </li>
  )
}

/** A seat no one sits, faded: the grid keeps its place. */
function FreeSeat({ i }: Readonly<{ i: number }>) {
  const m = useMessages().book
  return (
    <li className={`flex min-w-0 items-center opacity-35 ${GAP.hair}`}>
      <Shield color={hex(PLAYERS[i].color)} size="s" />
      <Fine className="truncate">{m.free}</Fine>
    </li>
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

/** The room's link, to give friends: a click copies it, and whoever opens it sits in the game at once (« au lieu d'un code fais copier un lien c'est mieux »), a button of the book's foot with its letter (« le bouton inviter met le en bas avec une icon invitation »). */
export function Invite({ code }: Readonly<{ code: string }>) {
  const m = useMessages().book
  const [copied, setCopied] = useState(false)
  const copy = () => {
    const link = `${location.origin}/play?room=${code}`
    void navigator.clipboard
      .writeText(link)
      .then(() => setCopied(true))
      .catch(() => setCopied(false))
  }
  return (
    <Act tone={copied ? 'pact' : 'plain'} onClick={copy}>
      <Icon name="letter" size={18} />
      {copied ? m.linkCopied : m.invite}
    </Act>
  )
}
