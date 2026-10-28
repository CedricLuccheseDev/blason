import { useEffect, useState } from 'react'
import { useCompact } from '../hud/useCompact'
import { scaled } from '../hud/tokens'
import { COMPACT_INSET, INSET, placeOn, spread } from './edge'
import { PACT_SEAL, PactSeal } from './PactSeal'
import type { ReactNode } from 'react'
import type { Placed } from './edge'
import type {
  GameHandle,
  Herald,
  Heralds as Laid,
  Summary,
} from '~/render/client'

/**
 * The diplomacy on the map, as the board's direction A has it: the seal of
 * each of my alliances at the middle of its ribbon, which the render draws
 * between our capitals. The render says where each lies on the screen; one
 * out of view waits at its edge, an arrow towards it. Under the HUD's
 * corners, over the map; only what can be clicked takes the pointer.
 */
export function Heralds({
  game,
  summary,
}: Readonly<{ game: GameHandle; summary: Summary }>) {
  const [laid, setLaid] = useState<Laid | null>(null)
  const compact = useCompact()
  useEffect(() => game.heralds(setLaid), [game])
  const { me } = summary
  if (!laid || !me) return null
  // The HUD's corners grow with its scale, and so does the room kept clear of them.
  const k = hudScale()
  const drawn = compact ? COMPACT_INSET : INSET
  const inset = {
    top: drawn.top * k,
    right: drawn.right * k,
    bottom: drawn.bottom * k,
    left: drawn.left * k,
  }
  const { box } = PACT_SEAL[compact ? 'compact' : 'wide']
  const places = spread(
    laid.list.map((h) => placeOn(h, laid.width, laid.height, inset)),
    { x: 200 * k, y: (box + 40) * k },
  )

  function pieceOf(herald: Herald, placed: Placed): ReactNode {
    if (herald.kind !== 'pact' || !me) return null
    const ally = summary.allies.find((a) => a.seat === herald.lord)
    if (!ally) return null
    return (
      <At key={herald.key} placed={placed} lift={box / 2}>
        <PactSeal
          ally={ally}
          mine={me.color}
          toward={placed.toward}
          compact={compact}
          onRenew={(seat) => game.treat('ally', seat)}
        />
      </At>
    )
  }

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {laid.list.map((herald, i) => pieceOf(herald, places[i]))}
    </div>
  )
}

/** The HUD's scale (--hud, app.css): 1, or 1.2 on a desk's screen. */
function hudScale(): number {
  const k = Number.parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--hud'),
  )
  return Number.isFinite(k) && k > 0 ? k : 1
}

/** A piece set at its place, centred across it, its top `lift` pixels (as drawn) above it. */
function At({
  placed,
  lift,
  children,
}: Readonly<{ placed: Placed; lift: number; children: ReactNode }>) {
  return (
    <div
      className="absolute"
      style={{
        left: placed.x,
        top: placed.y,
        transform: `translate(-50%, calc(-1 * ${scaled(lift)}))`,
      }}
    >
      {children}
    </div>
  )
}
