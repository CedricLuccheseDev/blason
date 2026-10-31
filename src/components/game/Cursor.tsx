import { CoupEmblem, SealEmblem } from '../hud/Emblem'
import { Figure } from '../hud/Figure'
import { Rule } from '../hud/Sheet'
import { Inline, Panel, Stack } from '../hud/Layout'
import { Note } from '../hud/Text'
import { useBeside } from '../hud/useBeside'
import { count, hex } from './format'
import { FleetHalf, MenuHint, Mouse, PlaceHint, Struck } from './CursorParts'
import { ARMY_MARKS, ARMY_WAX, COUP_MARKS } from './seals'
import type { RefObject } from 'react'
import type { Aim, Summary } from '~/render/client'
import { useMessages } from '~/i18n'

/**
 * The left of the cartouche: the army in hand, its men, and for mercenaries
 * their gold; whether a click sends it, or why not, in gules: no army free
 * (its seal struck through), or no man to raise, the gold short.
 */
function ArmyHalf({ summary }: Readonly<{ summary: Summary }>) {
  const m = useMessages()
  const { me } = summary
  const army = summary.armies.find((a) => a.army === summary.army)
  if (!me || !army) return null
  const seal = ARMY_WAX[army.army] ?? hex(me.color)
  let note = null
  // None free to leave: the army's seal struck through, and a word (« note
  // juste no army avec l'icon army barré »).
  if (army.free === 0)
    note = (
      <Inline gap="hair">
        <Struck>
          <SealEmblem icon={ARMY_MARKS[army.army]} color={seal} size="xs" dim />
        </Struck>
        <Note className="text-gules">{m.game.noLevy[army.at]}</Note>
      </Inline>
    )
  else if (army.men === 0)
    note = <Note className="text-gules">{m.game.noMen[army.at]}</Note>
  return (
    <Stack gap="hair">
      <Inline>
        <SealEmblem icon={ARMY_MARKS[army.army]} color={seal} size="xs" />
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
        <Figure icon="coins" size="m" tone={coup.can ? 'info' : 'loss'}>
          {count(price)}
        </Figure>
      </Inline>
      {note}
    </Stack>
  )
}

/**
 * Beside the pointer over another's land, on the side away from where the
 * army would enter, so the land aimed at and the line to it stay in view: a
 * small sheet on one line, on its left a mouse its left button lit, what a
 * click sends, the army in hand and its men; on its right, over another
 * lord's land, greyed, a mouse its right button lit and what it opens there,
 * his menu (LordMenu.tsx). Over an ally's land or a lord's beyond reach, that alone.
 * Over my own land, no left click, and on the right what a right click
 * opens there, the works that may stand on the tile (PlaceMenu.tsx); over
 * the water a port of mine reaches, a warship, or with one in hand what a
 * click fits out (« le tableau … fais quelque chose d'homogene »).
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
  const fitting = aim.sea && summary.fleet.held
  const left = strikes || aim.coup !== null || fitting
  // The right click opens a menu: a lord's, or the place's.
  const lord = aim.lord !== null && !aim.coup
  const placed = !fitting && (aim.works.length > 0 || aim.sea)
  const right = lord || placed
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
          {fitting && <FleetHalf summary={summary} />}
          {/* The two mice in the middle (« mets les icônes souris gauche et droite au centre »): the left's action on the left, the right's, greyed, on the right. */}
          {/* The right mouse wherever a lord's menu opens, an ally's land too, where no left click sends an army (« il manque l'icon clique droit »). */}
          {(left || right) && (
            <Inline>
              {left && <Mouse button="left" />}
              {right && (
                <>
                  {/* The rule between the two halves (« remets la barre au milieu »). */}
                  {left && <Rule />}
                  <span className="opacity-50">
                    <Mouse button="right" />
                  </span>
                </>
              )}
            </Inline>
          )}
          {lord && <MenuHint />}
          {placed && !lord && <PlaceHint aim={aim} />}
        </Inline>
      </Panel>
    </div>
  )
}
