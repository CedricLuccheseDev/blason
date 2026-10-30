import { Figure } from '../hud/Figure'
import { Inline } from '../hud/Layout'
import { Glyph } from './svg/marks'
import { ARMY_MARKS } from './Bar'
import { count, hex } from './format'
import type { Mark } from './svg/marks'
import type { Summary } from '~/render/client'
import { useMessages } from '~/i18n'

// Bottom right, my armies out (« en bas à droite mets les campagnes »): each
// as its banner on the map, in my colour, its army's mark on it and its men
// under it, the oldest first; a click brings the camera to it, and the
// pointer over it grows its standard on the map (« si on clique sur
// l'étendard en bas ça centre sur l'unité, et quand on hover ça la met en
// valeur »).

/** A banner on its pole, as the armies carry theirs on the map. */
function Banner({ color, mark }: Readonly<{ color: string; mark: Mark }>) {
  return (
    <svg viewBox="0 0 40 52" aria-hidden="true" className="h-12 w-9">
      <path d="M4 2 V50" stroke="var(--color-quill)" strokeWidth="2" />
      <path
        d="M5 4 H36 V30 L20.5 38 L5 30 Z"
        fill={color}
        stroke="var(--color-quill)"
        strokeWidth="1.6"
      />
      <Glyph
        name={mark}
        cx={20.5}
        cy={18}
        size={20}
        stroke="var(--color-vellum)"
        sw={1.6}
      />
    </svg>
  )
}

export function Campaign({
  summary,
  onSeek,
  onSpot,
}: Readonly<{
  summary: Summary
  /** The camera brought to an army, by the village or market it left from. */
  onSeek: (from: number) => void
  /** An army pointed at, grown on the map; none. */
  onSpot: (from: number | null) => void
}>) {
  const m = useMessages()
  const { me, campaign } = summary
  if (!me || campaign.length === 0) return null
  return (
    <div className="hud-afloat" title={m.game.campaign}>
      <Inline gap="part" align="start">
        {campaign.map((host) => (
          <button
            key={host.from}
            type="button"
            title={m.game.seek(m.game.armies[host.army])}
            aria-label={m.game.seek(m.game.armies[host.army])}
            onClick={() => onSeek(host.from)}
            onPointerEnter={() => onSpot(host.from)}
            onPointerLeave={() => onSpot(null)}
            className="hud-press pointer-events-auto flex cursor-pointer flex-col items-center"
          >
            <Banner color={hex(me.color)} mark={ARMY_MARKS[host.army]} />
            <Figure icon="soldier" size="s">
              {count(host.men)}
            </Figure>
          </button>
        ))}
      </Inline>
    </div>
  )
}
