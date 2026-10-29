import { Sheet } from '../hud/Sheet'
import { scaled } from '../hud/tokens'
import { Glyph, INK } from './svg/marks'
import { COUP_MARKS } from './Bar'
import type { Mark } from './svg/marks'
import type { News } from '~/render/client'
import type { Messages } from '~/i18n/en'
import { PLAYERS } from '~/render/palette'
import { useMessages } from '~/i18n'

/** What the news says, the mark on its pennant, and whether it is ill news for me. */
function told(
  news: Exclude<News, { kind: 'betrayed' }>,
  lord: string,
  m: Messages,
): { text: string; mark: Mark; ill: boolean } {
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
  return { text: m.heralds.attacks(lord), mark: 'sword', ill: true }
}

/** Where its pole stands in its drawing: the pennant is set by the foot of its pole. */
export const POLE = { x: 6, h: 64 }

/**
 * A piece of news where it happened, once, fading: a pennant planted
 * there, gules for ill news and gold for good, the mark of what happened on
 * it, and what happened beside it: a lord biting my border, a coup falling
 * on my land, my troublemaker stopped, a land risen.
 */
export function Pennant({
  news,
}: Readonly<{ news: Exclude<News, { kind: 'betrayed' }> }>) {
  const m = useMessages()
  const lord = m.game.colors[PLAYERS[news.lord].key]
  const { text, mark, ill } = told(news, lord, m)
  return (
    <div className="hud-life flex items-start">
      <svg
        viewBox={`0 0 60 ${POLE.h}`}
        aria-hidden="true"
        className="shrink-0 overflow-visible"
        style={{ width: scaled(60), height: scaled(POLE.h) }}
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
      <Sheet className="-ml-3 px-2 py-1 whitespace-nowrap">
        <span className={`hud-word ${ill ? 'text-gules' : ''}`}>{text}</span>
      </Sheet>
    </div>
  )
}
