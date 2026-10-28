import { Navigate, createFileRoute } from '@tanstack/react-router'
import { LEVELS, MAP_SIZES } from '../../engine'
import type { Level, MapSize } from '../../engine'
import { GameScreen } from '~/components/game/GameScreen'
import { heldOnline } from '~/render/online'

export const Route = createFileRoute('/play')({
  staticData: { chrome: false },
  // The bots' level, chosen at the home, and the land's size (?size=large
  // or huge): normal and standard if none or unknown; or a game begun
  // online at the home (online.ts).
  validateSearch: (
    search: Record<string, unknown>,
  ): { level?: Level; size?: MapSize; online?: boolean } => {
    const level = LEVELS.find((l) => l === search.level)
    const size = (Object.keys(MAP_SIZES) as Array<MapSize>).find(
      (s) => s === search.size,
    )
    const online = search.online === true || search.online === 'true'
    return {
      ...(level ? { level } : {}),
      ...(size ? { size } : {}),
      ...(online ? { online } : {}),
    }
  },
  component: Play,
})

// The game, the land taken bit by bit: against nineteen bots of the level
// chosen, or online, in the seat the relay gave, the empty seats bots. A
// game online left by a reload is lost: back to the table.
function Play() {
  const { level, size, online } = Route.useSearch()
  if (!online)
    return <GameScreen me={0} level={level ?? 'normal'} size={size} />
  const game = heldOnline()
  if (!game) return <Navigate to="/" />
  return <GameScreen me={game.seat} level={game.level} online={game} />
}
