import { Glyph } from './svg/marks'
import { ARMY_MARKS } from './Bar'
import { count, hex } from './format'
import type { Mark } from './svg/marks'
import type { Summary } from '~/render/client'
import { useMessages } from '~/i18n'

// Bottom right, my armies out (« en bas à droite mets les campagnes »): each
// as its banner on the map, in my colour, its army's mark on it and its men
// under it, the oldest first; a click calls it home, a red cross over it
// under the pointer.

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
  onRecall,
}: Readonly<{
  summary: Summary
  /** An army called home, by the village or market it left from. */
  onRecall: (from: number) => void
}>) {
  const m = useMessages()
  const { me, campaign } = summary
  if (!me || campaign.length === 0) return null
  return (
    <div className="hud-afloat flex items-start gap-3" title={m.game.campaign}>
      <div className="flex items-start gap-3">
        {campaign.map((host) => (
          <button
            key={host.from}
            type="button"
            title={m.game.recall(m.game.armies[host.army])}
            aria-label={m.game.recall(m.game.armies[host.army])}
            onClick={() => onRecall(host.from)}
            className="group hud-press pointer-events-auto relative flex cursor-pointer flex-col items-center"
          >
            <Banner color={hex(me.color)} mark={ARMY_MARKS[host.army]} />
            <span className="hud-figure text-hud-s">{count(host.men)}</span>
            {/* Under the pointer, the cross that calls it home (« une croix pour les rappeler »). */}
            <span
              aria-hidden="true"
              className="absolute -top-1 -right-1 hidden size-5 items-center justify-center rounded-full border border-quill bg-gules font-figures text-hud-s leading-none text-wax group-hover:flex"
            >
              ×
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
