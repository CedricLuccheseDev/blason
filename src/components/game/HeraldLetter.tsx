import { useEffect, useState } from 'react'
import { Act } from '../hud/Act'
import { Shield } from '../hud/Emblem'
import { Icon } from '../hud/Figure'
import { Sheet } from '../hud/Sheet'
import { ICON, scaled } from '../hud/tokens'
import { LETTER, SealedLetter } from './svg/letter'
import { EdgeArrow } from './svg/pact'
import { hex } from './format'
import type { Summary } from '~/render/client'
import { useMessages } from '~/i18n'

type Offer = Summary['offers'][number]

/** How long the seal takes to break before the letter opens: the HUD's time for what appears. */
const BREAK_MS = 200
/** Smaller on a phone, as the board's phone view has it. */
const COMPACT = 0.84

/**
 * An offer of alliance as the herald brings it, standing on my land nearest
 * the lord who sends it: his sealed letter, the gold ring of the time it
 * stands round the seal, and under it who sends it and what to do. A click
 * opens it, its seal breaking in two: accept the alliance, in green, or
 * refuse it, in gules, and let the offer lapse. At the edge of the screen,
 * an arrow out of its ring towards where it stands.
 */
export function HeraldLetter({
  offer,
  toward,
  compact,
  room,
  onSeal,
  onRefuse,
}: Readonly<{
  offer: Offer
  toward: number | null
  compact: boolean
  /** Pixels between the letter and the screen's sides, so that it opens within them. */
  room: { left: number; right: number }
  onSeal: () => void
  onRefuse: () => void
}>) {
  const m = useMessages()
  const [stage, setStage] = useState<'sealed' | 'breaking' | 'open'>('sealed')
  useEffect(() => {
    if (stage !== 'breaking') return
    const opening = setTimeout(() => setStage('open'), BREAK_MS)
    return () => clearTimeout(opening)
  }, [stage])
  const name = m.game.colors[offer.key]
  if (stage === 'open')
    return (
      <Opened offer={offer} room={room} onSeal={onSeal} onRefuse={onRefuse} />
    )
  const k = compact ? COMPACT : 1
  const [w, h] = [LETTER.w * k, LETTER.h * k]
  return (
    <div className="flex flex-col items-center">
      <div className={stage === 'sealed' ? 'hud-bob' : undefined}>
        <button
          type="button"
          onClick={() => setStage('breaking')}
          disabled={stage !== 'sealed'}
          aria-label={m.heralds.openLetter(name)}
          title={m.heralds.openLetter(name)}
          className="hud-press pointer-events-auto block cursor-pointer"
        >
          <svg
            viewBox={`0 0 ${w} ${h}`}
            aria-hidden="true"
            className="overflow-visible"
            style={{ width: scaled(w), height: scaled(h) }}
          >
            <SealedLetter
              color={hex(offer.color)}
              frac={offer.ring}
              broken={stage === 'breaking'}
              k={k}
            />
            {toward !== null && (
              <EdgeArrow
                cx={w / 2}
                cy={LETTER.cy * k}
                r={(LETTER.r + 7) * k}
                angle={toward}
              />
            )}
          </svg>
        </button>
      </div>
      {stage === 'sealed' && (
        <Sheet className="flex flex-col items-center px-3 py-1 text-center whitespace-nowrap">
          <span className="hud-word">{m.heralds.offer(name)}</span>
          <span className="hud-note">
            {compact ? m.heralds.tapToOpen : m.heralds.clickToOpen}
          </span>
        </Sheet>
      )}
    </div>
  )
}

/** The letter open: who offers, and the two answers, yes in the alliance's green and no in gules; kept within the screen's sides. */
function Opened({
  offer,
  room,
  onSeal,
  onRefuse,
}: Readonly<{
  offer: Offer
  room: { left: number; right: number }
  onSeal: () => void
  onRefuse: () => void
}>) {
  const m = useMessages()
  const half = `(${scaled(160)} + 8px)`
  const shift = `calc(max(0px, ${half} - ${room.left}px) - max(0px, ${half} - ${room.right}px))`
  return (
    // Over the HUD's corners, as what is being read (Heralds.tsx raises its piece).
    <div
      data-open
      className="pointer-events-auto"
      style={{ transform: `translateX(${shift})` }}
    >
      <Sheet className="flex w-80 flex-col gap-3 p-4">
        <div className="flex items-center gap-3">
          <Shield color={hex(offer.color)} />
          <div className="flex min-w-0 flex-col">
            <span className="hud-name">{m.game.colors[offer.key]}</span>
            <span className="hud-note">{m.heralds.offers}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Act tone="pact" onClick={onSeal}>
            <Icon name="links" size={ICON.m} />
            {m.heralds.accept}
          </Act>
          <Act tone="gules" onClick={onRefuse}>
            {m.heralds.refuse}
          </Act>
        </div>
      </Sheet>
    </div>
  )
}
