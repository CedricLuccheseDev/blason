import { useLayoutEffect, useRef, useState } from 'react'
import { Figure } from '../hud/Figure'
import { Sheet } from '../hud/Sheet'
import { scaled } from '../hud/tokens'
import { Glyph, INK } from './svg/marks'
import { COUP_MARKS } from './Bar'
import { count } from './format'
import type { Mark } from './svg/marks'
import type { News } from '~/render/client'
import type { Messages } from '~/i18n/en'
import { PLAYERS } from '~/render/palette'
import { useMessages } from '~/i18n'

/** What the news says, the gold it brings if any (written after it, in figures), the mark on its pennant, and whether it is ill news for me. */
function told(
  news: Exclude<News, { kind: 'betrayed' }>,
  lord: string,
  m: Messages,
): { text: string; gold?: number; mark: Mark; ill: boolean } {
  if (news.kind === 'coup')
    return {
      text: m.heralds.coup[news.coup](lord),
      mark: COUP_MARKS[news.coup],
      ill: true,
    }
  if (news.kind === 'stopped')
    return {
      text: m.heralds.stopped(lord),
      mark: COUP_MARKS.troublemaker,
      ill: true,
    }
  if (news.kind === 'rose')
    return news.mine
      ? { text: m.heralds.roseAgainst(lord), mark: 'pitchfork', ill: true }
      : { text: m.heralds.roseFrom(lord), mark: 'pitchfork', ill: false }
  if (news.kind === 'offering')
    return {
      text: m.heralds.offering(lord),
      gold: news.gold,
      mark: 'market',
      ill: false,
    }
  return { text: m.heralds.attacks(lord), mark: 'sword', ill: true }
}

/** Where its pole stands in its drawing: the pennant is set by the foot of its pole. */
export const POLE = { x: 6, h: 64 }
/** The drawing's width, and the room kept from the screen's side (the HUD's edge). */
const [WIDE, EDGE] = [60, 16]

/**
 * Whether the pennant flies the other way, its words before its pole: when,
 * the usual way, they would run off the screen's right side.
 */
function useFlip() {
  const box = useRef<HTMLDivElement>(null)
  const [flip, setFlip] = useState(false)
  useLayoutEffect(() => {
    const el = box.current
    const drawing = el?.querySelector('svg')
    if (!el || !drawing) return
    const d = drawing.getBoundingClientRect()
    const at = POLE.x / WIDE
    const pole = d.left + d.width * (flip ? 1 - at : at)
    const right = pole - d.width * at + el.offsetWidth
    const away = right > window.innerWidth - EDGE
    if (away !== flip) setFlip(away)
  })
  return { box, flip }
}

/**
 * A piece of news where it happened, once, fading: a pennant planted
 * there, gules for ill news and gold for good, the mark of what happened on
 * it, and what happened beside it: a lord biting my border, a coup falling
 * on my land, my troublemaker stopped, a land risen, an offering given me
 * (the market's purse, on the giver's land). Near the screen's right side
 * it flies to the left, its pole where it stood.
 */
export function Pennant({
  news,
}: Readonly<{ news: Exclude<News, { kind: 'betrayed' }> }>) {
  const m = useMessages()
  const { box, flip } = useFlip()
  const lord = m.game.colors[PLAYERS[news.lord].key]
  const { text, gold, mark, ill } = told(news, lord, m)
  // Flown the other way, the pole is as far from its right end as it was
  // from its left: the whole drawn back by its width, less that twice.
  const back = flip
    ? `translateX(calc(-100% + 2 * ${scaled(POLE.x)}))`
    : undefined
  return (
    <div ref={box} style={{ transform: back }}>
      <div
        className={`hud-life flex items-start ${flip ? 'flex-row-reverse' : ''}`}
      >
        <svg
          viewBox={`0 0 ${WIDE} ${POLE.h}`}
          aria-hidden="true"
          className={`shrink-0 overflow-visible ${flip ? '-scale-x-100' : ''}`}
          style={{ width: scaled(WIDE), height: scaled(POLE.h) }}
        >
          <path
            d="M6 62 V4"
            stroke={INK}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <circle
            cx="6"
            cy="4"
            r="3"
            fill="var(--color-gilt)"
            stroke={INK}
            strokeWidth="1"
          />
          <path
            d="M7 8 H48 L38 18 L48 28 H7 Z"
            fill={ill ? 'var(--color-gules)' : 'var(--color-gilt)'}
            stroke={INK}
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <Glyph
            name={mark}
            cx={22}
            cy={18}
            size={15}
            fill="var(--color-wax)"
            stroke={ill ? 'var(--color-gules-deep)' : INK}
            sw={1.4}
          />
        </svg>
        <Sheet
          className={`flex items-center gap-1 px-2 py-1 whitespace-nowrap ${flip ? '-mr-3' : '-ml-3'}`}
        >
          <span className={`hud-word ${ill ? 'text-gules' : ''}`}>{text}</span>
          {gold !== undefined && <Figure icon="coins">{count(gold)}</Figure>}
        </Sheet>
      </div>
    </div>
  )
}
