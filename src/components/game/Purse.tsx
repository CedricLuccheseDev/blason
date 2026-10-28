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

/** Seconds a gain stays beside the gold once the last of it came in. */
const GAIN = 2

type Gain = {
  /** The gold come in since the "+" appeared, in gold. */
  amount: number
  /** When it fades, unless more comes in before. */
  until: number
  /** Which "+" it is: a new one rises in, a growing one stays where it is. */
  n: number
}

/**
 * The gold just earned, as it comes, in bursts: a caravan arrived, free land
 * taken. Read on all the gold he has gained (render/earnings.ts), never on
 * his purse, so that a work paid for the same second hides nothing; gains
 * close together add up in one "+", which stays while more keeps coming.
 */
function useGain(earned: number): Gain & { on: boolean } {
  const before = useRef(earned)
  const [gain, setGain] = useState<Gain>({ amount: 0, until: 0, n: 0 })
  useEffect(() => {
    const came = earned - before.current
    before.current = earned
    if (came <= 0) return
    const now = Date.now()
    setGain((g) =>
      now < g.until
        ? { amount: g.amount + came, until: now + GAIN * 1000, n: g.n }
        : { amount: came, until: now + GAIN * 1000, n: g.n + 1 },
    )
  }, [earned])
  return { ...gain, on: Date.now() < gain.until }
}

/**
 * Beside the gold, in green, what just came in, as the "+" rising over the
 * markets on the map: it rises in, then fades. Its room is kept, three figures
 * wide, so that nothing moves when it comes or goes.
 */
function Earned({ earned }: Readonly<{ earned: number }>) {
  const { amount, n, on } = useGain(earned)
  return (
    <span className="grid">
      <span aria-hidden="true" className="invisible col-start-1 row-start-1">
        <Figure size="s">+000</Figure>
      </span>
      {n > 0 && (
        <span
          key={n}
          aria-hidden={!on}
          className={`col-start-1 row-start-1 transition-opacity duration-(--duration-hud-enter) ease-hud motion-reduce:transition-none ${
            on ? '' : 'opacity-0'
          }`}
        >
          <span className="hud-enter inline-block">
            <Figure size="s" tone="thrive">
              +{count(amount)}
            </Figure>
          </span>
        </span>
      )}
    </span>
  )
}

/**
 * At the left of the bar, what the player has beside what he spends: the
 * shield filling with the peasants; the peasants over what the villages
 * feed, red a moment when that falls, a village lost, and how many are born
 * a second; the gold, and what just came in.
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
        <Figure size="s" tone={me.growth < 0 ? 'gules' : 'thrive'}>
          {me.growth > 0 && `+${me.growth}/s`}
          {/* Too many for the villages: the sickness takes them. */}
          {me.growth < 0 && `\u2212${-me.growth}/s`}
        </Figure>
        <Figure icon="coins" size={compact ? 'm' : 'l'}>
          {count(me.gold)}
        </Figure>
        <Earned earned={me.earned} />
      </div>
    </div>
  )
}
