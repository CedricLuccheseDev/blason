import { Shield } from '../hud/Emblem'
import { Icon } from '../hud/Figure'
import { ICON } from '../hud/tokens'
import { Sheet } from '../hud/Sheet'
import { count, hex } from './format'
import type { Summary } from '~/render/client'
import { useMessages } from '~/i18n'

/** Lords listed at most: the first ones, and the player's line if he is further down. */
const SHOWN = 8

/**
 * Bottom left, the lords still standing, as on OpenFront: the first by
 * their share of the land, the player among them or under them, each with
 * his shield, his share and his men, the links of an ally, the broken shield
 * of a traitor; the lord under the pointer stands out
 * in the list as on the map.
 */
export function Lords({
  summary,
  aimed,
}: Readonly<{ summary: Summary; aimed: number | null }>) {
  const m = useMessages()
  const me = summary.me?.key
  const standing = summary.lords
    .filter((l) => l.alive)
    .sort((a, b) => b.share - a.share || b.men - a.men)
  const ranked = standing.map((lord, i) => ({ lord, rank: i + 1 }))
  const first = ranked.slice(0, SHOWN)
  const mine = ranked.find((r) => r.lord.key === me)
  const rows =
    mine && !first.includes(mine) ? [...first.slice(0, -1), mine] : first
  return (
    <Sheet className="flex flex-col gap-1 p-3">
      <span className="hud-note">{m.lord.list}</span>
      {rows.map(({ lord, rank }) => {
        const lit = lord.seat === aimed
        const self = lord.key === me
        return (
          <div
            key={lord.seat}
            className={`flex items-center gap-2 px-1 transition-colors duration-(--duration-hud-press) ease-hud ${
              lit ? 'bg-gilt/25' : ''
            }`}
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
            {lord.allied && <Icon name="links" size={ICON.s} />}
            {lord.felon && <Icon name="felon" size={ICON.s} />}
            <span className="hud-figure text-hud-s w-9 text-right">
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
