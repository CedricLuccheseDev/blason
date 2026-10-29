import { Act } from '../hud/Act'
import { Sheet } from '../hud/Sheet'
import { useMessages } from '~/i18n'

/** When the game cannot start: what happened, and the way to try again. */
export function Failed() {
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
