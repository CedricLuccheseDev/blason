import type { Aim, Summary } from '~/render/client'

// What the right click's menu on another lord's land offers (LordMenu.tsx
// draws it): a short list of what may be done to him now, each line an act,
// what it would send or give, and whether it may be done now. To attack him
// with the army in hand, as a left click would, but an ally; the alliance,
// as it stands between us, none with a teammate; an offering, a share of my
// gold. On free land or
// on my own, no menu.

/** What the alliance's line does now: offer one, accept his, renew ours in its last moments, break it; nothing while my offer waits. */
export type AllianceSay = 'offer' | 'accept' | 'renew' | 'break' | 'asked'

/** A line of the menu, and whether it may be done now. */
export type MenuLine =
  | { act: 'attack'; men: number; can: boolean }
  | { act: 'alliance'; say: AllianceSay; can: boolean }
  | { act: 'offering'; gold: number; can: boolean }

/** What the menu reads of the summary: the army in hand and its men, the alliances, the offering. */
export type MenuSummary = Pick<
  Summary,
  'army' | 'armies' | 'allies' | 'offers' | 'asked' | 'offering'
>

/** What the alliance's line says to a lord: break ours, or renew it in its last moments until I asked; accept his offer; wait for mine; or offer one. */
export function allianceWith(summary: MenuSummary, seat: number): AllianceSay {
  const ally = summary.allies.find((a) => a.seat === seat)
  if (ally) return ally.closing && !ally.pressed ? 'renew' : 'break'
  if (summary.offers.some((o) => o.seat === seat)) return 'accept'
  if (summary.asked.includes(seat)) return 'asked'
  return 'offer'
}

/** The menu's lines on the land aimed at; none on land no lord holds. */
export function menuOf(
  summary: MenuSummary,
  aim: Pick<Aim, 'lord' | 'entry'>,
): Array<MenuLine> {
  const seat = aim.lord
  if (seat === null) return []
  const lines: Array<MenuLine> = []
  if (!summary.allies.some((a) => a.seat === seat)) {
    const men = summary.armies.find((a) => a.army === summary.army)?.men ?? 0
    lines.push({ act: 'attack', men, can: aim.entry !== null && men > 0 })
  }
  // A teammate's alliance is for good: nothing to offer, renew or break.
  if (!summary.allies.some((a) => a.seat === seat && a.team)) {
    const say = allianceWith(summary, seat)
    lines.push({ act: 'alliance', say, can: say !== 'asked' })
  }
  const gold = summary.offering
  lines.push({ act: 'offering', gold, can: gold > 0 })
  return lines
}
