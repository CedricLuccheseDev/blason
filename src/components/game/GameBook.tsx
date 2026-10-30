import { Act, Tap } from '../hud/Act'
import { Inline, Panel, Ruled, Spread, Stack, Veil } from '../hud/Layout'
import { Note } from '../hud/Text'
import { Head } from './BookParts'
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
}>) {
  const m = useMessages().book
  const set = (part: Partial<Book>) => onChange({ ...book, ...part })
  const lobby = running === null
  const hosts: ReactNode = lobby ? (
    <>
      <Act tone="plain" onClick={onClose}>
        {m.see}
      </Act>
      <Act call onClick={onLaunch}>
        {m.launch}
      </Act>
    </>
  ) : (
    <>
      <Act tone="plain" onClick={onQuit}>
        {m.quit}
      </Act>
      <Act call onClick={onRestart}>
        {m.restart}
      </Act>
    </>
  )
  const foot: ReactNode = guest ? (
    <Stack gap="part" align="center">
      <Note>{guest.status}</Note>
      <Inline gap="piece" justify="center">
        <Act tone="plain" onClick={onQuit}>
          {m.quit}
        </Act>
        <Act tone="plain" onClick={onClose}>
          {m.see}
        </Act>
      </Inline>
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
              code={code}
              lobby={lobby}
              guest={guest !== undefined}
              onChange={onChange}
            />
          }
        />
        <Ruled>{foot}</Ruled>
      </Panel>
    </Veil>
  )
}
