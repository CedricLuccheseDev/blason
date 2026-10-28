import { Act } from '../hud/Act'
import { Shield } from '../hud/Emblem'
import { hex } from './format'
import type { GameHandle, Summary } from '~/render/client'
import { useMessages } from '~/i18n'

/**
 * Bottom right, the camera within reach of a finger or a mouse: closer,
 * farther, and back to the player's land (his shield).
 */
export function CameraButtons({
  game,
  summary,
}: Readonly<{ game: GameHandle; summary: Summary }>) {
  const m = useMessages()
  return (
    <div className="flex flex-col gap-2">
      <Act onClick={() => game.zoom(1)} label={m.camera.zoomIn}>
        <span className="hud-figure text-hud-l">+</span>
      </Act>
      <Act onClick={() => game.zoom(-1)} label={m.camera.zoomOut}>
        <span className="hud-figure text-hud-l">−</span>
      </Act>
      {summary.me && (
        <Act onClick={game.home} label={m.camera.home} tone="plain">
          <Shield color={hex(summary.me.color)} size="s" />
        </Act>
      )}
    </div>
  )
}
