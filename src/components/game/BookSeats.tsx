import { GAP, Stack } from '../hud/Layout'
import { Fine, Name } from '../hud/Text'
import { Icon } from '../hud/Figure'
import { Shield } from '../hud/Emblem'
import { LEVELS } from '../../../engine'
import { hex } from './format'
import type { Book, Level } from '../../../engine'
import { PLAYERS } from '~/render/palette'
import { useMessages } from '~/i18n'

// The lords seated in the book of the game (BookSettings.tsx): the persons
// by their names, then the lords by team, a shield each.

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
