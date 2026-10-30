import { Act, Tap } from '../hud/Act'
import { Icon } from '../hud/Figure'
import { Panel, Ruled, Spread, Stack, Veil } from '../hud/Layout'
import { Note } from '../hud/Text'
import { Head, Invite } from './BookParts'
import { BookSettings } from './BookSettings'
import { MapList } from './MapList'
import type { ReactNode } from 'react'
import type { Book } from '../../../engine'
import { useMessages } from '~/i18n'

// The book of the game (Concept, 29/10: « dans les 2 cas on est en game »,
// then « créer une partie doit envoyer directement dans le lobby »): one
// object, open on two pages over the game, a veil over the rest. Before the
// launch it is the host's lobby, open of itself: the land, its size or
// another one; the lords, his bots, their level, the teams, the planting;
// « Lancer la partie ». The land is one of a list of cards (MapList.tsx),
// each its own size (« Fais pas de mode carte moyenne grosse tout ça, chaque
// carte a sa propre taille »), the smallest first, its size and the lords it
// suits said under it, and whether it suits this game. After it, his menu: the same settings for the next
// land, « Recommencer », « Quitter ». The book's button (BookButton) opens
// it again.

export function GameBook({
  book,
  code,
  running,
  onChange,
  onAnother,
  onLaunch,
  onClose,
  onRestart,
  onQuit,
  guest,
  names,
}: Readonly<{
  book: Book
  /** The room's code to give friends; none without a relay. */
  code: string | null
  /** The game's minutes, once launched; the lobby before. */
  running: number | null
  onChange: (book: Book) => void
  onAnother: () => void
  onLaunch: () => void
  onClose: () => void
  onRestart: () => void
  onQuit: () => void
  /** A guest's book, to read: what his room says (waiting for the host, or why it failed), no setting his to change. */
  guest?: { status: string }
  /** The persons seated, the host first. */
  names?: Array<string>
}>) {
  const m = useMessages().book
  const set = (part: Partial<Book>) => onChange({ ...book, ...part })
  const lobby = running === null
  // The foot (« met pas voir la carte, mais quitter, et retour si on est en
  // jeu »), each its icon: before the game, the invitation, the way out and
  // the launch; in it, the way out, back to the game, and another.
  const quit = (
    <Act tone="plain" onClick={onQuit}>
      <Icon name="door" size={18} />
      {m.quit}
    </Act>
  )
  const hosts: ReactNode = lobby ? (
    <>
      {code && <Invite code={code} />}
      {quit}
      <Act call onClick={onLaunch}>
        <Icon name="horn" size={20} />
        {m.launch}
      </Act>
    </>
  ) : (
    <>
      {quit}
      <Act tone="plain" onClick={onClose}>
        <Icon name="back" size={18} />
        {m.back}
      </Act>
      <Act call onClick={onRestart}>
        <Icon name="again" size={20} />
        {m.restart}
      </Act>
    </>
  )
  const foot: ReactNode = guest ? (
    <Stack gap="part" align="center">
      <Note>{guest.status}</Note>
      {quit}
    </Stack>
  ) : (
    hosts
  )
  const kicker = lobby ? m.yours : m.going(running)
  return (
    <Veil onClose={onClose}>
      <Panel
        page
        gap="piece"
        className="relative h-[min(100%,calc(720px*var(--hud)))] w-full max-w-[calc(860px*var(--hud))]"
      >
        {!lobby && !guest && (
          <span className="absolute top-2 right-3">
            <Tap onClick={onClose}>
              <Note className="text-current">{m.close}</Note>
            </Tap>
          </span>
        )}
        <Spread
          fill
          left={
            <>
              <Head kicker={guest ? m.hostGame : kicker} title={m.land} />
              <MapList
                book={book}
                onPick={guest ? undefined : (land) => set({ land })}
                onAnother={guest ? undefined : onAnother}
              />
            </>
          }
          right={
            <BookSettings
              book={book}
              lobby={lobby}
              guest={guest !== undefined}
              names={names}
              onChange={onChange}
            />
          }
        />
        <Ruled>{foot}</Ruled>
      </Panel>
    </Veil>
  )
}
