import { useEffect, useRef, useState } from 'react'
import { Shield } from '../hud/Emblem'
import { Figure } from '../hud/Figure'
import { useCompact } from '../hud/useCompact'
import { count, hex } from './format'
import type { Summary } from '~/render/client'

/** Seconds the cap stays red after it fell. */
const SHRUNK = 3

/** Whether the cap just fell, a village lost: true for a few seconds. */
function useShrunk(cap: number): boolean {
  const before = useRef(cap)
  const [until, setUntil] = useState(0)
  useEffect(() => {
    if (cap < before.current) setUntil(Date.now() + SHRUNK * 1000)
    before.current = cap
  }, [cap])
  return Date.now() < until
}

/**
 * At the left of the bar, what the player has beside what he spends: the
 * shield filling with the peasants; the peasants over what the villages
 * feed, red a moment when that falls, a village lost; and the gold.
 */
export function Purse({ summary }: Readonly<{ summary: Summary }>) {
  const { me } = summary
  const compact = useCompact()
  const shrunk = useShrunk(me?.cap ?? 0)
  if (!me) return null
  return (
    <div className="flex items-center gap-2">
      {!compact && (
        <Shield
          color={hex(me.color)}
          size="m"
          level={Math.min(1, me.peasants / Math.max(1, me.cap))}
        />
      )}
      <div
        className={
          compact
            ? 'flex items-center gap-3'
            : 'grid grid-cols-[auto_auto] items-center gap-x-2 gap-y-1'
        }
      >
        <Figure icon="soldier" size={compact ? 'm' : 'l'}>
          {count(me.peasants)}
          <span
            className={`text-hud-m transition-colors duration-(--duration-hud-enter) ease-hud ${
              shrunk ? 'text-gules' : 'opacity-70'
            }`}
          >
            {' '}
            / {count(me.cap)}
          </span>
        </Figure>
        <Figure size="s" tone="thrive">
          {me.growth > 0 ? `+${me.growth}/s` : ''}
        </Figure>
        <Figure icon="coins" size={compact ? 'm' : 'l'}>
          {count(me.gold)}
        </Figure>
      </div>
    </div>
  )
}
