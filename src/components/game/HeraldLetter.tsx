import { Act } from '../hud/Act'
import { Icon } from '../hud/Figure'
import { Inline, Panel } from '../hud/Layout'
import { Word } from '../hud/Text'
import { ICON, scaled } from '../hud/tokens'
import { useSize } from '../hud/useSize'
import { EdgeArrow, PairSeal, TimeGauge } from './svg/pact'
import { hex } from './format'
import type { Summary } from '~/render/client'
import { useMessages } from '~/i18n'

type Offer = Summary['offers'][number]

/** Pixels between a piece's middle and each of the screen's sides. */
type Room = { left: number; right: number }

/**
 * The shift across that keeps a piece `half` wide on each side of its
 * middle within the screen's sides, with a margin of 8 pixels.
 */
function within(half: string, room: Room): string {
  const reach = `(${half} + 8px)`
  return `translateX(calc(max(0px, ${reach} - ${room.left}px) - max(0px, ${reach} - ${room.right}px)))`
}

/** The offer's seal and its gauge, as drawn at the HUD's scale 1: its box, its wax's radius, the gauge's band round it. */
export const OFFER = { box: 44, r: 12, band: 8, h: 112 }

/**
 * An offer of alliance as the herald brings it, standing on my land nearest
 * the lord who sends it: one sheet, no letter over it (« tu peux enlever
 * l'envelope au dessus la demande »): the seal of the alliance, his half
 * pressed in his colour and mine still paper, in the gold gauge of the time
 * the offer stands, sinking as it runs out; who sends it; and the two
 * answers at once, no click to open it first (« le clic to open c'est un
 * clic de trop, met directement le accepter ou refuser »): accept, in the
 * alliance's green, or refuse, in gules, and let it lapse. At the edge of the
 * screen, an arrow out of the gauge towards where it stands; kept within the
 * screen's sides.
 */
export function HeraldLetter({
  offer,
  mine,
  toward,
  room,
  onSeal,
  onRefuse,
}: Readonly<{
  offer: Offer
  /** My colour, for my half of the seal, still paper. */
  mine: number
  toward: number | null
  /** Pixels between the offer's middle and the screen's sides, so that it stays within them. */
  room: Room
  onSeal: () => void
  onRefuse: () => void
}>) {
  const m = useMessages()
  const sheet = useSize()
  const name = m.game.colors[offer.key]
  const { box, r, band } = OFFER
  const c = box / 2
  return (
    <div
      ref={sheet.box}
      data-open
      className="pointer-events-auto"
      style={{ transform: within(`${sheet.size.w / 2}px`, room) }}
    >
      <Panel gap="line" className="items-center">
        <Inline gap="line">
          <svg
            viewBox={`0 0 ${box} ${box}`}
            aria-hidden="true"
            className="shrink-0 overflow-visible"
            style={{ width: scaled(box), height: scaled(box) }}
          >
            <TimeGauge
              cx={c}
              cy={c}
              inner={r}
              outer={r + band}
              frac={offer.ring}
              color="var(--color-gilt)"
            />
            <PairSeal
              cx={c}
              cy={c}
              r={r}
              left={hex(offer.color)}
              right={hex(mine)}
              rightEmpty
            />
            {toward !== null && (
              <EdgeArrow cx={c} cy={c} r={r + band} angle={toward} />
            )}
          </svg>
          <Word>{m.heralds.offer(name)}</Word>
        </Inline>
        <Inline>
          <Act tone="pact" onClick={onSeal}>
            <Icon name="links" size={ICON.m} />
            {m.heralds.accept}
          </Act>
          <Act tone="gules" onClick={onRefuse}>
            {m.heralds.refuse}
          </Act>
        </Inline>
      </Panel>
    </div>
  )
}
