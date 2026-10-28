import { Shield } from '../hud/Emblem'
import { Sheet } from '../hud/Sheet'
import { hex } from './format'
import type { ReactNode } from 'react'
import type { Heraldry } from '~/render/palette'
import { useMessages } from '~/i18n'

/** A lord on a sheet: his shield, his name and a figure beside it, a line under it, and what to do. */
export function LordSheet({
  lord,
  aside,
  children,
  act,
}: Readonly<{
  lord: { key: Heraldry; color: number }
  aside?: ReactNode
  children: ReactNode
  act?: ReactNode
}>) {
  const m = useMessages()
  return (
    <Sheet className="flex items-center gap-3 p-3">
      <Shield color={hex(lord.color)} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-center gap-2">
          <span className="hud-name truncate">{m.game.colors[lord.key]}</span>
          {aside}
        </span>
        {children}
      </div>
      {act}
    </Sheet>
  )
}
