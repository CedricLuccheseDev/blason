import { createFileRoute } from '@tanstack/react-router'
import { GameScreen } from '~/components/game/GameScreen'

export const Route = createFileRoute('/play')({
  staticData: { chrome: false },
  component: Play,
})

// The game, the land taken bit by bit, against nineteen bots.
function Play() {
  return <GameScreen me={0} />
}
