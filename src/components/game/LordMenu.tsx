import { useEffect } from 'react'
import { ActMedallion, Shield } from '../hud/Emblem'
import { StandingBadge } from '../hud/Standing'
import { Figure } from '../hud/Figure'
import { Caption, Inline, Panel } from '../hud/Layout'
import { Name } from '../hud/Text'
import { useBeside } from '../hud/useBeside'
import { count, hex } from './format'
import { menuOf } from './lordMenu'
import { Piece } from './BarPiece'
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
 * The right click on another lord's land, beside the pointer: a small sheet,
 * his shield and his name and how he stands with me, then the acts as the
 * bar's pieces, each its medallion and its figure, its word in its hint
 * (« trop de texte, c'est un jeu », « mets des icônes pareil »). Attack, the men of the army
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
      <Panel className="pointer-events-auto">
        <Caption>
          <Shield color={hex(lord.color)} size="s" />
          <Name className="whitespace-nowrap">{name}</Name>
          {standingsOf(summary.lords[seat], m).map(({ standing, label }) => (
            <StandingBadge key={standing} standing={standing} label={label} />
          ))}
        </Caption>
        {/* The acts as the bar's pieces (« mets des icônes pareil pour le menu clic droit »): each its medallion and its figure, its word under the pointer. */}
        <div role="group" aria-label={m.menu.label(name)}>
          <Inline gap="part" align="start" justify="center">
            {menuOf(summary, aim).map((line) => {
              const { word, tone, figure } = told(line, m)
              return (
                <Piece
                  key={line.act}
                  k={null}
                  name={word}
                  hint={[]}
                  held={false}
                  onClick={() =>
                    line.act === 'alliance'
                      ? acts.alliance(line.say)
                      : acts[line.act]()
                  }
                  emblem={
                    <span className={tone}>
                      <ActMedallion {...LOOKS[line.act]} dim={!line.can} />
                    </span>
                  }
                  figure={figure}
                />
              )
            })}
          </Inline>
        </div>
      </Panel>
    </div>
  )
}
