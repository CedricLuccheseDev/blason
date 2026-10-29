import { useState } from 'react'
import { Shield, StandingBadge } from '../hud/Emblem'
import { Sheet } from '../hud/Sheet'
import { hex } from './format'
import { standingsOf } from './standing'
import type { Summary } from '~/render/client'
import { useMessages } from '~/i18n'

// Top right, the realms (« en haut à droite les royaumes »), floating as the
// map's names do: the first five and me, each his rank, his badges, his
// name, his shield and his share, aligned on the screen's margin; a click
// on their title shows all who stand. A line pointed at lights its land on
// the map, the lord under the pointer on the map lights his line.

/** The lines shown folded: the first so many, and me wherever I stand. */
const FIRST = 5

export function Realms({
  summary,
  aimed,
  onLight,
}: Readonly<{
  summary: Summary
  aimed: number | null
  /** A lord's line pointed at, his land to light on the map; none when the pointer leaves. */
  onLight: (lord: number | null) => void
}>) {
  const m = useMessages()
  const [all, setAll] = useState(false)
  const [pointed, setPointed] = useState<number | null>(null)
  const me = summary.me?.key
  const standing = summary.lords
    .filter((l) => l.alive)
    .sort((a, b) => b.share - a.share || b.men - a.men)
  const rows = standing
    .map((lord, i) => ({ lord, rank: i + 1 }))
    .filter(({ lord, rank }) => all || rank <= FIRST || lord.key === me)
  const point = (lord: number | null) => {
    setPointed(lord)
    onLight(lord)
  }
  return (
    <Sheet className="flex flex-col items-end gap-1 px-3 py-2">
      <button
        type="button"
        aria-expanded={all}
        onClick={() => setAll(!all)}
        className="hud-press pointer-events-auto flex min-h-8 cursor-pointer items-center gap-2 font-caps text-hud-s text-quill"
      >
        {m.lord.list}
        <span aria-hidden="true">{all ? '▴' : '▾'}</span>
      </button>
      <div className="grid grid-cols-[auto_auto_auto_auto_auto] items-center justify-items-end gap-x-2 gap-y-0.5">
        {rows.map(({ lord, rank }) => {
          const self = lord.key === me
          const lit = lord.seat === aimed || lord.seat === pointed
          return (
            <div
              key={lord.seat}
              onPointerEnter={() => point(lord.seat)}
              onPointerLeave={() => point(null)}
              className="pointer-events-auto col-span-5 grid grid-cols-subgrid items-center"
            >
              <span className="hud-figure text-hud-s text-quill">{rank}</span>
              <span className="flex gap-0.5">
                {standingsOf(lord, m).map((s) => (
                  <StandingBadge
                    key={s.standing}
                    standing={s.standing}
                    label={s.label}
                  />
                ))}
              </span>
              <span
                className={`hud-word text-hud-m ${self ? 'font-caps' : 'italic'} ${lit ? 'text-gilt-light' : 'text-quill'}`}
              >
                {m.game.colors[lord.key]}
              </span>
              <Shield color={hex(lord.color)} size="s" />
              <span className="hud-figure w-[3.2em] text-right text-hud-m text-quill">
                {lord.share} %
              </span>
            </div>
          )
        })}
      </div>
    </Sheet>
  )
}
