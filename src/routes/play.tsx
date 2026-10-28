import { Navigate, createFileRoute } from '@tanstack/react-router'
import { LEVELS } from '../../engine'
import type { Level } from '../../engine'
import { GameScreen } from '~/components/game/GameScreen'
import { heldOnline } from '~/render/online'

export const Route = createFileRoute('/play')({
  staticData: { chrome: false },
  // The bots' level, chosen at the home: normal if none or unknown; or a
  // game begun online at the home (online.ts).
  validateSearch: (
    search: Record<string, unknown>,
  ): { level?: Level; online?: boolean } => {
    const level = LEVELS.find((l) => l === search.level)
    const online = search.online === true || search.online === 'true'
    return { ...(level ? { level } : {}), ...(online ? { online } : {}) }
  },
  component: Play,
})

// The game, the land taken bit by bit: against nineteen bots of the level
// chosen, or online, in the seat the relay gave, the empty seats bots. A
// game online left by a reload is lost: back to the table.
function Play() {
  const { level, online } = Route.useSearch()
  if (!online) return <GameScreen me={0} level={level ?? 'normal'} />
  const game = heldOnline()
  if (!game) return <Navigate to="/" />
  return <GameScreen me={game.seat} level={game.level} online={game} />
}
