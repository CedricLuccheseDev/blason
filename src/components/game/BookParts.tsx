import { useState } from 'react'
import { Act } from '../hud/Act'
import { GAP, Stack } from '../hud/Layout'
import { Fine, Name, Note, Title } from '../hud/Text'
import { Shield } from '../hud/Emblem'
import { Icon } from '../hud/Figure'
import type { IconName } from '../hud/Figure'
import { hex } from './format'
import type { ReactNode } from 'react'
import { LEVELS } from '../../../engine'
import type { Book, Level } from '../../../engine'
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

/** A page's head: a line above, its title in capitals beside its icon, a gold rule. */
export function Head({
  kicker,
  title,
  icon,
}: Readonly<{ kicker: string; title: string; icon?: IconName }>) {
  return (
    <header>
      <Stack gap="hair" align="center" className="text-center">
        <Note>{kicker}</Note>
        <h2 className={`flex items-center ${GAP.hair}`}>
          {icon && <Icon name={icon} size={26} />}
          <Title>{title}</Title>
        </h2>
        <span className="w-3/5">
          <Flourish />
        </span>
      </Stack>
    </header>
  )
}

/** The numerals of the teams. */
const NUMERALS = ['I', 'II', 'III', 'IV']

/**
 * The lords in play, simply (« c'est trop le bordel les seigneurs … cherche
 * un systeme simplifié et fais un beau layout »): the persons by their names
 * on a line, me first, a friend as he comes; then the lords by team, a shield
 * each, a bot's level in its dots under it, a click on it the next level, a
 * shield dragged to another team (« il faut pouvoir les bouger »). Without
 * teams, one band of shields. The host's to change; read only for a guest.
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
  const teams = book.teams >= 2 ? book.teams : 1
  const teamOf = (i: number) => {
    const moved = book.teamOf?.[i]
    return moved !== undefined && moved < teams ? moved : i % teams
  }
  const all = Array.from({ length: PLAYERS.length }, (_, k) => k)
  const move = (i: number, team: number) =>
    onChange?.({
      ...book,
      teamOf: all.map((k) => (k === i ? team : teamOf(k))),
    })
  const level = (i: number) => {
    const levels = all.map((k) => book.levels?.[k] ?? book.level)
    levels[i] = LEVELS[(LEVELS.indexOf(levels[i]) + 1) % LEVELS.length]
    onChange?.({ ...book, levels })
  }
  const seated = all.slice(0, lords)
  const persons = seated.slice(0, 1 + guests)
  return (
    <Stack gap="part">
      <ul className={`flex flex-wrap items-center ${GAP.line}`}>
        {persons.map((i) => (
          <li key={i} className={`flex items-center ${GAP.hair}`}>
            <Shield color={hex(PLAYERS[i].color)} size="s" />
            <Name>
              {i === 0 ? names[0] || m.book.you : names[i] || m.book.guest}
            </Name>
          </li>
        ))}
        <li className={`flex items-center text-lead-deep ${GAP.hair}`}>
          <Icon name="bot" size={18} />
          <Fine>{m.book.botsCount(book.bots)}</Fine>
        </li>
      </ul>
      <div
        className={`grid ${teams > 1 ? 'grid-cols-2' : 'grid-cols-1'} ${GAP.part}`}
      >
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
              {teams > 1 && (
                <span
                  className={`flex items-center text-gilt-deep ${GAP.hair}`}
                >
                  <Icon name="banner" size={16} />
                  <Fine>{m.book.team(NUMERALS[t])}</Fine>
                </span>
              )}
              <ul className={`flex flex-wrap ${GAP.hair}`}>
                {seated
                  .filter((i) => teamOf(i) === t)
                  .map((i) => (
                    <SeatShield
                      key={i}
                      i={i}
                      bot={i > guests}
                      level={book.levels?.[i] ?? book.level}
                      onLevel={onChange && (() => level(i))}
                      moving={onChange !== undefined && teams > 1}
                    />
                  ))}
              </ul>
            </Stack>
          </section>
        ))}
      </div>
    </Stack>
  )
}

/** A lord's shield in the book: a bot's level in dots under it, a click the next; dragged, another team. */
function SeatShield({
  i,
  bot,
  level,
  onLevel,
  moving,
}: Readonly<{
  i: number
  bot: boolean
  level: Level
  onLevel?: () => void
  moving: boolean
}>) {
  const m = useMessages()
  const name = m.game.colors[PLAYERS[i].key]
  const said = bot ? `${name}, ${m.book.level1[level]}` : name
  return (
    <li
      draggable={moving}
      onDragStart={(e) => e.dataTransfer.setData('text/plain', String(i))}
      className={moving ? 'cursor-grab' : ''}
    >
      <button
        type="button"
        title={bot && onLevel ? `${said} · ${m.book.nextLevel}` : said}
        aria-label={said}
        disabled={!bot || !onLevel}
        onClick={onLevel}
        className="hud-press flex cursor-pointer flex-col items-center disabled:cursor-default"
      >
        <Shield color={hex(PLAYERS[i].color)} size="s" />
        <span aria-hidden="true" className="flex h-2 items-center gap-px">
          {bot &&
            LEVELS.slice(0, LEVELS.indexOf(level) + 1).map((l) => (
              <span key={l} className="size-1 rounded-full bg-quill" /> // norm-ok: a level dot, round as a die pip.
            ))}
        </span>
      </button>
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
