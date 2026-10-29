import { Navigate, createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { LEVELS, MAP_SIZES } from '../../engine'
import type { Level, MapSize } from '../../engine'
import type { Save } from '~/render/save'
import { GameScreen } from '~/components/game/GameScreen'
import { heldOnline } from '~/render/online'
import { fetchSave } from '~/render/save'

export const Route = createFileRoute('/play')({
  staticData: { chrome: false },
  // The bots' level, chosen at the home, and the land's size (?size=large
  // or huge): normal and standard if none or unknown; or a game begun
  // online at the home (online.ts); or a saved game, held still (?save=,
  // render/save.ts), as the maquette takes the game's moments.
  validateSearch: (
    search: Record<string, unknown>,
  ): { level?: Level; size?: MapSize; online?: boolean; save?: string } => {
    const level = LEVELS.find((l) => l === search.level)
    const size = (Object.keys(MAP_SIZES) as Array<MapSize>).find(
      (s) => s === search.size,
    )
    const online = search.online === true || search.online === 'true'
    const save = typeof search.save === 'string' ? search.save : null
    return {
      ...(level ? { level } : {}),
      ...(size ? { size } : {}),
      ...(online ? { online } : {}),
      ...(save ? { save } : {}),
    }
  },
  component: Play,
})

// The game, the land taken bit by bit: against nineteen bots of the level
// chosen, or online, in the seat the relay gave, the empty seats bots. A
// game online left by a reload is lost: back to the table.
function Play() {
  const { level, size, online, save } = Route.useSearch()
  if (save) return <Saved name={save} />
  if (!online)
    return <GameScreen me={0} level={level ?? 'normal'} size={size} />
  const game = heldOnline()
  if (!game) return <Navigate to="/" />
  return <GameScreen me={game.seat} level={game.level} online={game} />
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
