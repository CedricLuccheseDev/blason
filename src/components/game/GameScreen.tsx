import { useEffect, useRef, useState } from 'react'
import { Act } from '../hud/Act'
import { Sheet } from '../hud/Sheet'
import { Defs } from './svg/kit'
import { Race } from './Race'
import { Cursor } from './Cursor'
import { Aimed } from './Aimed'
import { Lords } from './Lords'
import { CameraButtons } from './CameraButtons'
import { Heralds } from './Heralds'
import { Bar } from './Bar'
import { Moment } from './Moment'
import { Banner } from './Banner'
import type { Aim, GameHandle, News, Summary } from '~/render/client'
import type { Level, MapSize } from '../../../engine'
import type { Online } from '~/render/online'
import { PLAYERS } from '~/render/palette'
import { useMessages } from '~/i18n'

const seedOf = () => new URLSearchParams(window.location.search).get('seed')

/**
 * The game, the land taken bit by bit: the map in the whole window, and
 * over it a HUD kept to the edges, every piece a sheet of the design system
 * (components/hud) set in a grid kept 16 pixels from them: top left the
 * lords; top centre the race, thin, and under it the opening and the end,
 * and a betrayal cried to all; the top right left to the map. On the map,
 * the seals of the alliances at the middle of their ribbons, the heralds'
 * letters of the offers and the news where it happened (Heralds.tsx);
 * bottom left the lord aimed at, while one is; at the bottom the bar, the
 * purse in it; bottom right the camera; the cartouche beside the pointer.
 */
/** How long a betrayal is cried under the race. */
const CRY_MS = 3000

type Cry = { id: number; felon: number; victim: number }

export function GameScreen({
  me,
  level,
  online,
  size = 'standard',
}: Readonly<{
  me: number
  level: Level
  online?: Online
  size?: MapSize
}>) {
  const m = useMessages()
  const host = useRef<HTMLDivElement>(null)
  const [game, setGame] = useState<GameHandle | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [aim, setAim] = useState<Aim | null>(null)
  // The game could not start (no WebGL, a failed load): said, not a blank page.
  const [failed, setFailed] = useState(false)
  // The last betrayal, cried under the race for a few seconds; the rest of
  // the news is laid on the map where it happened (Heralds.tsx).
  const [cry, setCry] = useState<Cry | null>(null)
  const cried = useRef(0)
  const tell = (news: Array<News>) => {
    // Of two at once, mine is the one cried.
    const betrayals = news.flatMap((n) => (n.kind === 'betrayed' ? [n] : []))
    const betrayal =
      betrayals.find((n) => n.victim === me || n.lord === me) ??
      betrayals.at(-1)
    if (!betrayal) return
    const id = ++cried.current
    setCry({ id, felon: betrayal.lord, victim: betrayal.victim })
    setTimeout(() => setCry((now) => (now?.id === id ? null : now)), CRY_MS)
  }

  useEffect(() => {
    const element = host.current
    if (!element) return
    let handle: GameHandle | undefined
    let cancelled = false
    // Read through a call: the game may be called off while any await runs.
    const off = () => cancelled
    import('~/render/client')
      .then(async ({ faces, mountGame }) => {
        // A game called off while its faces load is never made.
        await faces()
        if (off()) return
        const mounted = await mountGame(element, seedOf(), me, {
          onSummary: setSummary,
          onAim: setAim,
          onNews: tell,
          names: PLAYERS.map((p) => m.game.colors[p.key]),
          level,
          online,
          size,
        })
        if (off()) mounted.destroy()
        else {
          handle = mounted
          setGame(mounted)
        }
      })
      .catch(() => setFailed(true))
    return () => {
      cancelled = true
      handle?.destroy()
    }
  }, [me, level, online, size])

  // touch-none: the fingers belong to the game, which pinches its own map
  // sharp; the browser zooming the page would only blur it.
  return (
    <main className="hud relative h-dvh w-full touch-none overflow-hidden bg-vellum select-none">
      <div
        ref={host}
        className="absolute inset-0"
        role="img"
        aria-label={m.game.map}
      />
      <Defs />
      {failed && <Failed />}
      {game && summary && (
        <>
          <Heralds game={game} summary={summary} />
          <div className="pointer-events-none absolute inset-0 grid grid-cols-[1fr_auto_1fr] grid-rows-[auto_1fr_auto] gap-4 p-4 max-sm:grid-cols-[auto_1fr] max-sm:grid-rows-[auto_1fr_auto] max-sm:gap-2 max-sm:p-2 short:gap-2 short:p-2">
            <div className="relative flex w-72 min-w-0 flex-col items-start gap-2 max-sm:w-auto short:w-56">
              <Lords summary={summary} aimed={aim?.lord ?? null} />
            </div>
            <div className="flex flex-col items-center gap-2">
              <Race summary={summary} />
              <Moment summary={summary} online={online !== undefined} />
              {cry && (
                <Banner key={cry.id} felon={cry.felon} victim={cry.victim} />
              )}
            </div>
            <div className="max-sm:hidden" />
            <div className="relative col-span-3 row-start-3 grid grid-cols-[1fr_auto_1fr] items-end gap-4 max-sm:col-span-2 max-sm:row-start-3 max-sm:grid-cols-1 max-sm:gap-2">
              {/* Above the bar's row, at its left, taking none of its room: the
                  bar has the width of the screen less the camera on either side. */}
              <div className="absolute bottom-full left-0 mb-4 flex w-72 flex-col gap-2 max-sm:mb-2 max-sm:w-[calc(100%-3.5rem)] short:mb-2 short:w-60">
                <Aimed aim={aim} summary={summary} />
              </div>
              <div className="col-start-2 flex justify-center max-sm:col-start-1">
                <Bar
                  summary={summary}
                  onArmy={game.choose}
                  onWork={game.hold}
                  onCoup={game.aim}
                />
              </div>
              <div className="pointer-events-auto justify-self-end max-sm:absolute max-sm:right-0 max-sm:bottom-full max-sm:mb-2">
                <CameraButtons game={game} summary={summary} />
              </div>
            </div>
          </div>
          <Cursor summary={summary} aim={aim} onTreat={game.treat} />
        </>
      )}
    </main>
  )
}

/** When the game cannot start: what happened, and the way to try again. */
function Failed() {
  const m = useMessages()
  return (
    <div className="absolute inset-0 grid place-items-center p-4">
      <Sheet className="flex flex-col items-center gap-3 px-6 py-4">
        <span className="hud-word text-hud-l">{m.errors.title}</span>
        <span className="hud-note">{m.errors.tryReload}</span>
        <Act onClick={() => window.location.reload()}>{m.errors.reload}</Act>
      </Sheet>
    </div>
  )
}
