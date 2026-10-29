import { useEffect, useState } from 'react'
import { Act } from '../hud/Act'
import { Shield } from '../hud/Emblem'
import { Icon } from '../hud/Figure'
import { Inline, Panel, Stack, Tag } from '../hud/Layout'
import { Name, Note, Word } from '../hud/Text'
import { ICON, scaled } from '../hud/tokens'
import { useSize } from '../hud/useSize'
import { LETTER, SealedLetter } from './svg/letter'
import { EdgeArrow } from './svg/pact'
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
 * an arrow out of its ring towards where it stands; its words, as the open
 * letter, kept within the screen's sides.
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
  /** Pixels between the letter and the screen's sides, so that its words and the letter open stay within them. */
  room: Room
  onSeal: () => void
  onRefuse: () => void
}>) {
  const m = useMessages()
  const words = useSize()
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
        <div
          ref={words.box}
          style={{ transform: within(`${words.size.w / 2}px`, room) }}
        >
          <Tag className="flex-col text-center">
            <Word>{m.heralds.offer(name)}</Word>
            <Note>{compact ? m.heralds.tapToOpen : m.heralds.clickToOpen}</Note>
          </Tag>
        </div>
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
  room: Room
  onSeal: () => void
  onRefuse: () => void
}>) {
  const m = useMessages()
  // Half its width, w-80 as drawn.
  const shift = within(scaled(160), room)
  return (
    // Over the HUD's corners, as what is being read (Heralds.tsx raises its piece).
    <div data-open className="pointer-events-auto" style={{ transform: shift }}>
      <Panel gap="part" className="w-80">
        <Inline gap="part">
          <Shield color={hex(offer.color)} />
          <Stack gap="hair" className="min-w-0">
            <Name>{m.game.colors[offer.key]}</Name>
            <Note>{m.heralds.offers}</Note>
          </Stack>
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
