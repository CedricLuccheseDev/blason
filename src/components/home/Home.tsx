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
import { usePresses } from './usePresses'
import { atPrivate, atPublic, useRoom } from './useRoom'
import type { Entry } from './Journal'
import { Act } from '~/components/hud/Act'
import { GAP, Stack } from '~/components/hud/Layout'
import { useMessages } from '~/i18n'
import { relayUrl } from '~/render/link'
import { holdOnline } from '~/render/online'

// The home, as OpenFront's, on the game's page without its map: its frame
// and a faint compass rose. The name of the game; under it the public game
// being planted, its land the biggest thing there and Play on it, then two
// short buttons: create a game, straight into it, its book open (solo is a
// game created with no guest: « créer une partie doit envoyer directement
// dans le lobby »), and join one by its code, on a sheet; on their right the journal, its last posts to read. At the foot,
// quiet, the player on the left, the rest of the site in the middle; on a
// phone or a narrow screen, all of it stacked, the journal under the buttons.

type Open = 'join' | null

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
  usePresses()
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
    if (atPublic(room)) rooms.leave()
    setOpen(what)
  }
  const close = () => {
    if (atPrivate(room)) rooms.leave()
    setOpen(null)
  }
  const create = () => {
    if (atPublic(room)) rooms.leave()
    void navigate({ to: '/play', search: { host: true } })
  }

  return (
    <main className="hud relative flex min-h-dvh w-full flex-col bg-vellum select-none">
      <Frame />
      <Rose className="absolute top-8 right-8 size-28 opacity-25 max-sm:top-6 max-sm:right-6 max-sm:size-14" />
      {/* norm-ok: the home's page, its column and the journal's beside it, its room round them as drawn (the HUD's bricks lay what is inside). */}
      <div className="relative mx-auto grid w-full max-w-[46rem] flex-1 content-center gap-6 px-6 pt-10 pb-4 short:pt-6 lg:max-w-[66rem] lg:grid-cols-[minmax(0,46rem)_minmax(0,18rem)] lg:gap-x-4">
        <div className="lg:col-span-2">
          <Title />
        </div>
        <nav aria-label={t.menu} className="min-w-0">
          <Stack gap="part">
            <PublicCard room={room} rooms={rooms} online={online} />
            <div className={`grid sm:grid-cols-2 ${GAP.line}`}>
              <Act tone="plain" onClick={create}>
                {t.create}
              </Act>
              <Act tone="plain" asleep={!online} onClick={() => show('join')}>
                {t.joinPrivate}
              </Act>
            </div>
          </Stack>
        </nav>
        <Journal entries={entries} />
      </div>
      {/* norm-ok: the page's foot, the player on the left and the site in the middle, its room from the page's edge as drawn. */}
      <div className="relative flex flex-wrap items-center justify-between gap-x-6 px-8 pb-6 max-sm:px-6 lg:grid lg:grid-cols-[1fr_auto_1fr]">
        <Lord />
        <div className="max-sm:basis-full">
          <Foot />
        </div>
      </div>
      <Dialog
        open={open === 'join'}
        title={t.privateRoom.title}
        onClose={close}
      >
        {open === 'join' && (
          <PrivateRoom way={open} room={room} actions={rooms} />
        )}
      </Dialog>
    </main>
  )
}
