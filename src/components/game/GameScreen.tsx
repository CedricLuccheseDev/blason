import { useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Defs } from './svg/kit'
import { Cursor } from './Cursor'
import { LordMenu } from './LordMenu'
import { Shades } from './Shades'
import { Heralds } from './Heralds'
import { GameBook } from './GameBook'
import { Places } from './Places'
import { Failed } from './Failed'
import type { Aim, GameHandle, News, Summary } from '~/render/client'
import type { Book, Level, MapSize } from '../../../engine'
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
 * at the bottom the bar, the purse in it; bottom right the book's button, for a hosted game (the camera's are gone:
 * « enlève les boutons de zoom et centrage à droite ils servent à rien »);
 * top left, over the lords, the game's name, the way home (« met dans le
 * header en haut à gauche, au moins le logo du jeu »); the
 * cartouche beside the pointer, or, on another lord's land right clicked,
 * his menu there.
 */
/** How long a betrayal is cried under the race. */
const CRY_MS = 3000

type Cry = { id: number; felon: number; victim: number }

/** The host's game and its book: the settings, whether launched, and what the book does. */
export type Hosting = {
  book: Book
  launched: boolean
  /** The room's code to give friends, while the relay holds it; whether guests sit, the game then begun online for all. */
  code: string | null
  online: boolean
  change: (book: Book) => void
  another: () => void
  launch: () => void
  restart: () => void
  quit: () => void
  /** A guest's: his book to read, what his room says. */
  guest?: { status: string }
}

export function GameScreen({
  me,
  level,
  online,
  save,
  size: sized = 'standard',
  hosting,
}: Readonly<{
  me: number
  /** The bots' level of a game alone; a game online's setup gives its own. */
  level?: Level
  online?: Online
  /** A saved game, held still at its tick (render/save.ts). */
  save?: Save
  size?: MapSize
  /** The host's game, held until he launches it from his book (« créer une partie »). */
  hosting?: Hosting
}>) {
  // A hosted game's land is its book's: another land or size, another game.
  const size = hosting?.book.size ?? sized
  const seed = hosting?.book.seed
  const [open, setOpen] = useState(hosting !== undefined)
  const waiting = hosting !== undefined && !hosting.launched
  const m = useMessages()
  const navigate = useNavigate()
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
        const mounted = await mountGame(element, seed ?? seedOf(), me, {
          onSummary: setSummary,
          onAim: setAim,
          onNews: tell,
          names: PLAYERS.map((p) => m.game.colors[p.key]),
          level,
          online,
          save,
          size,
          book: hosting?.book,
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
    // The book's other settings change the game only at its launch.
  }, [me, level, online, save, size, seed])

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
          <Shades />
          <Places
            summary={summary}
            game={game}
            aimed={aim?.lord ?? null}
            waiting={waiting}
            online={online !== undefined}
            cry={cry}
            floor={floor}
            onHome={() => void navigate({ to: '/' })}
            onBook={hosting ? () => setOpen(true) : null}
          />
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
      {hosting && open && (
        <GameBook
          book={hosting.book}
          code={hosting.launched ? null : hosting.code}
          running={
            hosting.launched && summary
              ? Math.floor(summary.seconds / 60)
              : null
          }
          onChange={hosting.change}
          onAnother={hosting.another}
          onLaunch={() => {
            // With guests the relay begins it for all; alone, here.
            if (!hosting.online) game?.launch(hosting.book)
            hosting.launch()
            setOpen(false)
          }}
          onClose={() => setOpen(false)}
          onRestart={() => {
            hosting.restart()
            setOpen(true)
          }}
          onQuit={hosting.quit}
          guest={hosting.guest}
        />
      )}
    </main>
  )
}
