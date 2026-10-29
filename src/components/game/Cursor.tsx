import { CoupEmblem, SealEmblem } from '../hud/Emblem'
import { Figure } from '../hud/Figure'
import { Sheet } from '../hud/Sheet'
import { useBeside } from '../hud/useBeside'
import { useCompact } from '../hud/useCompact'
import { count, hex } from './format'
import { ARMY_MARKS, ARMY_WAX, COUP_MARKS } from './Bar'
import type { RefObject } from 'react'
import type { Aim, Summary } from '~/render/client'
import { useMessages } from '~/i18n'

/**
 * The left of the cartouche: the army in hand, its men, and for mercenaries
 * their gold; whether a click sends it, or why not, in gules: every village
 * (or market) with its army out, or no man to raise, the gold short.
 */
function ArmyHalf({ summary }: Readonly<{ summary: Summary }>) {
  const m = useMessages()
  const { me } = summary
  const army = summary.armies.find((a) => a.army === summary.army)
  if (!me || !army) return null
  let note = <span className="hud-note">{m.game.click}</span>
  if (army.free === 0)
    note = <span className="hud-note text-gules">{m.game.noLevy[army.at]}</span>
  else if (army.men === 0)
    note = <span className="hud-note text-gules">{m.game.noMen[army.at]}</span>
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <SealEmblem
          icon={ARMY_MARKS[army.army]}
          color={ARMY_WAX[army.army] ?? hex(me.color)}
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
        {army.gold !== null && (
          <Figure icon="coins" size="l">
            {count(army.gold)}
          </Figure>
        )}
      </div>
      {note}
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

/** Over another lord's land: what a right click opens there (a long press on a phone), his menu. */
function MenuHint() {
  const m = useMessages()
  const compact = useCompact()
  return (
    <span className="hud-note">{compact ? m.menu.hintTouch : m.menu.hint}</span>
  )
}

/**
 * Beside the pointer over another's land, on the side away from where the
 * army would enter, so the land aimed at and the line to it stay in view: a
 * sheet with what a left click sends, the army in hand and its men, and
 * under it, over another lord's land, that a right click opens his menu
 * (LordMenu.tsx). Over an ally's land or a lord's beyond reach, that alone.
 * With a coup in hand, the coup alone, on the side away from where it would
 * leave from. In the opening, over a spot where the standard may not stand,
 * why, in gules. Near an edge of the screen or over the bar's row, it goes
 * to the pointer's other side rather than off the screen or on them.
 */
export function Cursor({
  aim,
  summary,
  floor,
}: Readonly<{
  aim: Aim | null
  summary: Summary
  /** The HUD's bottom row, which the cartouche stays above. */
  floor: RefObject<HTMLElement | null>
}>) {
  const m = useMessages()
  const { box, place } = useBeside(floor)
  if (!aim || !summary.me) return null
  const strikes = aim.entry !== null && !aim.coup
  const entry = aim.entry ?? { x: aim.x - 1, y: aim.y - 1 }
  return (
    <div
      ref={box}
      className="pointer-events-none absolute w-max"
      style={place(aim.x, aim.y, entry.x <= aim.x, entry.y <= aim.y)}
    >
      <Sheet className="flex flex-col gap-2 p-3">
        {aim.barred && (
          <span className="hud-note text-gules">{m.game.tooNear}</span>
        )}
        {aim.coup && <CoupHalf coup={aim.coup} summary={summary} />}
        {strikes && <ArmyHalf summary={summary} />}
        {aim.lord !== null && !aim.coup && <MenuHint />}
      </Sheet>
    </div>
  )
}
