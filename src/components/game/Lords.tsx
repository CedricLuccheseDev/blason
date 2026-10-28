import { useEffect, useState } from 'react'
import { Act } from '../hud/Act'
import { Shield, StandingBadge } from '../hud/Emblem'
import { useCompact } from '../hud/useCompact'
import { Sheet } from '../hud/Sheet'
import { count, hex } from './format'
import { standingsOf } from './standing'
import type { Summary } from '~/render/client'
import { useMessages } from '~/i18n'

/** Lords listed at most: the first ones, and the player's line if he is further down. */
const SHOWN = 8

/**
 * Top left, the lords still standing, as on OpenFront, the list folded away
 * at a click: the first by
 * their share of the land, the player among them or under them, each with
 * his shield, his share and his men, and his badges: an ally's links on a
 * line ruled in green, a foe's sword, a traitor's broken shield; the lord
 * under the pointer stands out
 * in the list as on the map.
 */
export function Lords({
  summary,
  aimed,
}: Readonly<{ summary: Summary; aimed: number | null }>) {
  const m = useMessages()
  const compact = useCompact()
  // Folded on a phone, where the map needs the room; open elsewhere. The
  // first render cannot know the screen yet: it folds once it does.
  const [open, setOpen] = useState(true)
  useEffect(() => {
    if (compact) setOpen(false)
  }, [compact])
  const me = summary.me?.key
  const standing = summary.lords
    .filter((l) => l.alive)
    .sort((a, b) => b.share - a.share || b.men - a.men)
  const ranked = standing.map((lord, i) => ({ lord, rank: i + 1 }))
  const first = ranked.slice(0, SHOWN)
  const mine = ranked.find((r) => r.lord.key === me)
  const rows =
    mine && !first.includes(mine) ? [...first.slice(0, -1), mine] : first
  // On a phone, folded, the list is a shield to open it by.
  if (compact && !open)
    return (
      <Act tone="plain" label={m.lord.list} onClick={() => setOpen(true)}>
        <Shield color={hex(summary.me?.color ?? 0)} size="s" />
      </Act>
    )
  return (
    <Sheet
      className={`flex w-full flex-col gap-1 px-3 py-2 ${
        compact ? 'absolute top-0 left-0 z-10 w-[calc(100vw-1rem)]' : ''
      }`}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="pointer-events-auto flex cursor-pointer items-center justify-between hud-press"
      >
        <span className="hud-note">{m.lord.list}</span>
        <span
          aria-hidden="true"
          className={`hud-note transition-transform duration-(--duration-hud-press) ease-hud ${open ? '' : '-rotate-90'}`}
        >
          ▾
        </span>
      </button>
      {open &&
        rows.map(({ lord, rank }) => {
          const lit = lord.seat === aimed
          const self = lord.key === me
          // An ally's line is ruled in the alliance's green down its left,
          // and washed in it, as his border is on the map.
          let wash = 'border-transparent'
          if (lit) wash = 'border-transparent bg-gilt/25'
          else if (lord.allied) wash = 'border-pact bg-pact/10'
          return (
            <div
              key={lord.seat}
              className={`flex items-center gap-2 border-l-[3px] px-1 transition-colors duration-(--duration-hud-press) ease-hud ${wash}`}
            >
              <span className="hud-figure text-hud-s w-4 text-right opacity-60">
                {rank}
              </span>
              <Shield color={hex(lord.color)} size="s" />
              <span
                className={`hud-word min-w-0 flex-1 truncate text-hud-s ${self ? 'font-bold' : ''}`}
              >
                {m.game.colors[lord.key]}
                {self && <span className="hud-note"> ({m.lord.you})</span>}
              </span>
              <span className="flex shrink-0 gap-0.5 empty:hidden">
                {standingsOf(lord, m).map((s) => (
                  <StandingBadge
                    key={s.standing}
                    standing={s.standing}
                    label={s.label}
                  />
                ))}
              </span>
              <span className="hud-figure text-hud-s w-8 text-right">
                {m.game.percent(lord.share)}
              </span>
              <span className="hud-figure text-hud-s w-12 text-right opacity-70">
                {count(lord.men)}
              </span>
            </div>
          )
        })}
    </Sheet>
  )
}
