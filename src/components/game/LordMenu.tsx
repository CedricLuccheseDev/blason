import { useEffect } from 'react'
import { ActMedallion, Shield, StandingBadge } from '../hud/Emblem'
import { Figure } from '../hud/Figure'
import { Sheet } from '../hud/Sheet'
import { useBeside } from '../hud/useBeside'
import { count, hex } from './format'
import { menuOf } from './lordMenu'
import { standingsOf } from './standing'
import type { AllianceSay, MenuLine } from './lordMenu'
import type { Mark } from './svg/marks'
import type { ReactNode, RefObject } from 'react'
import type { Aim, GameHandle, Summary } from '~/render/client'
import type { Messages } from '~/i18n/en'
import { PLAYERS } from '~/render/palette'
import { useMessages } from '~/i18n'

/** How far the pointer may go from the menu before it closes, in pixels. */
const FAR = 96

/** Each act's medallion: its mark, ringed in its colour (an attack gules, an alliance green, an offering gold). */
const LOOKS = {
  attack: { icon: 'sword', ring: 'var(--color-gules)' },
  alliance: { icon: 'links', ring: 'var(--color-pact)' },
  offering: { icon: 'market', ring: 'var(--color-gilt)' },
} as const satisfies Record<MenuLine['act'], { icon: Mark; ring: string }>

/** The alliance's word: in green to accept or renew it, in gules to break it. */
const SAY_TONE: Record<AllianceSay, string> = {
  offer: '',
  accept: 'text-pact',
  renew: 'text-pact',
  break: 'text-gules',
  asked: '',
}

// norm-ok: a thin line of the list, square, its ground shaded under the pointer; lifted and pressed as all the HUD touches.
const LINE =
  'hud-press pointer-events-auto flex min-h-8 w-full items-center gap-2 px-0.5 text-left hover:bg-shade/60 max-sm:min-h-11 short:min-h-11'

/** A line's word, its tone, and its figure. */
function told(
  line: MenuLine,
  m: Messages,
): { word: string; tone: string; figure: ReactNode } {
  if (line.act === 'attack')
    return {
      word: m.menu.attack,
      tone: '',
      figure: (
        <Figure icon="soldier" size="s">
          {count(line.men)}
        </Figure>
      ),
    }
  if (line.act === 'offering')
    return {
      word: m.menu.offering,
      tone: '',
      figure: (
        <Figure icon="coins" size="s">
          {count(line.gold)}
        </Figure>
      ),
    }
  return {
    word: m.menu.alliance[line.say],
    tone: SAY_TONE[line.say],
    figure: null,
  }
}

/** The menu is left when the pointer goes far from it; on a phone, where it stands above the bar, only a tap elsewhere closes it. */
function useFar(
  box: RefObject<HTMLElement | null>,
  onLeave: () => void,
  near: boolean,
) {
  useEffect(() => {
    if (!near) return
    const onMove = (e: PointerEvent) => {
      const r = box.current?.getBoundingClientRect()
      if (!r) return
      const dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right)
      const dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom)
      if (Math.hypot(dx, dy) > FAR) onLeave()
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [box, onLeave, near])
}

/**
 * The right click on another lord's land, as a short list beside the
 * pointer, as chosen on the maquette (« en liste courte »): a small sheet, his
 * shield and his name and how he stands with me, then a thin line for each
 * act, its medallion, its word and its figure. Attack, the men of the army
 * in hand, sent there as a left click would, but on an ally's land; the
 * alliance, its word what it does now, offer, accept, renew, or break in
 * gules, asleep while my offer waits; an offering, the gold it would give,
 * asleep with none. What cannot be done now is at half ink. A line done,
 * the menu closes; Escape, a click elsewhere on the map or the pointer gone
 * far close it too.
 */
export function LordMenu({
  aim,
  summary,
  floor,
  onAttack,
  onTreat,
  onLeave,
}: Readonly<{
  aim: Aim
  summary: Summary
  /** The HUD's bottom row, which the menu stays above. */
  floor: RefObject<HTMLElement | null>
  onAttack: GameHandle['attack']
  onTreat: GameHandle['treat']
  /** The pointer gone far from it. */
  onLeave: GameHandle['leave']
}>) {
  const m = useMessages()
  const { box, place, narrow } = useBeside(floor)
  useFar(box, onLeave, !narrow)
  const seat = aim.lord
  if (seat === null || !summary.me) return null
  const lord = PLAYERS[seat]
  const name = m.game.colors[lord.key]
  const acts = {
    attack: onAttack,
    alliance: (say: AllianceSay) =>
      onTreat(say === 'break' ? 'breakAlliance' : 'ally', seat),
    offering: () => onTreat('offering', seat),
  }
  return (
    <div
      ref={box}
      className="pointer-events-none absolute w-max"
      style={place(aim.x, aim.y, true, true)}
    >
      <Sheet className="pointer-events-auto flex min-w-40 flex-col px-2 py-1">
        <div className="mb-0.5 flex items-center gap-2 border-b border-gilt/60 px-0.5 pb-1">
          <Shield color={hex(lord.color)} size="xs" />
          <span className="hud-word text-hud-s whitespace-nowrap">{name}</span>
          {standingsOf(summary.lords[seat], m).map(({ standing, label }) => (
            <StandingBadge key={standing} standing={standing} label={label} />
          ))}
        </div>
        <div
          role="group"
          aria-label={m.menu.label(name)}
          className="flex flex-col"
        >
          {menuOf(summary, aim).map((line) => {
            const { word, tone, figure } = told(line, m)
            const asleep = !line.can
            return (
              <button
                key={line.act}
                type="button"
                onClick={() =>
                  line.act === 'alliance'
                    ? acts.alliance(line.say)
                    : acts[line.act]()
                }
                tabIndex={asleep ? -1 : undefined}
                aria-disabled={asleep || undefined}
                className={`${LINE} ${asleep ? 'pointer-events-none opacity-50' : ''}`}
              >
                <ActMedallion {...LOOKS[line.act]} />
                <span
                  className={`hud-word text-hud-s whitespace-nowrap ${tone}`}
                >
                  {word}
                </span>
                <span className="ml-auto pl-2 empty:hidden">{figure}</span>
              </button>
            )
          })}
        </div>
      </Sheet>
    </div>
  )
}
