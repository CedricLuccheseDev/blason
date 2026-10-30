import { Fragment } from 'react'
import { useFit } from '../hud/useFit'
import { GAP } from '../hud/Layout'
import { Note } from '../hud/Text'
import { Divide } from './BarPiece'
import { Drawer } from './BarDrawer'
import { armies, coups, works } from './BarGroups'
import type { Acts, Family } from './BarGroups'
import type { Summary } from '~/render/client'
import { useMessages } from '~/i18n'

/**
 * The bar's forms, from as drawn to the most compact, each tried in turn
 * until one fits its room (« si ya la place met tout en ligne sinon range en
 * partant de coup puis construction aussi et ensuite l'armée »): one row; one
 * row, its pieces closer; the coups folded in their drawer; the works too;
 * the armies too. How many families are folded, from the last.
 */
const FITS = [
  { folded: 0, close: false },
  { folded: 0, close: true },
  { folded: 1, close: true },
  { folded: 2, close: true },
  { folded: 3, close: true },
] as const

/**
 * At the bottom in the middle, every action, floating on the map with no
 * band under it (« essaie de mettre toutes les actions au milieu »): the
 * armies as wax seals, the three levied from the peasants at a village, the
 * mercenaries hired at a market in gold, and the warship; the works as gilt
 * medallions; the coups as lozenges ringed in gules; each with its figure,
 * a price in gules when it cannot be paid, then at half ink: half ink says
 * only that, never where the pointer is. Each family named over it, so that a
 * new player reads the bar at a glance, its last line the purse's and the
 * campaigns'; a piece's name is said under the pointer. Keys 1 to 4, B, 5 to 7, then 8, 9 and 0. It keeps
 * within the screen, its room measured: when it lacks it, its pieces come
 * closer, then its families fold, each behind one face (BarDrawer.tsx), the
 * coups first, then the works, then the armies.
 */
export function Bar({
  summary,
  ...acts
}: Readonly<{ summary: Summary } & Acts>) {
  const m = useMessages()
  const { room, piece, step } = useFit(FITS.length - 1)
  if (!summary.me) return null
  const { folded, close } = FITS[step]
  const gap = close ? GAP.hair : GAP.part
  const families: Array<Family> = [
    armies(summary, m, acts),
    works(summary, m, acts),
    coups(summary, m, acts),
  ]
  return (
    // The room is as wide as the layout lets the bar grow; the bar in it at its own width.
    <div ref={room} className="flex min-w-0 justify-center">
      <div ref={piece} className="w-max">
        <div className={`flex items-end ${folded === 3 ? GAP.part : ''}`}>
          {families.map((family, i) => {
            const fold = i >= families.length - folded
            const rule = i > 0 && folded < 3 && <Divide close={close} />
            return (
              <Fragment key={family.label}>
                {rule}
                {fold ? (
                  <Drawer
                    label={family.label}
                    held={family.held}
                    face={family.face}
                  >
                    {family.pieces(true)}
                  </Drawer>
                ) : (
                  <div
                    className={`hud-afloat flex flex-col items-center ${GAP.line}`}
                  >
                    <Note>{family.label}</Note>
                    <div className={`flex items-start ${gap}`}>
                      {family.pieces(false)}
                    </div>
                  </div>
                )}
              </Fragment>
            )
          })}
        </div>
      </div>
    </div>
  )
}
