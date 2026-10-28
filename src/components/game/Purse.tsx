import { Shield } from '../hud/Emblem'
import { Figure } from '../hud/Figure'
import { Sheet } from '../hud/Sheet'
import { useCompact } from '../hud/useCompact'
import { count, hex } from './format'
import type { Summary } from '~/render/client'

/**
 * Top left: the shield filling with the peasants; the peasants over what the
 * land feeds, and the gold, each with what it brings a second.
 */
export function Purse({ summary }: Readonly<{ summary: Summary }>) {
  const { me } = summary
  const compact = useCompact()
  if (!me) return null
  return (
    <Sheet className="flex items-center gap-3 p-3">
      <Shield
        color={hex(me.color)}
        size={compact ? 'm' : 'l'}
        level={Math.min(1, me.peasants / Math.max(1, me.cap))}
      />
      <div className="grid flex-1 grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2">
        <Figure icon="soldier" size={compact ? 'l' : 'xl'}>
          {count(me.peasants)}
          <span className="text-hud-m opacity-70"> / {count(me.cap)}</span>
        </Figure>
        <Figure size="s" tone="thrive">
          {me.growth > 0 ? `+${me.growth}/s` : ''}
        </Figure>
        <Figure icon="coins" size={compact ? 'm' : 'l'}>
          {count(me.gold)}
        </Figure>
      </div>
    </Sheet>
  )
}
