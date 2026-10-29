import { useEffect, useRef, useState } from 'react'
import { Act } from '../hud/Act'
import { Sheet } from '../hud/Sheet'
import { Defs } from './svg/kit'
import { Race } from './Race'
import { Cursor } from './Cursor'
import { LordMenu } from './LordMenu'
import { Lords } from './Lords'
import { CameraButtons } from './CameraButtons'
import { Heralds } from './Heralds'
import { Bar } from './Bar'
import { Moment } from './Moment'
import { Banner } from './Banner'
import type { Aim, GameHandle, News, Summary } from '~/render/client'
import type { Level, MapSize } from '../../../engine'
import type { Online } from '~/render/online'
import type { Save } from '~/render/save'
import { PLAYERS } from '~/render/palette'
import { useMessages } from '~/i18n'

const seedOf = () => new URLSearchParams(window.location.search).get('seed')

/**
 * The game, the land taken bit by bit: the map in the whole window, and
 * over it a HUD kept to the edges, every piece a sheet of the design system
 * (components/hud) set in a grid kept 16 pixels from them: top left the
 * lords; top centre the race, thin, and under it the opening and the end,
 * and a betrayal cried to all; the top right left to the map. On the map,
 * the seal of an alliance asking to be renewed beside the ally's name, the
 * heralds' letters of the offers and the news where it happened (Heralds.tsx);
 * at the bottom the bar, the purse in it; bottom right the camera; the
 * cartouche beside the pointer, or, on another lord's land right clicked,
 * his menu there.
 */
/** How long a betrayal is cried under the race. */
const CRY_MS = 3000

type Cry = { id: number; felon: number; victim: number }

export function GameScreen({
  me,
  level,
  online,
  save,
  size = 'standard',
}: Readonly<{
  me: number
  level: Level
  online?: Online
  /** A saved game, held still at its tick (render/save.ts). */
  save?: Save
  size?: MapSize
}>) {
  const m = useMessages()
  const host = useRef<HTMLDivElement>(null)
  // The bottom row, the bar and the camera: the cartouche keeps above it.
  const floor = useRef<HTMLDivElement>(null)
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
          save,
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
  }, [me, level, online, save, size])

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
          <div className="pointer-events-none absolute inset-0 grid grid-cols-[1fr_minmax(0,auto)_1fr] grid-rows-[auto_1fr_auto] gap-4 p-4 max-sm:grid-cols-[auto_minmax(0,1fr)] max-sm:grid-rows-[auto_1fr_auto] max-sm:gap-2 max-sm:p-2 short:gap-2 short:p-2">
            <div className="relative flex w-80 min-w-0 flex-col items-start gap-2 max-sm:w-auto short:w-56">
              <Lords summary={summary} aimed={aim?.lord ?? null} />
            </div>
            <div className="flex min-w-0 flex-col items-center gap-2">
              <Race summary={summary} />
              <Moment summary={summary} online={online !== undefined} />
              {cry && (
                <Banner key={cry.id} felon={cry.felon} victim={cry.victim} />
              )}
            </div>
            <div className="max-sm:hidden" />
            <div
              ref={floor}
              className="relative col-span-3 row-start-3 grid grid-cols-[1fr_minmax(0,auto)_1fr] items-end gap-4 max-sm:col-span-2 max-sm:row-start-3 max-sm:grid-cols-1 max-sm:gap-2"
            >
              <div className="col-start-2 min-w-0 max-sm:col-start-1">
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
          {aim?.pinned ? (
            <LordMenu
              key={`${aim.x},${aim.y}`}
              aim={aim}
              summary={summary}
              floor={floor}
              onAttack={game.attack}
              onTreat={game.treat}
              onLeave={game.leave}
            />
          ) : (
            <Cursor summary={summary} aim={aim} floor={floor} />
          )}
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
