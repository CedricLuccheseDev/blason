import { Act } from '../hud/Act'
import { RightClick, Shield, StandingBadge } from '../hud/Emblem'
import { Icon } from '../hud/Figure'
import { ICON } from '../hud/tokens'
import { hex } from './format'
import { standingsOf } from './standing'
import type { Tone } from '../hud/Act'
import type { Aim, Summary } from '~/render/client'
import type { Messages } from '~/i18n/en'
import { PLAYERS } from '~/render/palette'
import { useMessages } from '~/i18n'

// The right of the pointer's cartouche: a right click, the lord, and what
// binds the player to him, an alliance to offer, accept or break.

export type Pact = {
  label: string
  act: 'ally' | 'breakAlliance' | null
  tone: Tone
}

/** What binds the player to a lord, and what a right click would offer: alliance, acceptance (in green, as on the herald's letter), a break. */
export function pactWith(summary: Summary, seat: number, m: Messages): Pact {
  if (summary.allies.some((a) => a.seat === seat))
    return { label: m.pacts.break, act: 'breakAlliance', tone: 'gules' }
  if (summary.offers.some((o) => o.seat === seat))
    return { label: m.pacts.accept, act: 'ally', tone: 'pact' }
  if (summary.asked.includes(seat))
    return { label: m.pacts.asked, act: null, tone: 'gilt' }
  return { label: m.pacts.ally, act: 'ally', tone: 'gilt' }
}

/**
 * The lord and what binds us: faint beside the pointer with a mouse to say
 * a right click opens it, at full ink where the right click was made, its
 * button then live.
 */
export function PactHalf({
  aim,
  seat,
  summary,
  pact,
  onTreat,
}: Readonly<{
  aim: Aim
  seat: number
  summary: Summary
  pact: Pact
  onTreat: (type: 'ally' | 'breakAlliance', target: number) => void
}>) {
  const m = useMessages()
  const lord = PLAYERS[seat]
  const { act } = pact
  return (
    <div className={`flex flex-col gap-2 ${aim.pinned ? '' : 'opacity-40'}`}>
      <div className="flex items-center gap-2">
        {!aim.pinned && <RightClick />}
        <Shield color={hex(lord.color)} size="s" />
        <span className="hud-name whitespace-nowrap">
          {m.game.colors[lord.key]}
        </span>
        {standingsOf(summary.lords[seat], m).map(({ standing, label }) => (
          <StandingBadge key={standing} standing={standing} label={label} />
        ))}
      </div>
      {act ? (
        <Act
          tone={pact.tone}
          asleep={!aim.pinned}
          onClick={() => onTreat(act, seat)}
        >
          <Icon name="links" size={ICON.m} />
          {pact.label}
        </Act>
      ) : (
        <span className="hud-note">{pact.label}</span>
      )}
    </div>
  )
}
