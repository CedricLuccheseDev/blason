import { CoupEmblem, SealEmblem } from '../hud/Emblem'
import { Figure } from '../hud/Figure'
import { Rule, Sheet } from '../hud/Sheet'
import { useCompact } from '../hud/useCompact'
import { count, hex } from './format'
import { ARMY_MARKS, COUP_MARKS } from './Bar'
import { PactHalf, pactWith } from './Pact'
import type { Aim, Summary } from '~/render/client'
import { useMessages } from '~/i18n'

/** How far from the pointer the cartouche stands. */
const [DX, DY] = [24, 20]
/** On a phone, how far above the bottom of the screen it stands: over the bar, its three rows. */
const ABOVE_BAR = 216

/** The left of the cartouche: the army in hand, its men and its gold. */
function ArmyHalf({ summary }: Readonly<{ summary: Summary }>) {
  const m = useMessages()
  const { me } = summary
  const army = summary.armies.find((a) => a.army === summary.army)
  if (!me || !army) return null
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <SealEmblem
          icon={ARMY_MARKS[army.army]}
          color={hex(me.color)}
          size="s"
        />
        <span className="hud-word text-hud-l whitespace-nowrap">
          {m.game.armies[army.army]}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <Figure icon="soldier" size="l">
          {count(army.men)}
        </Figure>
        {army.gold > 0 && (
          <Figure icon="coins" size="l">
            {count(army.gold)}
          </Figure>
        )}
      </div>
      {me.free > 0 ? (
        <span className="hud-note">{m.game.click}</span>
      ) : (
        <span className="hud-note text-gules">{m.game.noLevy}</span>
      )}
    </div>
  )
}

/** With a coup in hand: the coup, its price, and whether a click launches it, or why not. */
function CoupHalf({
  coup,
  summary,
}: Readonly<{ coup: NonNullable<Aim['coup']>; summary: Summary }>) {
  const m = useMessages()
  const price = summary.coups.find((c) => c.coup === coup.coup)?.price ?? 0
  let note = <span className="hud-note">{m.game.launch}</span>
  if (!coup.allowed)
    note = (
      <span className="hud-note text-gules">{m.game.beyond[coup.coup]}</span>
    )
  else if (!coup.can)
    note = <span className="hud-note text-gules">{m.game.noGold}</span>
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <CoupEmblem icon={COUP_MARKS[coup.coup]} size="s" />
        <span className="hud-word text-hud-l whitespace-nowrap">
          {m.game.coups[coup.coup]}
        </span>
      </div>
      <Figure icon="coins" size="l" tone={coup.can ? 'ink' : 'gules'}>
        {count(price)}
      </Figure>
      {note}
    </div>
  )
}

/**
 * Beside the pointer over another's land, on the side away from where the
 * army would enter, so the land aimed at and the line to it stay in view: a
 * sheet whose left, at full ink, is the army in hand, what a left click
 * sends, and whose right is the lord and the alliance to offer, accept or
 * break, faint until a right click sets it down. Over free land, the left
 * alone; over an ally's land or a lord's beyond reach, the right alone.
 * With a coup in hand, the coup alone, on the side away from where it
 * would leave from.
 */
export function Cursor({
  aim,
  summary,
  onTreat,
}: Readonly<{
  aim: Aim | null
  summary: Summary
  onTreat: (type: 'ally' | 'breakAlliance', target: number) => void
}>) {
  const m = useMessages()
  const narrow = useCompact()
  if (!aim || !summary.me) return null
  const seat = aim.lord
  const strikes = aim.entry !== null && !aim.coup
  const entry = aim.entry ?? { x: aim.x - 1, y: aim.y - 1 }
  const right = entry.x <= aim.x
  const below = entry.y <= aim.y
  const pact = seat === null ? null : pactWith(summary, seat, m)
  return (
    <div
      className="pointer-events-none absolute"
      // On a phone, above the bar, where no finger hides it.
      style={
        narrow
          ? { left: '50%', bottom: ABOVE_BAR, transform: 'translateX(-50%)' }
          : {
              left: aim.x + (right ? DX : -DX),
              top: aim.y + (below ? DY : -DY),
              transform: `translate(${right ? 0 : '-100%'}, ${below ? 0 : '-100%'})`,
            }
      }
    >
      <Sheet className="flex items-stretch gap-3 p-3">
        {aim.coup && <CoupHalf coup={aim.coup} summary={summary} />}
        {strikes && <ArmyHalf summary={summary} />}
        {strikes && pact && <Rule />}
        {seat !== null && pact && !aim.coup && (
          <PactHalf
            aim={aim}
            seat={seat}
            summary={summary}
            pact={pact}
            onTreat={onTreat}
          />
        )}
      </Sheet>
    </div>
  )
}
