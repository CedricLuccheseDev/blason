import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { LEVELS, MAP_SIZES } from '../../../engine'
import { Choice } from './Choice'
import { useLevel } from './useLevel'
import type { MapSize } from '../../../engine'
import { Act } from '~/components/hud/Act'
import { useMessages } from '~/i18n'

// The solo game's settings, as OpenFront's single player: the land's size
// and the bots' level (kept for the next visit, useLevel.ts), then start.

const SIZES = Object.keys(MAP_SIZES) as Array<MapSize>

export function SoloSettings() {
  const m = useMessages().home
  const t = m.solo
  const navigate = useNavigate()
  const [level, , setLevel] = useLevel()
  const [size, setSize] = useState<MapSize>('standard')
  const [going, setGoing] = useState(false)

  const start = () => {
    setGoing(true)
    void navigate({
      to: '/play',
      search: size === 'standard' ? { level } : { level, size },
    })
  }

  return (
    <>
      <Choice
        legend={t.size}
        name="solo-size"
        value={size}
        onChange={setSize}
        options={SIZES.map((s) => ({
          value: s,
          word: t.sizes[s],
          line: t.sizeLines[s],
        }))}
      />
      <Choice
        legend={t.level}
        name="solo-level"
        value={level}
        onChange={setLevel}
        options={LEVELS.map((l) => ({
          value: l,
          word: m.levels[l],
          line: t.levelLines[l],
        }))}
      />
      <div className="grid">
        <Act asleep={going} onClick={start}>
          <span className="text-hud-l">{going ? t.making : t.start}</span>
        </Act>
      </div>
    </>
  )
}
