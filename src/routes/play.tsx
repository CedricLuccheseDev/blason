import { Navigate, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { LEVELS, MAP_SIZES, SETUP_LIMITS } from '../../engine'
import type { Book, Level, MapSize } from '../../engine'
import type { Save } from '~/render/save'
import { GameScreen } from '~/components/game/GameScreen'
import { heldOnline } from '~/render/online'
import { randomSeed } from '~/render/ahead'
import { fetchSave } from '~/render/save'

export const Route = createFileRoute('/play')({
  staticData: { chrome: false },
  // The bots' level, chosen at the home, and the land's size (?size=large
  // or huge): normal and standard if none or unknown; or a game begun
  // online at the home (online.ts); or a saved game, held still (?save=,
  // render/save.ts), as the maquette takes the game's moments.
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    level?: Level
    size?: MapSize
    online?: boolean
    save?: string
    host?: boolean
  } => {
    const level = LEVELS.find((l) => l === search.level)
    const size = (Object.keys(MAP_SIZES) as Array<MapSize>).find(
      (s) => s === search.size,
    )
    const online = search.online === true || search.online === 'true'
    const save = typeof search.save === 'string' ? search.save : null
    const host = search.host === true || search.host === 'true'
    return {
      ...(host ? { host } : {}),
      ...(level ? { level } : {}),
      ...(size ? { size } : {}),
      ...(online ? { online } : {}),
      ...(save ? { save } : {}),
    }
  },
  component: Play,
})

// The game, the land taken bit by bit: against nineteen bots of the level
// chosen, or online, in the seat the relay gave, the other seats as its
// setup says (none a bot's in the public game). A game online left by a
// reload is lost: back to the table.
function Play() {
  const { level, size, online, save, host } = Route.useSearch()
  if (save) return <Saved name={save} />
  if (host) return <Hosted />
  if (!online)
    return <GameScreen me={0} level={level ?? 'normal'} size={size} />
  const game = heldOnline()
  if (!game) return <Navigate to="/" />
  return <GameScreen me={game.seat} online={game} />
}

/** The game the player creates (« créer une partie », solo being one with no guest): in the game at once, held, his book open on its settings. */
function Hosted() {
  const navigate = useNavigate()
  const fresh = (): Book => ({
    seed: randomSeed(),
    size: 'standard',
    bots: SETUP_LIMITS.seats.max - 1,
    level: 'normal',
    teams: 0,
    opening: SETUP_LIMITS.opening.alone,
  })
  const [book, setBook] = useState(fresh)
  const [launched, setLaunched] = useState(false)
  return (
    <GameScreen
      me={0}
      hosting={{
        book,
        launched,
        change: setBook,
        another: () => setBook({ ...book, seed: randomSeed() }),
        launch: () => setLaunched(true),
        restart: () => {
          setLaunched(false)
          setBook({ ...book, seed: randomSeed() })
        },
        quit: () => void navigate({ to: '/' }),
      }}
    />
  )
}

/** A saved game, fetched, then held still at its tick, seen from its seat; back home if there is none of that name. */
function Saved({ name }: Readonly<{ name: string }>) {
  const [save, setSave] = useState<Save | null>(null)
  const [missing, setMissing] = useState(false)
  useEffect(() => {
    fetchSave(name)
      .then(setSave)
      .catch(() => setMissing(true))
  }, [name])
  if (missing) return <Navigate to="/" />
  if (!save) return null
  return (
    <GameScreen me={save.me} level={save.level} size={save.size} save={save} />
  )
}
