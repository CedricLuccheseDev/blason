import { useState } from 'react'
import { Act } from '../hud/Act'
import { GAP, Stack } from '../hud/Layout'
import { Fine, Note, Title } from '../hud/Text'
import { Shield } from '../hud/Emblem'
import { Icon } from '../hud/Figure'
import type { IconName } from '../hud/Figure'
import { hex } from './format'
import type { ReactNode } from 'react'
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

/** The lords in play, a fixed grid of every seat (« fais plutot une grille avec les noms comme ça on voit bien quand un joueur a rejoins »): me, the friends come by their names, the bots marked as such, the seats left free faded; its team's numeral on each when there are teams. Its height never moves with them. */
export function Seats({
  book,
  names = [],
}: Readonly<{ book: Book; names?: Array<string> }>) {
  const m = useMessages()
  const guests = book.guests ?? 0
  const lords = 1 + guests + book.bots
  return (
    <ul className={`grid grid-cols-3 ${GAP.hair}`}>
      {PLAYERS.map((player, i) => {
        const free = i >= lords
        const bot = !free && i > guests
        let who = m.book.free
        if (i === 0) who = names[0] || m.book.you
        else if (i <= guests) who = names[i] || m.book.guest
        else if (bot) who = m.game.colors[player.key]
        return (
          <li
            key={player.key}
            className={`flex min-w-0 items-center ${GAP.hair} ${free ? 'opacity-35' : ''}`}
          >
            <Shield color={hex(player.color)} size="s" />
            {bot && (
              <span title={m.book.bot} className="text-lead-deep">
                <Icon name="bot" size={16} />
              </span>
            )}
            <Fine className="truncate">{who}</Fine>
            {book.teams >= 2 && !free && (
              <Fine className="ml-auto text-gilt-deep">
                {['I', 'II', 'III', 'IV'][i % book.teams]}
              </Fine>
            )}
          </li>
        )
      })}
    </ul>
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
