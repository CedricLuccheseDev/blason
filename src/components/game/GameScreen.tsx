import { Link } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { Act, actClass } from '../hud/Act'
import { Figure } from '../hud/Figure'
import { Rule, Sheet } from '../hud/Sheet'
import { Defs } from './svg/kit'
import { Race } from './Race'
import { Cursor } from './Cursor'
import { Allies, Offers } from './Pacts'
import { Bar } from './Bar'
import { Purse } from './Purse'
import type { Aim, GameHandle, Summary } from '~/render/client'
import { PLAYERS } from '~/render/palette'
import { useMessages } from '~/i18n'

const seedOf = () => new URLSearchParams(window.location.search).get('seed')

/**
 * The game, the land taken bit by bit: the map in the whole window,
 * and over it the HUD, every piece a sheet of the design system
 * (components/hud) set in a grid kept 16 pixels from the edges: top left
 * the purse and the allies under it; top centre the race, and under it the
 * opening and the end; top right the letters; at the bottom the bar; the
 * cartouche beside the pointer.
 */
export function GameScreen({ me }: Readonly<{ me: number }>) {
  const m = useMessages()
  const host = useRef<HTMLDivElement>(null)
  const [game, setGame] = useState<GameHandle | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [aim, setAim] = useState<Aim | null>(null)
  // The game could not start (no WebGL, a failed load): said, not a blank page.
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const element = host.current
    if (!element) return
    let handle: GameHandle | undefined
    let cancelled = false
    import('~/render/client')
      .then(async ({ mountGame }) => {
        const mounted = await mountGame(element, seedOf(), me, {
          onSummary: setSummary,
          onAim: setAim,
          names: PLAYERS.map((p) => m.game.colors[p.key]),
        })
        if (cancelled) mounted.destroy()
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
  }, [me])

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-vellum select-none">
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
          <div className="pointer-events-none absolute inset-0 grid grid-cols-[1fr_auto_1fr] grid-rows-[auto_1fr_auto] gap-4 p-4 max-sm:[zoom:0.75]">
            <div className="flex w-80 flex-col gap-2">
              <Purse summary={summary} />
              <Allies
                summary={summary}
                onRenew={(seat) => game.treat('ally', seat)}
              />
            </div>
            <div className="flex flex-col items-center gap-2">
              <Race summary={summary} />
              <Moment summary={summary} />
            </div>
            <div className="flex w-80 flex-col gap-2 justify-self-end">
              <Offers
                summary={summary}
                onAccept={(seat) => game.treat('ally', seat)}
              />
            </div>
            <div className="col-span-3 row-start-3 flex justify-center">
              <Bar summary={summary} onArmy={game.choose} onWork={game.hold} />
            </div>
          </div>
          <Cursor summary={summary} aim={aim} onTreat={game.treat} />
        </>
      )}
    </main>
  )
}

/** The opening and the end, under the race. */
function Moment({ summary }: Readonly<{ summary: Summary }>) {
  const m = useMessages()
  const [dismissed, setDismissed] = useState(false)
  const { me, opening, winner } = summary
  if (opening !== null) {
    const picking = me && !me.picked
    return (
      <Sheet className="flex items-center gap-4 px-6 py-4">
        <Figure size="xl">{opening}</Figure>
        <Rule />
        <div className="flex flex-col gap-1">
          <span className="hud-word text-hud-l">
            {picking ? m.game.choose : m.game.others}
          </span>
          {picking && <span className="hud-note">{m.game.chooseHint}</span>}
        </div>
      </Sheet>
    )
  }
  const fallen = me && !me.alive
  // Watching the end hides the fall, never the winner.
  if (!winner && (dismissed || !fallen)) return null
  let title = winner ? `${m.game.colors[winner]} ${m.game.winner}` : ''
  if (me && winner === me.key) title = m.game.victory
  else if (fallen) title = m.game.fallen
  return (
    <Sheet className="flex flex-col items-center gap-3 px-6 py-4">
      <span className="hud-word text-hud-xl" aria-live="polite">
        {title}
      </span>
      <div className="flex gap-2">
        <Link to="/play" reloadDocument className={actClass()}>
          {m.game.playAgain}
        </Link>
        {fallen && !winner && (
          <Act tone="plain" onClick={() => setDismissed(true)}>
            {m.game.watchEnd}
          </Act>
        )}
      </div>
    </Sheet>
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
