import { createFileRoute } from '@tanstack/react-router'
import { LEVELS } from '../../engine'
import type { Level } from '../../engine'
import { GameScreen } from '~/components/game/GameScreen'

export const Route = createFileRoute('/play')({
  staticData: { chrome: false },
  // The bots' level, chosen at the home: normal if none or unknown.
  validateSearch: (search: Record<string, unknown>): { level?: Level } => {
    const level = LEVELS.find((l) => l === search.level)
    return level ? { level } : {}
  },
  component: Play,
})

// The game, the land taken bit by bit, against nineteen bots of the level chosen.
function Play() {
  const { level } = Route.useSearch()
  return <GameScreen me={0} level={level ?? 'normal'} />
}
