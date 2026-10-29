import { ActMedallion, CoupEmblem, SealEmblem } from '../hud/Emblem'
import { Figure } from '../hud/Figure'
import { Rule } from '../hud/Sheet'
import { Inline, Panel, Stack } from '../hud/Layout'
import { Note } from '../hud/Text'
import { useBeside } from '../hud/useBeside'
import { useCompact } from '../hud/useCompact'
import { count, hex } from './format'
import { ARMY_MARKS, ARMY_WAX, COUP_MARKS } from './Bar'
import type { RefObject } from 'react'
import type { Aim, Summary } from '~/render/client'
import { useMessages } from '~/i18n'

/** A mouse, the button a click is made with in gold: what the cartouche's half answers to (« au lieu d'écrire clic droit, clic gauche, mets des icônes de souris »). */
function Mouse({ button }: Readonly<{ button: 'left' | 'right' }>) {
  const lit =
    button === 'left'
      ? 'M12 3 V11 H5.5 V9 Q5.5 3 12 3 Z'
      : 'M12 3 V11 H18.5 V9 Q18.5 3 12 3 Z'
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-7 shrink-0">
      <path
        d="M5.5 9 Q5.5 3 12 3 Q18.5 3 18.5 9 V15 Q18.5 21 12 21 Q5.5 21 5.5 15 Z"
        fill="var(--color-vellum)"
        stroke="var(--color-quill)"
        strokeWidth="1.5"
      />
      <path
        d={lit}
        fill="var(--color-gilt)"
        stroke="var(--color-quill)"
        strokeWidth="1.2"
      />
      <path
        d="M12 3 V11 M5.5 11 H18.5"
        stroke="var(--color-quill)"
        strokeWidth="1.2"
        fill="none"
      />
    </svg>
  )
}

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
  let note = null
  if (army.free === 0)
    note = <Note className="text-gules">{m.game.noLevy[army.at]}</Note>
  else if (army.men === 0)
    note = <Note className="text-gules">{m.game.noMen[army.at]}</Note>
  return (
    <Stack gap="hair">
      <Inline>
        <SealEmblem
          icon={ARMY_MARKS[army.army]}
          color={ARMY_WAX[army.army] ?? hex(me.color)}
          size="xs"
        />
        <Figure icon="soldier" size="m">
          {count(army.men)}
        </Figure>
        {army.gold !== null && (
          <Figure icon="coins" size="m">
            {count(army.gold)}
          </Figure>
        )}
      </Inline>
      {note}
    </Stack>
  )
}

/** With a coup in hand: the coup, its price, and whether a click launches it, or why not. */
function CoupHalf({
  coup,
  summary,
}: Readonly<{ coup: NonNullable<Aim['coup']>; summary: Summary }>) {
  const m = useMessages()
  const price = summary.coups.find((c) => c.coup === coup.coup)?.price ?? 0
  let note = null
  if (!coup.allowed)
    note = <Note className="text-gules">{m.game.beyond[coup.coup]}</Note>
  else if (!coup.can) note = <Note className="text-gules">{m.game.noGold}</Note>
  return (
    <Stack gap="hair">
      <Inline>
        <CoupEmblem icon={COUP_MARKS[coup.coup]} size="xs" />
        <Figure icon="coins" size="m" tone={coup.can ? 'ink' : 'gules'}>
          {count(price)}
        </Figure>
      </Inline>
      {note}
    </Stack>
  )
}

/** Over another lord's land, greyed until it is pressed: what a right click opens there, his menu (a long press on a phone). */
function MenuHint() {
  const m = useMessages()
  const compact = useCompact()
  if (compact) return <Note>{m.menu.hintTouch}</Note>
  return (
    <div className="opacity-50" title={m.menu.options}>
      <Inline gap="hair">
        <ActMedallion icon="links" ring="var(--color-pact)" />
        <ActMedallion icon="market" ring="var(--color-gilt)" />
      </Inline>
    </div>
  )
}

/**
 * Beside the pointer over another's land, on the side away from where the
 * army would enter, so the land aimed at and the line to it stay in view: a
 * small sheet on one line, on its left a mouse its left button lit, what a
 * click sends, the army in hand and its men; on its right, over another
 * lord's land, greyed, a mouse its right button lit and what it opens there,
 * his menu (LordMenu.tsx). Over an ally's land or a lord's beyond reach, that alone.
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
      <Panel>
        <Inline gap="part">
          {aim.barred && <Note className="text-gules">{m.game.tooNear}</Note>}
          {aim.coup && <CoupHalf coup={aim.coup} summary={summary} />}
          {strikes && <ArmyHalf summary={summary} />}
          {/* The two mice in the middle (« mets les icônes souris gauche et droite au centre »): the left's action on the left, the right's, greyed, on the right. */}
          {(strikes || aim.coup) && (
            <Inline>
              <Mouse button="left" />
              {aim.lord !== null && !aim.coup && (
                <>
                  {/* The rule between the two halves (« remets la barre au milieu »). */}
                  <Rule />
                  <span className="opacity-50">
                    <Mouse button="right" />
                  </span>
                </>
              )}
            </Inline>
          )}
          {aim.lord !== null && !aim.coup && <MenuHint />}
        </Inline>
      </Panel>
    </div>
  )
}
