import { Act } from '../hud/Act'
import { Panel, Veil } from '../hud/Layout'
import { Call, Note } from '../hud/Text'
import { useMessages } from '~/i18n'

/** When the game cannot start: what happened, and the way to try again. */
export function Failed() {
  const m = useMessages()
  return (
    <Veil>
      <Panel page gap="part" className="items-center">
        <Call>{m.errors.title}</Call>
        <Note>{m.errors.tryReload}</Note>
        <Act onClick={() => window.location.reload()}>{m.errors.reload}</Act>
      </Panel>
    </Veil>
  )
}
