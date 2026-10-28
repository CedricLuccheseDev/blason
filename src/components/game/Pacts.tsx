import { Act } from '../hud/Act'
import { StandingBadge } from '../hud/Emblem'
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
      <span className="hud-note whitespace-nowrap text-pact">
        {m.pacts.offer}
      </span>
    </LordSheet>
  ))
}

/**
 * Among the letters, the alliances in their last moments: each lord bound to
 * the player, the time left, the seal to renew it. The others are read in
 * the lords' list, an ally's links ringed by the time he has left.
 */
export function Allies({
  summary,
  onRenew,
}: Readonly<{ summary: Summary; onRenew: (seat: number) => void }>) {
  const m = useMessages()
  return summary.allies
    .filter((a) => a.renewable)
    .map((a) => (
      <LordSheet
        key={a.seat}
        lord={a}
        act={
          a.renewable && (
            <Act onClick={() => onRenew(a.seat)}>{m.pacts.renew}</Act>
          )
        }
      >
        <span className="flex items-center gap-2">
          <StandingBadge standing="ally" label={m.lord.allied} />
          <Figure icon="hourglass" size="s" tone="pact">
            {minutes(a.left)}
          </Figure>
        </span>
      </LordSheet>
    ))
}
