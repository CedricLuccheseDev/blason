import { useState } from 'react'
import { Act } from '../hud/Act'
import { GAP, Stack } from '../hud/Layout'
import { Note, Title } from '../hud/Text'
import { Icon } from '../hud/Figure'
import type { IconName } from '../hud/Figure'
import { Flourish } from '~/components/home/Ornaments'
import { useMessages } from '~/i18n'

// The pieces of the book of the game (GameBook.tsx): a page's head (the
// lords seated are BookSeats.tsx's), the link to invite friends, and
// the book's button over the camera's.

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
