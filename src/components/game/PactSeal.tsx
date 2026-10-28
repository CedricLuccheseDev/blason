import { Figure } from '../hud/Figure'
import { Sheet } from '../hud/Sheet'
import { scaled } from '../hud/tokens'
import { INK, PAPER } from './svg/marks'
import { EdgeArrow, PairSeal, TimeRing } from './svg/pact'
import { hex, minutes } from './format'
import type { Summary } from '~/render/client'
import { useMessages } from '~/i18n'

type Ally = Summary['allies'][number]

/** The seal's box and its radius, on a computer and on a phone, as drawn at the HUD's scale 1. */
export const PACT_SEAL = {
  wide: { box: 84, r: 22 },
  compact: { box: 70, r: 18 },
}

/**
 * The seal of an alliance of mine, at the middle of its ribbon: parted in
 * my colour and my ally's, the ring of its time round it in green. In its
 * last moments it glows, its ring turned gold on those moments; a half
 * pressed is a lord who asked to renew, and a click presses mine. At the
 * edge of the screen, an arrow out of its ring towards where it belongs.
 * Under it, the time left and, in its last moments, whose turn it is.
 */
export function PactSeal({
  ally,
  mine,
  toward,
  compact,
  onRenew,
}: Readonly<{
  ally: Ally
  mine: number
  toward: number | null
  compact: boolean
  onRenew: (seat: number) => void
}>) {
  const m = useMessages()
  const { box, r } = PACT_SEAL[compact ? 'compact' : 'wide']
  const c = box / 2
  const name = m.game.colors[ally.key]
  const live = ally.closing && !ally.pressed
  const seal = (
    <svg
      viewBox={`0 0 ${box} ${box}`}
      aria-hidden="true"
      className="overflow-visible"
      style={{ width: scaled(box), height: scaled(box) }}
    >
      <circle
        cx={c}
        cy={c}
        r={r + 9}
        fill={PAPER}
        stroke={INK}
        strokeWidth="1.4"
      />
      <TimeRing
        cx={c}
        cy={c}
        r={r + 9}
        frac={ally.ring}
        color={ally.closing ? 'var(--color-gilt)' : 'var(--color-pact)'}
      />
      <PairSeal
        cx={c}
        cy={c}
        r={r}
        left={hex(mine)}
        right={hex(ally.color)}
        leftEmpty={ally.closing && !ally.pressed}
        rightEmpty={ally.closing && !ally.theirs}
      />
      {toward !== null && <EdgeArrow cx={c} cy={c} r={r + 9} angle={toward} />}
    </svg>
  )
  let note = ''
  if (ally.closing && ally.pressed) note = m.heralds.waiting(name)
  else if (ally.closing && ally.theirs) note = m.heralds.yourTurn(name)
  else if (ally.closing) note = m.heralds.press
  return (
    <div className="flex flex-col items-center gap-1">
      {live ? (
        // norm-ok: a seal is round, and so is what takes its click.
        <button
          type="button"
          onClick={() => onRenew(ally.seat)}
          aria-label={m.heralds.renew(name)}
          title={m.heralds.renew(name)}
          className="hud-press hud-glow pointer-events-auto cursor-pointer rounded-full"
        >
          {seal}
        </button>
      ) : (
        <div role="img" aria-label={m.heralds.pact(name, minutes(ally.left))}>
          {seal}
        </div>
      )}
      <Sheet className="flex items-center gap-2 px-2 py-1 whitespace-nowrap">
        <Figure size="s" tone={ally.closing ? 'ink' : 'pact'}>
          {minutes(ally.left)}
        </Figure>
        {note && <span className="hud-note">{note}</span>}
      </Sheet>
    </div>
  )
}
