import { useLayoutEffect, useState } from 'react'
import { CoupEmblem, SealEmblem } from '../hud/Emblem'
import { Figure } from '../hud/Figure'
import { Rule, Sheet } from '../hud/Sheet'
import { useCompact } from '../hud/useCompact'
import { useSize } from '../hud/useSize'
import { count, hex } from './format'
import { ARMY_MARKS, COUP_MARKS } from './Bar'
import { PactHalf, pactWith } from './Pact'
import type { RefObject } from 'react'
import type { Aim, Summary } from '~/render/client'
import { useMessages } from '~/i18n'

/** How far from the pointer the cartouche stands, and from the screen's sides and the bar's row at the least (the HUD's edge). */
const [DX, DY, EDGE] = [24, 20, 16]
/** On a phone, how far above the bottom of the screen it stands: over the bar, its three rows. */
const ABOVE_BAR = 216

/**
 * Where the cartouche's near side stands along one of the screen's axes:
 * `gap` past the pointer on the side it would rather be, or on the other
 * when it would run past `end` there, or held within it when it fits on
 * neither.
 */
function beside(
  at: number,
  gap: number,
  after: boolean,
  length: number,
  end: number,
): number {
  const fits = (start: number) => start >= EDGE && start + length <= end - EDGE
  const [rather, other] = after
    ? [at + gap, at - gap - length]
    : [at - gap - length, at + gap]
  if (fits(rather)) return rather
  if (fits(other)) return other
  return Math.max(EDGE, Math.min(rather, end - EDGE - length))
}

/** The top of the HUD's bottom row (the bar, the camera), read before the screen is painted: the screen's bottom without one. */
function useFloor(row: RefObject<HTMLElement | null>): number {
  const [top, setTop] = useState(0)
  useLayoutEffect(() => {
    const y = row.current?.getBoundingClientRect().top ?? window.innerHeight
    if (y !== top) setTop(y)
  })
  return top || window.innerHeight
}

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
 * would leave from. In the opening, over a spot where the standard may not
 * stand, why, in gules. Near an edge of the screen or over the bar's row, it
 * goes to the pointer's other side rather than off the screen or on them.
 */
export function Cursor({
  aim,
  summary,
  onTreat,
  floor,
}: Readonly<{
  aim: Aim | null
  summary: Summary
  onTreat: (type: 'ally' | 'breakAlliance', target: number) => void
  /** The HUD's bottom row, which the cartouche stays above. */
  floor: RefObject<HTMLElement | null>
}>) {
  const m = useMessages()
  const narrow = useCompact()
  const { box, size } = useSize()
  const bottom = useFloor(floor)
  if (!aim || !summary.me) return null
  const seat = aim.lord
  const strikes = aim.entry !== null && !aim.coup
  const entry = aim.entry ?? { x: aim.x - 1, y: aim.y - 1 }
  const right = entry.x <= aim.x
  const below = entry.y <= aim.y
  const pact = seat === null ? null : pactWith(summary, seat, m)
  return (
    <div
      ref={box}
      className="pointer-events-none absolute w-max"
      // On a phone, above the bar, where no finger hides it, its halves one
      // under the other when the screen is too narrow for them side by side.
      style={
        narrow
          ? {
              left: '50%',
              bottom: ABOVE_BAR,
              transform: 'translateX(-50%)',
              maxWidth: 'calc(100% - 1rem)',
            }
          : {
              left: beside(aim.x, DX, right, size.w, window.innerWidth),
              top: beside(aim.y, DY, below, size.h, bottom),
            }
      }
    >
      <Sheet className="flex flex-wrap items-stretch gap-3 p-3">
        {aim.barred && (
          <span className="hud-note text-gules">{m.game.tooNear}</span>
        )}
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
