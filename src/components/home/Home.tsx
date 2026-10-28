import { useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Backdrop } from './Backdrop'
import { Dialog } from './Dialog'
import { Foot } from './Foot'
import { Journal } from './Journal'
import { Lord, Title } from './Masthead'
import { PrivateRoom } from './PrivateRoom'
import { PublicCard } from './PublicCard'
import { SoloSettings } from './SoloSettings'
import { useNow } from './useNow'
import { atPrivate, atPublic, useRoom } from './useRoom'
import { useSpectator } from './useSpectator'
import type { Entry } from './Journal'
import { Act } from '~/components/hud/Act'
import { useMessages } from '~/i18n'
import { relayUrl } from '~/render/link'
import { holdOnline } from '~/render/online'

// The home, as OpenFront's: one column on a quiet ground, the player at its
// head, the next public game first and biggest, then the solo game and the
// private rooms, each set on a sheet of its own; the journal beside it. The
// bots' game plays softly behind, and may be watched full screen. On a
// phone, one column, the public game first.

type Open = 'solo' | 'create' | 'join' | null

/** While the home is read, the next game's land is made: a game started lands straight in its opening. */
function useGameAhead() {
  useEffect(() => {
    const ready = () =>
      void import('~/render/client').then(({ prepareGame }) => prepareGame())
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(ready, { timeout: 2500 })
      return () => cancelIdleCallback(id)
    }
    const id = setTimeout(ready, 1000)
    return () => clearTimeout(id)
  }, [])
}

export function Home({ entries }: Readonly<{ entries: Array<Entry> }>) {
  const t = useMessages().home
  const navigate = useNavigate()
  const [open, setOpen] = useState<Open>(null)
  const [watching, setWatching] = useState(false)
  const [online, setOnline] = useState(false)
  const spectator = useSpectator()
  const [room, rooms] = useRoom((game) => {
    holdOnline(game)
    void navigate({ to: '/play', search: { online: true } })
  })
  const now = useNow(room.status === 'seated')
  useGameAhead()
  // Back home, the last game online is let go of; online is offered where a relay is.
  useEffect(() => {
    holdOnline(null)
    setOnline(relayUrl() !== null)
  }, [])

  const show = (what: Open) => {
    // A private room is a room of its own: the public seat is given up.
    if ((what === 'create' || what === 'join') && atPublic(room)) rooms.leave()
    setOpen(what)
  }
  const close = () => {
    if (open !== 'solo' && atPrivate(room)) rooms.leave()
    setOpen(null)
  }

  // Escape leaves the game watched (a sheet open closes itself).
  const escape = useRef(() => {})
  escape.current = () => setWatching(false)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') escape.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const hidden = watching ? 'invisible opacity-0' : 'visible opacity-100'
  return (
    <main className="hud relative min-h-dvh w-full bg-vellum select-none">
      <Backdrop host={spectator.host} clear={watching} />
      <div
        className={`relative mx-auto grid max-w-[64rem] gap-6 px-4 py-6 transition-[opacity,visibility] duration-(--duration-hud-enter) ease-hud motion-reduce:transition-none lg:grid-cols-[minmax(0,30rem)_18rem] lg:justify-center lg:pt-12 ${hidden}`}
      >
        <nav aria-label={t.menu} className="flex flex-col gap-4">
          <Title />
          <div className="max-sm:order-1">
            <Lord />
          </div>
          <PublicCard room={room} rooms={rooms} online={online} now={now} />
          <div className="grid gap-2">
            <Act tone="plain" onClick={() => show('solo')}>
              <span className="text-hud-l">{t.solo.open}</span>
              <span className="hud-note">{t.solo.line}</span>
            </Act>
            <Act tone="plain" asleep={!online} onClick={() => show('create')}>
              {t.create}
            </Act>
            <Act tone="plain" asleep={!online} onClick={() => show('join')}>
              {t.joinPrivate}
            </Act>
          </div>
        </nav>
        <aside className="flex flex-col gap-4 lg:pt-24">
          <Journal entries={entries} />
          {spectator.shown && (
            <div className="grid">
              <Act tone="plain" onClick={() => setWatching(true)}>
                {t.watch}
              </Act>
            </div>
          )}
        </aside>
        <div className="lg:col-span-2">
          <Foot />
        </div>
      </div>
      {watching && (
        <div className="fixed top-4 left-4">
          <Act tone="plain" onClick={() => setWatching(false)}>
            {t.back}
          </Act>
        </div>
      )}
      <Dialog open={open === 'solo'} title={t.solo.title} onClose={close}>
        <SoloSettings />
      </Dialog>
      <Dialog
        open={open === 'create' || open === 'join'}
        title={t.privateRoom.title}
        onClose={close}
      >
        {(open === 'create' || open === 'join') && (
          <PrivateRoom way={open} room={room} actions={rooms} />
        )}
      </Dialog>
    </main>
  )
}
