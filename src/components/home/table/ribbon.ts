import { clock, leftOf } from './useRoom'
import type { Mode } from '~/table/modes'
import type { Level } from '../../../../engine'
import type { Messages } from '~/i18n/en'
import type { Room } from './useRoom'

// What the seal plays, as its ribbon says it: the bots and their level, the
// public room and when it starts, a private room and its code.

export function ribbonOf(
  t: Messages['table'],
  levels: Messages['home']['levels'],
  {
    mode,
    level,
    room,
    now,
  }: { mode: Mode; level: Level; room: Room; now: number },
): string {
  if (mode === 'bots') return t.ribbon.bots(levels[level])
  const seated = room.status === 'seated' ? room.lobby : null
  if (mode === 'online') {
    const left = leftOf(room, now)
    return seated?.open && left !== null
      ? t.ribbon.startsIn(clock(left))
      : t.ribbon.online
  }
  return seated && !seated.open ? t.ribbon.room(seated.room) : t.ribbon.private
}
