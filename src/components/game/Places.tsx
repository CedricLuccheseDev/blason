import { Sheet } from '../hud/Sheet'
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
    <div className="pointer-events-none absolute inset-0 grid grid-cols-[1fr_minmax(0,auto)_1fr] grid-rows-[auto_1fr_auto] gap-4 p-7 max-sm:gap-2 max-sm:p-3 short:gap-2 short:p-3">
      <div className="flex items-center gap-2">
        <Sheet className="flex h-11 items-center px-3">
          <HomeMark onHome={onHome} />
        </Sheet>
        {onBook && (
          <span className="pointer-events-auto">
            <BookButton onOpen={onBook} />
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-col items-center gap-2">
        {!waiting && <Race summary={summary} />}
        {!waiting && <Moment summary={summary} online={online} />}
        {cry && <Banner key={cry.id} felon={cry.felon} victim={cry.victim} />}
      </div>
      <div className="w-80 justify-self-end max-sm:w-auto">
        {!waiting && (
          <Lords
            summary={summary}
            aimed={aimed}
            onLight={game.light}
            onMenu={game.menu}
          />
        )}
      </div>
      <div
        ref={floor}
        className="relative col-span-3 row-start-3 grid grid-cols-[1fr_minmax(0,auto)_1fr] items-center gap-4 max-sm:gap-2"
      >
        <div className="min-w-0">{!waiting && <Purse summary={summary} />}</div>
        <div className="min-w-0">
          {!waiting && (
            <Bar
              summary={summary}
              onArmy={game.choose}
              onWork={game.hold}
              onCoup={game.aim}
            />
          )}
        </div>
        <div className="justify-self-end">
          {!waiting && <Campaign summary={summary} onRecall={game.recall} />}
        </div>
      </div>
    </div>
  )
}
