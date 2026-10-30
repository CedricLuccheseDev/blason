import { useEffect, useState } from 'react'
import { useCompact } from '../hud/useCompact'
import { scaled } from '../hud/tokens'
import { COMPACT_INSET, INSET, placeOn, spread, within } from './edge'
import { PACT_SEAL, PactSeal } from './PactSeal'
import { HeraldLetter, OFFER } from './HeraldLetter'
import { POLE, Pennant } from './Pennant'
import type { ReactNode } from 'react'
import type { Placed } from './edge'
import type {
  GameHandle,
  Herald,
  Heralds as Laid,
  Summary,
} from '~/render/client'

/** Pixels between my ally's name and marks and the seal laid beside them, as drawn at the HUD's scale 1. */
const GAP = 6

/**
 * The diplomacy on the map, as the board's direction A has it: the seal of
 * each of my alliances in its last moments, when it asks to be renewed,
 * beside my ally's name, past his figure and his marks; the herald's letter
 * of each offer made to me, on my land nearest the lord who sends it, until
 * it is answered or refused; the news where it happened, a pennant planted
 * there a few seconds. The render says where each lies on the screen; one
 * out of view waits at its edge, an arrow towards it. Under the HUD's
 * corners, over the map; only what can be clicked takes the pointer.
 */
export function Heralds({
  game,
  summary,
}: Readonly<{ game: GameHandle; summary: Summary }>) {
  const [laid, setLaid] = useState<Laid | null>(null)
  // The offers refused, by the lord who made them, until they lapse.
  const [refused, setRefused] = useState<ReadonlySet<number>>(new Set())
  const compact = useCompact()
  useEffect(() => game.heralds(setLaid), [game])
  const standing = summary.offers.map((o) => o.seat).join()
  useEffect(() => {
    const seats = new Set(standing.split(',').map(Number))
    setRefused((now) => new Set([...now].filter((seat) => seats.has(seat))))
  }, [standing])
  const { me } = summary
  if (!laid || !me) return null
  // The HUD's corners grow with its scale, and so does the room kept clear of them.
  const k = hudScale()
  const drawn = compact ? COMPACT_INSET : INSET
  const inset = within(
    {
      top: drawn.top * k,
      right: drawn.right * k,
      bottom: drawn.bottom * k,
      left: drawn.left * k,
    },
    laid.width,
    laid.height,
  )
  const { box } = PACT_SEAL[compact ? 'compact' : 'wide']
  // A seal lies past the end of my ally's name and marks, which the render
  // gives, and stays past it when kept from the top or the bottom of the
  // screen: his words all lie on the left of it. The rest where the render
  // says.
  function placeOf(h: Herald): Placed {
    if (!laid) return { ...h, toward: null }
    if (h.kind !== 'pact') return placeOn(h, laid.width, laid.height, inset)
    const at = { x: h.x + (GAP + box / 2) * k, y: h.y }
    const placed = placeOn(at, laid.width, laid.height, inset)
    const kept = placed.side === 'top' || placed.side === 'bottom'
    return kept ? { ...placed, x: Math.max(placed.x, at.x) } : placed
  }
  // Pushed apart, the tallest of them a letter, then kept within the room
  // clear of the HUD.
  const places = spread(laid.list.map(placeOf), {
    x: 200 * k,
    y: (OFFER.h + 20) * k,
  }).map((p) => ({
    ...p,
    x: Math.min(Math.max(p.x, inset.left), laid.width - inset.right),
  }))

  function sealOf(herald: Herald, placed: Placed): ReactNode {
    const ally = summary.allies.find((a) => a.seat === herald.lord)
    if (!ally?.closing || !me) return null
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

  function letterOf(herald: Herald, placed: Placed): ReactNode {
    const offer = summary.offers.find((o) => o.seat === herald.lord)
    if (!offer || !me || refused.has(offer.seat)) return null
    const refuse = () => setRefused((now) => new Set(now).add(offer.seat))
    return (
      <At key={herald.key} placed={placed} lift={OFFER.h / 2}>
        <HeraldLetter
          offer={offer}
          mine={me.color}
          toward={placed.toward}
          room={{ left: placed.x, right: laid ? laid.width - placed.x : 0 }}
          onSeal={() => {
            game.treat('ally', offer.seat)
            refuse()
          }}
          onRefuse={refuse}
        />
      </At>
    )
  }

  function noteOf(herald: Herald, placed: Placed): ReactNode {
    const { news } = herald
    if (!news || news.kind === 'betrayed') return null
    return (
      <At key={herald.key} placed={placed} lift={POLE.h} by={POLE.x}>
        <Pennant news={news} />
      </At>
    )
  }

  const PIECES = { pact: sealOf, offer: letterOf, note: noteOf }

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {laid.list.map((herald, i) => PIECES[herald.kind](herald, places[i]))}
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

/** A piece set at its place: its top `lift` pixels (as drawn) above it, and centred across it, or its left `by` pixels before it. */
function At({
  placed,
  lift,
  by,
  children,
}: Readonly<{
  placed: Placed
  lift: number
  by?: number
  children: ReactNode
}>) {
  const across = by === undefined ? '-50%' : `calc(-1 * ${scaled(by)})`
  return (
    <div
      className="absolute has-[[data-open]]:z-10"
      style={{
        left: placed.x,
        top: placed.y,
        transform: `translate(${across}, calc(-1 * ${scaled(lift)}))`,
      }}
    >
      {children}
    </div>
  )
}
