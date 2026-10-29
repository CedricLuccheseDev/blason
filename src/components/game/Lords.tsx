import { useEffect, useState } from 'react'
import { Act } from '../hud/Act'
import { Shield, StandingBadge } from '../hud/Emblem'
import { useCompact } from '../hud/useCompact'
import { Figure } from '../hud/Figure'
import { Inline, Panel } from '../hud/Layout'
import { Fine, Note } from '../hud/Text'
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
 * (« quand on hover highlight sur la map le territoire du seigneur »); a
 * click brings the camera to his land, a right click opens his menu. The
 * fallen leave it, so that it shortens as the game goes; it folds away at a
 * click.
 */
export function Lords({
  summary,
  aimed,
  onLight,
  onSeek,
  onMenu,
}: Readonly<{
  summary: Summary
  aimed: number | null
  /** A lord's line pointed at, his land to light on the map; none when the pointer leaves. */
  onLight: (lord: number | null) => void
  /** A lord's line right clicked: his menu, as a right click on his land, by the pointer. */
  onMenu: (lord: number, x: number, y: number) => void
  /** The camera brought to a lord's land. */
  onSeek: (lord: number) => void
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
    <Panel
      gap="hair"
      // Open on a phone, it stands where its shield was, top right, over
      // the map, never past the screen: its lines scroll within it.
      className={`w-full ${
        compact
          ? 'absolute top-0 right-0 z-30 max-h-[calc(100dvh-1.5rem)] w-72 overflow-y-auto'
          : ''
      }`}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="pointer-events-auto flex cursor-pointer items-center justify-between hud-press"
      >
        <Note>{m.lord.list}</Note>
        <Note
          className={`transition-transform duration-(--duration-hud-press) ease-hud ${open ? '' : '-rotate-90'}`}
        >
          ▾
        </Note>
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
              <button
                key={lord.seat}
                type="button"
                onPointerEnter={() => point(lord.seat)}
                onPointerLeave={() => point(null)}
                // A click brings the camera to his land, a right click opens his menu as on his land (« cliquer sur un seigneur dans la liste centre la cam au seigneur, clique droit ouvre le menu clique droit »).
                onClick={() => onSeek(lord.seat)}
                onContextMenu={(e) => {
                  e.preventDefault()
                  if (!self) onMenu(lord.seat, e.clientX, e.clientY)
                }}
                className={`pointer-events-auto relative flex w-full cursor-pointer items-center text-left border-l-[3px] ${lord.allied ? 'border-pact' : 'border-transparent'} ${ring}`}
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-y-px left-0 transition-[width] duration-(--duration-hud-enter) ease-hud motion-reduce:transition-none"
                  style={{
                    width: `${(100 * lord.land) / first}%`,
                    background: `color-mix(in srgb, ${hex(lord.color)} 30%, transparent)`,
                  }}
                />
                <Inline className="relative min-w-0 flex-1">
                  <span className="w-6 shrink-0 text-right opacity-60">
                    <Figure size="s">{rank}</Figure>
                  </span>
                  <Shield color={hex(lord.color)} size="xs" />
                  <Fine
                    className={`min-w-0 flex-1 truncate leading-[1.1] ${self ? 'font-bold' : ''}`}
                  >
                    {m.game.colors[lord.key]}
                    {self && <Note> ({m.lord.you})</Note>}
                  </Fine>
                  <Inline gap="hair" className="shrink-0 empty:hidden">
                    {standingsOf(lord, m).map((s) => (
                      <StandingBadge
                        key={s.standing}
                        standing={s.standing}
                        label={s.label}
                      />
                    ))}
                  </Inline>
                  <span className="w-12 shrink-0 text-right">
                    <Figure size="s">{m.game.percent(lord.share)}</Figure>
                  </span>
                </Inline>
              </button>
            )
          })}
        </div>
      )}
    </Panel>
  )
}
