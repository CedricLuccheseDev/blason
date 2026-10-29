import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Dialog } from './Dialog'
import { Foot } from './Foot'
import { whenIdle } from './idle'
import { Journal } from './Journal'
import { Lord, Title } from './Masthead'
import { Frame, Rose } from './Ornaments'
import { PrivateRoom } from './PrivateRoom'
import { PublicCard } from './PublicCard'
import { SoloSettings } from './SoloSettings'
import { atPrivate, atPublic, useRoom } from './useRoom'
import type { Entry } from './Journal'
import { Act } from '~/components/hud/Act'
import { useMessages } from '~/i18n'
import { relayUrl } from '~/render/link'
import { holdOnline } from '~/render/online'

// The home, as OpenFront's, on the game's page without its map: its frame
// and a faint compass rose. One calm column: the name of the game and its
// line; the public game being planted, its land the biggest thing there, and
// Play across it; then three short buttons, the solo game and the private
// rooms, each set on a sheet of its own. At the foot, quiet, the player on
// the left, the journal's last line on the right, the rest of the site
// between; on a phone, all of it stacked.

type Open = 'solo' | 'create' | 'join' | null

/** While the home is read, the next solo game's land is made: a game started lands straight in its opening. */
function useGameAhead() {
  useEffect(() => {
    const prepare = () =>
      void import('~/render/client').then(({ prepareGame }) => prepareGame())
    return whenIdle(prepare, 2500)
  }, [])
}

export function Home({ entries }: Readonly<{ entries: Array<Entry> }>) {
  const t = useMessages().home
  const navigate = useNavigate()
  const [open, setOpen] = useState<Open>(null)
  // Online is offered where a relay is: its address is built into the page
  // as into the server, so the page drawn there already says it.
  const online = relayUrl() !== null
  const [room, rooms] = useRoom((game) => {
    holdOnline(game)
    void navigate({ to: '/play', search: { online: true } })
  })
  useGameAhead()
  // Back home, the last game online is let go of.
  useEffect(() => holdOnline(null), [])

  const show = (what: Open) => {
    // A private room is a room of its own: the public game is not entered.
    if ((what === 'create' || what === 'join') && atPublic(room)) rooms.leave()
    setOpen(what)
  }
  const close = () => {
    if (open !== 'solo' && atPrivate(room)) rooms.leave()
    setOpen(null)
  }

  return (
    <main className="hud relative flex min-h-dvh w-full flex-col bg-vellum select-none">
      <Frame />
      <Rose className="absolute top-8 right-8 size-28 opacity-25 max-sm:top-6 max-sm:right-6 max-sm:size-14" />
      <div className="relative mx-auto flex w-full max-w-[46rem] flex-1 flex-col justify-center gap-6 px-6 pt-10 pb-4 short:pt-6">
        <Title />
        <nav aria-label={t.menu} className="flex flex-col gap-3">
          <PublicCard room={room} rooms={rooms} online={online} />
          <div className="grid gap-2 sm:grid-cols-3">
            <Act tone="plain" onClick={() => show('solo')}>
              {t.solo.open}
            </Act>
            <Act tone="plain" asleep={!online} onClick={() => show('create')}>
              {t.create}
            </Act>
            <Act tone="plain" asleep={!online} onClick={() => show('join')}>
              {t.joinPrivate}
            </Act>
          </div>
        </nav>
      </div>
      <div className="relative flex flex-wrap items-center justify-between gap-x-6 px-8 pb-6 lg:grid lg:grid-cols-[1fr_auto_1fr] max-sm:px-6">
        <Lord />
        <div className="flex min-w-0 justify-end max-sm:basis-full max-sm:justify-start lg:order-3">
          <Journal entries={entries} />
        </div>
        <div className="max-lg:basis-full lg:order-2">
          <Foot />
        </div>
      </div>
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
