import { Act } from '../hud/Act'
import { Shield } from '../hud/Emblem'
import { Figure } from '../hud/Figure'
import { Sheet } from '../hud/Sheet'
import { hex, minutes } from './format'
import type { ReactNode } from 'react'
import type { Heraldry } from '~/render/palette'
import type { Summary } from '~/render/client'
import { useMessages } from '~/i18n'

/** A lord on a sheet: his shield, his name and a figure beside it, a line under it, and what to do. */
function LordSheet({
  lord,
  aside,
  children,
  act,
}: Readonly<{
  lord: { key: Heraldry; color: number }
  aside?: ReactNode
  children: ReactNode
  act?: ReactNode
}>) {
  const m = useMessages()
  return (
    <Sheet className="flex items-center gap-3 p-3">
      <Shield color={hex(lord.color)} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-center gap-2">
          <span className="hud-name truncate">{m.game.colors[lord.key]}</span>
          {aside}
        </span>
        {children}
      </div>
      {act}
    </Sheet>
  )
}

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
