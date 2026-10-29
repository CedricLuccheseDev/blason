import { useEffect, useState } from 'react'
import { Act } from '../hud/Act'
import { Shield, StandingBadge } from '../hud/Emblem'
import { useCompact } from '../hud/useCompact'
import { Sheet } from '../hud/Sheet'
import { hex } from './format'
import { standingsOf } from './standing'
import type { Summary } from '~/render/client'
import { useMessages } from '~/i18n'

/**
 * Top left, every lord still standing, as Cédric chose on the mockup (« ok
 * les bandes »): a thin line each, by his share of the land, washed behind
 * in his colour as far as his land goes against the first's, so that who
 * leads and by how much reads at a glance; his shield, his name, his badges
 * (an ally's links on a line ruled in green, a foe's sword, a traitor's
 * broken shield) and his share. Mine ringed in gold; the lord under the
 * pointer lit, as he stands out on the map (« enlève le hud en bas à gauche
 * qui affiche le royaume que tu vises, highlight sur le panneau »), and the
 * other way, a line under the pointer lights its lord's land on the map
 * (« quand on hover highlight sur la map le territoire du seigneur »). The
 * fallen leave it, so that it shortens as the game goes; it folds away at a
 * click.
 */
export function Lords({
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
  const compact = useCompact()
  // Folded on a phone, where the map needs the room; open elsewhere. The
  // first render cannot know the screen yet: it folds once it does.
  const [open, setOpen] = useState(true)
  /** The line under the pointer, lit as its land is on the map. */
  const [pointed, setPointed] = useState<number | null>(null)
  const point = (lord: number | null) => {
    setPointed(lord)
    onLight(lord)
  }
  useEffect(() => {
    if (compact) setOpen(false)
  }, [compact])
  const me = summary.me?.key
  const standing = summary.lords
    .filter((l) => l.alive)
    .sort((a, b) => b.share - a.share || b.men - a.men)
  const rows = standing.map((lord, i) => ({ lord, rank: i + 1 }))
  const first = Math.max(1, ...standing.map((l) => l.land))
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
      {open && (
        <div className="flex flex-col gap-px">
          {rows.map(({ lord, rank }) => {
            const lit = lord.seat === aimed || lord.seat === pointed
            const self = lord.key === me
            // An ally's line is ruled in the alliance's green down its left,
            // as his border is on the map; mine ringed in gold; the lord
            // under the pointer lit in gold and ringed in ink, the list
            // standing for the sheet that once showed him bottom left.
            let ring = ''
            if (lit)
              ring = 'bg-gilt/35 outline-[1.5px] outline-quill outline-solid'
            else if (self) ring = 'outline-[1.5px] outline-gilt outline-solid'
            return (
              <div
                key={lord.seat}
                onPointerEnter={() => point(lord.seat)}
                onPointerLeave={() => point(null)}
                className={`pointer-events-auto relative flex items-center border-l-[3px] px-1 ${lord.allied ? 'border-pact' : 'border-transparent'} ${ring}`}
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-y-px left-0 transition-[width] duration-(--duration-hud-enter) ease-hud motion-reduce:transition-none"
                  style={{
                    width: `${(100 * lord.land) / first}%`,
                    background: `color-mix(in srgb, ${hex(lord.color)} 30%, transparent)`,
                  }}
                />
                <span className="relative flex min-w-0 flex-1 items-center gap-2">
                  <span className="hud-figure text-hud-s w-5 shrink-0 text-right leading-[1.1] opacity-60">
                    {rank}
                  </span>
                  <Shield color={hex(lord.color)} size="xs" />
                  <span
                    className={`hud-word min-w-0 flex-1 truncate text-hud-s leading-[1.1] ${self ? 'font-bold' : ''}`}
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
                  <span className="hud-figure text-hud-s w-10 shrink-0 text-right leading-[1.1]">
                    {m.game.percent(lord.share)}
                  </span>
                </span>
              </div>
            )
          })}
        </div>
      )}
    </Sheet>
  )
}
