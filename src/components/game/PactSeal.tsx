import { Figure } from '../hud/Figure'
import { Sheet } from '../hud/Sheet'
import { scaled } from '../hud/tokens'
import { INK, PAPER } from './svg/marks'
import { EdgeArrow, PairSeal, TimeRing } from './svg/pact'
import { hex, minutes } from './format'
import type { Summary } from '~/render/client'
import { useMessages } from '~/i18n'

type Ally = Summary['allies'][number]

/** The seal's box and its wax's radius, on a computer and on a phone, as drawn at the HUD's scale 1; its ring round the wax. */
export const PACT_SEAL = {
  wide: { box: 48, r: 13 },
  compact: { box: 44, r: 12 },
}
const RING = 7

/**
 * The seal of an alliance of mine in its last moments, when it asks to be
 * renewed, laid beside my ally's name: parted in my colour and my ally's,
 * a half still paper for a lord who has not pressed it, a click pressing
 * mine; it glows while it waits for mine, and its ring of gold is the time
 * left, written under it. What to do, in words, under the pointer: written
 * on the map they would lie over the names round it. At the edge of the
 * screen, an arrow out of its ring towards where it belongs.
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
        r={r + RING}
        fill={PAPER}
        stroke={INK}
        strokeWidth="1.4"
      />
      <TimeRing
        cx={c}
        cy={c}
        r={r + RING}
        frac={ally.ring}
        color="var(--color-gilt)"
        width={3.6}
      />
      <PairSeal
        cx={c}
        cy={c}
        r={r}
        left={hex(mine)}
        right={hex(ally.color)}
        leftEmpty={!ally.pressed}
        rightEmpty={!ally.theirs}
      />
      {toward !== null && (
        <EdgeArrow cx={c} cy={c} r={r + RING} angle={toward} />
      )}
    </svg>
  )
  const note = ally.theirs ? m.heralds.yourTurn(name) : m.heralds.press
  return (
    <div className="flex flex-col items-center gap-1">
      {ally.pressed ? (
        <div role="img" aria-label={m.heralds.pact(name, minutes(ally.left))}>
          {seal}
        </div>
      ) : (
        // norm-ok: a seal is round, and so is what takes its click.
        <button
          type="button"
          onClick={() => onRenew(ally.seat)}
          aria-label={m.heralds.renew(name)}
          title={note}
          className="hud-press hud-glow pointer-events-auto cursor-pointer rounded-full"
        >
          {seal}
        </button>
      )}
      <Sheet className="px-2 py-1 whitespace-nowrap">
        <Figure size="s" tone="ink">
          {minutes(ally.left)}
        </Figure>
      </Sheet>
    </div>
  )
}
