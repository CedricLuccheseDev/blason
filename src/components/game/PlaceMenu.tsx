import { SealEmblem, Shield, WorkEmblem } from '../hud/Emblem'
import { Caption, Inline, Panel } from '../hud/Layout'
import { Name } from '../hud/Text'
import { useBeside } from '../hud/useBeside'
import { hex } from './format'
import { Piece, Price } from './BarPiece'
import { useFar } from './LordMenu'
import { GOLD } from './BarGroups'
import type { Echo } from './BarGroups'
import type { RefObject } from 'react'
import type { Aim, GameHandle, Summary } from '~/render/client'
import { useMessages } from '~/i18n'

/**
 * The right click on my own land or on the water, beside the pointer, made
 * as a lord's menu is (LordMenu.tsx; « fais quelque chose d'homogene »): a
 * small sheet, my shield and what it is for, « Bâtir ici » or « En mer »,
 * then its pieces as the bar's, each its emblem and its price, its name and
 * what it does in the bar's own hint (« les même tooltip que quand on hover
 * dans la bar en bas »): the works that may stand on the tile, or a warship
 * to fit out for the water. The piece under the pointer lights its sister in
 * the bar (« si t'hover les boutons ça hover en bas aussi »), so that a new
 * player learns where it is. What cannot be paid is at half ink; a piece
 * taken builds there, or sends the warship, and the menu closes.
 */
export function PlaceMenu({
  aim,
  summary,
  floor,
  onBuild,
  onFitOut,
  onLeave,
  onEcho,
}: Readonly<{
  aim: Aim
  summary: Summary
  /** The HUD's bottom row, which the menu stays above. */
  floor: RefObject<HTMLElement | null>
  onBuild: GameHandle['build']
  onFitOut: GameHandle['fitOut']
  /** The pointer gone far from it. */
  onLeave: GameHandle['leave']
  /** The piece under the pointer, to light in the bar; none. */
  onEcho: (echo: Echo) => void
}>) {
  const m = useMessages()
  const { box, place, narrow } = useBeside(floor)
  useFar(box, onLeave, !narrow)
  const { me, fleet } = summary
  if (!me) return null
  const title = aim.sea ? m.menu.sea : m.menu.build
  return (
    <div
      ref={box}
      className="pointer-events-none absolute w-max"
      style={place(aim.x, aim.y, true, true)}
    >
      <Panel className="pointer-events-auto">
        <Caption>
          <Shield color={hex(me.color)} size="s" />
          <Name className="whitespace-nowrap">{title}</Name>
        </Caption>
        <div
          role="group"
          aria-label={title}
          onPointerLeave={() => onEcho(null)}
        >
          <Inline gap="part" align="start" justify="center">
            {aim.works.map((work) => {
              const w = summary.works.find((x) => x.work === work)
              if (!w) return null
              return (
                <span key={work} onPointerEnter={() => onEcho(work)}>
                  <Piece
                    k={null}
                    name={m.game.works[work]}
                    hint={[m.hints.works[work]]}
                    held={false}
                    short={!w.can}
                    onClick={() => w.can && onBuild(work)}
                    emblem={<WorkEmblem icon={work} size="s" dim={!w.can} />}
                    figure={<Price price={w.price} short={!w.can} />}
                  />
                </span>
              )
            })}
            {aim.sea && (
              <span onPointerEnter={() => onEcho('warship')}>
                <Piece
                  k={null}
                  name={m.game.warship}
                  hint={[m.hints.warship]}
                  held={false}
                  short={!fleet.can}
                  onClick={() => fleet.can && onFitOut()}
                  emblem={
                    <SealEmblem
                      icon="warship"
                      color={GOLD}
                      size="s"
                      dim={!fleet.can}
                    />
                  }
                  figure={<Price price={fleet.price} short={!fleet.can} />}
                />
              </span>
            )}
          </Inline>
        </div>
      </Panel>
    </div>
  )
}
