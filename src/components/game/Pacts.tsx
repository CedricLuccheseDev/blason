import { Act } from '../hud/Act'
import { Figure } from '../hud/Figure'
import { minutes } from './format'
import { LordSheet } from './LordSheet'
import type { Summary } from '~/render/client'
import { useMessages } from '~/i18n'

/**
 * Top right, the emissaries' letters: each lord who offers his alliance, the
 * seconds the offer stands, and the seal to accept it.
 */
export function Offers({
  summary,
  onAccept,
}: Readonly<{ summary: Summary; onAccept: (seat: number) => void }>) {
  const m = useMessages()
  return summary.offers.map((o) => (
    <LordSheet
      key={o.seat}
      lord={o}
      aside={
        <Figure icon="hourglass" size="s" tone="dim">{`${o.left} s`}</Figure>
      }
      act={<Act onClick={() => onAccept(o.seat)}>{m.pacts.accept}</Act>}
    >
      <span className="hud-note whitespace-nowrap">{m.pacts.offer}</span>
    </LordSheet>
  ))
}

/**
 * Under the purse, the player's allies: each lord bound to him, the time the
 * alliance has left, and in its last moments the seal to renew it.
 */
export function Allies({
  summary,
  onRenew,
}: Readonly<{ summary: Summary; onRenew: (seat: number) => void }>) {
  const m = useMessages()
  return summary.allies.map((a) => (
    <LordSheet
      key={a.seat}
      lord={a}
      act={
        a.renewable && (
          <Act onClick={() => onRenew(a.seat)}>{m.pacts.renew}</Act>
        )
      }
    >
      <Figure icon="links" size="s" tone="dim">
        {minutes(a.left)}
      </Figure>
    </LordSheet>
  ))
}
