import { Glyph } from './svg/marks'
import { ARMY_MARKS } from './Bar'
import { count, hex } from './format'
import type { Mark } from './svg/marks'
import type { Summary } from '~/render/client'
import { useMessages } from '~/i18n'

// Bottom right, my armies out (« en bas à droite mets les campagnes »): each
// as its banner on the map, in my colour, its army's mark on it and its men
// under it, the oldest first.

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

export function Campaign({ summary }: Readonly<{ summary: Summary }>) {
  const m = useMessages()
  const { me, campaign } = summary
  if (!me || campaign.length === 0) return null
  return (
    <div className="hud-afloat flex flex-col items-end gap-1">
      <span className="font-caps text-hud-s text-quill">{m.game.campaign}</span>
      <div className="flex items-end gap-3">
        {campaign.map((host, i) => (
          <div
            key={i}
            title={m.game.armies[host.army]}
            className="flex flex-col items-center"
          >
            <Banner color={hex(me.color)} mark={ARMY_MARKS[host.army]} />
            <span className="hud-figure text-hud-s">{count(host.men)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
