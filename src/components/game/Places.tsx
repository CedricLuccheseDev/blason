import { GAP, Inline, MARGIN, Stack } from '../hud/Layout'
import { BookButton, HomeMark } from './BookParts'
import { Banner } from './Banner'
import { Bar } from './Bar'
import { Campaign } from './Campaign'
import { Moment } from './Moment'
import { Purse } from './Purse'
import { Race } from './Race'
import { Lords } from './Lords'
import type { RefObject } from 'react'
import type { GameHandle, Summary } from '~/render/client'

// The HUD's six places, one margin (« le HUD repensé », 29/10): the game's
// mark top left, the race top centre, the realms top right; me bottom left,
// every action bottom centre, my campaigns bottom right; all floating, no
// sheet under them (« mets ce que t'as mis en haut à gauche en bas à gauche,
// toutes les actions au milieu, en bas à droite les campagnes, en haut à
// droite les royaumes, en haut au centre le timer, en haut à gauche le logo
// du jeu »).

/** A betrayal cried under the race. */
type Cry = { id: number; felon: number; victim: number }

export function Places({
  summary,
  game,
  aimed,
  waiting,
  online,
  cry,
  floor,
  onHome,
  onBook,
}: Readonly<{
  summary: Summary
  game: GameHandle
  aimed: number | null
  /** A hosted game not launched yet: its pieces of play wait. */
  waiting: boolean
  online: boolean
  cry: Cry | null
  /** The bottom row: the cartouche keeps above it. */
  floor: RefObject<HTMLDivElement | null>
  onHome: () => void
  /** The book's button, for a hosted game. */
  onBook: (() => void) | null
}>) {
  return (
    <div
      className={`pointer-events-none absolute top-[env(safe-area-inset-top)] right-[env(safe-area-inset-right)] bottom-[env(safe-area-inset-bottom)] left-[env(safe-area-inset-left)] grid grid-cols-[1fr_minmax(0,auto)_1fr] grid-rows-[auto_1fr_auto] ${GAP.piece} ${MARGIN}`}
    >
      <Inline className="self-start">
        {/* Upright on a phone the race needs the top's width: the game's mark comes down to its initial (BookParts.tsx), the way home kept. */}
        <HomeMark onHome={onHome} />
        {onBook && (
          <span className="pointer-events-auto">
            <BookButton onOpen={onBook} />
          </span>
        )}
      </Inline>
      <Stack align="center" className="min-w-0">
        {!waiting && <Race summary={summary} />}
        {!waiting && <Moment summary={summary} online={online} />}
        {cry && <Banner key={cry.id} felon={cry.felon} victim={cry.victim} />}
      </Stack>
      <div className="relative w-64 justify-self-end max-sm:w-auto short:w-auto">
        {!waiting && (
          <Lords
            summary={summary}
            aimed={aimed}
            onLight={game.light}
            onMenu={game.menu}
            onSeek={game.seekLord}
          />
        )}
      </div>
      <div
        ref={floor}
        className={`relative col-span-3 row-start-3 grid grid-cols-[minmax(max-content,1fr)_minmax(0,auto)_minmax(max-content,1fr)] items-end ${GAP.piece} max-sm:grid-cols-2`}
      >
        <div className="min-w-0">
          {!waiting && <Purse summary={summary} onHome={game.home} />}
        </div>
        {/* Upright on a phone, the bar on a row of its own under the purse and the campaigns. */}
        <div className="min-w-0 max-sm:col-span-2 max-sm:row-start-2">
          {/* Nothing to raise nor build while the standards are planted (« n'affiche pas la bar du bas dans la phase de posage »). */}
          {!waiting && summary.opening === null && (
            <Bar
              summary={summary}
              onArmy={game.choose}
              onWork={game.hold}
              onCoup={game.aim}
              onFleet={game.fit}
            />
          )}
        </div>
        <div className="justify-self-end">
          {!waiting && (
            <Campaign summary={summary} onSeek={game.seek} onSpot={game.spot} />
          )}
        </div>
      </div>
    </div>
  )
}
