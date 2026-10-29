import { useEffect, useRef, useState } from 'react'
import { Shield } from '../hud/Emblem'
import { Figure } from '../hud/Figure'
import { Hint } from '../hud/Hint'
import { GAP } from '../hud/Layout'
import { useCompact } from '../hud/useCompact'
import { count, hex } from './format'
import type { Summary } from '~/render/client'
import { useMessages } from '~/i18n'

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
 * shield filling with the peasants, a click on it the camera back on his
 * land; the peasants over what the villages
 * feed, red a moment when that falls, a village lost, and how many are born
 * a second; the gold, and what just came in.
 */
export function Purse({
  summary,
  onHome,
}: Readonly<{
  summary: Summary
  /** The camera brought back to my land. */
  onHome: () => void
}>) {
  const { me } = summary
  const t = useMessages().hints
  const compact = useCompact()
  const shrunk = useShrunk(me?.cap ?? 0)
  if (!me) return null
  // What the peasants' figures come from: the land's part and the villages',
  // then how they grow, or why they do not.
  const fed = t.peasants.fed(count(me.fed), me.villages, count(me.cap - me.fed))
  let growing = t.peasants.born(count(me.growth), count(me.cap))
  if (me.growth < 0) growing = t.peasants.sick(count(-me.growth))
  else if (me.peasants >= me.cap) growing = t.peasants.full
  return (
    <div className={`hud-afloat flex items-end ${GAP.line}`}>
      {/* As tall as the two lines beside it (« le blason est pas aussi haut que la partie droite »); a click brings the camera back to my land (« cliquer sur le blason centre la cam sur le territoire »). */}
      {!compact && (
        <Hint title={t.home.title} lines={[t.home.line]}>
          <button
            type="button"
            onClick={onHome}
            aria-label={t.home.title}
            className="hud-press flex cursor-pointer"
          >
            <Shield
              color={hex(me.color)}
              size="purse"
              level={Math.min(1, me.peasants / Math.max(1, me.cap))}
            />
          </button>
        </Hint>
      )}
      <div
        className={
          compact
            ? `flex items-center ${GAP.part}`
            : `grid grid-cols-[auto_auto] items-center ${GAP.hair}`
        }
      >
        <Hint title={t.peasants.title} lines={[fed, growing]}>
          <Figure icon="soldier" size={compact ? 'm' : 'l'}>
            {count(me.peasants)}
            <span
              className={`transition-colors duration-(--duration-hud-enter) ease-hud ${
                shrunk ? 'text-gules' : 'opacity-70'
              }`}
            >
              {' '}
              / {count(me.cap)}
            </span>
          </Figure>
        </Hint>
        <Figure size="s" tone={me.growth < 0 ? 'gules' : 'thrive'}>
          {me.growth > 0 && `+${me.growth}/s`}
          {/* Too many for the villages: the sickness takes them. */}
          {me.growth < 0 && `\u2212${-me.growth}/s`}
        </Figure>
        <Hint
          title={t.gold.title}
          lines={[t.gold.line, t.gold.earned(count(me.earned))]}
        >
          <Figure icon="coins" size={compact ? 'm' : 'l'}>
            {count(me.gold)}
          </Figure>
        </Hint>
        <Earned earned={me.earned} />
      </div>
    </div>
  )
}
