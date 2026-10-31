import { CoupEmblem, SealEmblem, WorkEmblem } from '../hud/Emblem'
import { Figure } from '../hud/Figure'
import { Word } from '../hud/Text'
import { count, hex } from './format'
import { Piece, Price } from './BarPiece'
import { ARMY_MARKS, ARMY_WAX, COUP_MARKS } from './seals'
import type { ReactNode } from 'react'
import type { Army, Coup, Work } from '../../../engine'
import type { Summary } from '~/render/client'
import type { useMessages } from '~/i18n'
import { FLEET_KEY, coupKey, keyAt, workKey } from '~/render/keys'

// The bar's three families, each its pieces and the face it folds behind
// when the bar lacks room (Bar.tsx): the armies, and the warship with them
// (« Navire de guerre a mettre dans armée »); the works; the coups.

/** The warship's wax: gold, as the mercenaries', an army paid in gold (« Le warship met un sceau en gold comme mercenaire ? »). */
const GOLD = 'var(--color-gilt)'

/** What the bar's pieces do when pressed. */
export type Acts = Readonly<{
  onArmy: (army: Army) => void
  onWork: (work: Work | null) => void
  onCoup: (coup: Coup | null) => void
  onFleet: (fleet: boolean) => void
}>

/** A family of the bar: its pieces, named or not, and its face, what is in hand of it raised. */
export type Family = Readonly<{
  label: string
  held: boolean
  face: ReactNode
  pieces: (named: boolean) => Array<ReactNode>
}>

type Messages = ReturnType<typeof useMessages>

/**
 * The armies: their seals, each with its figure under it as the works have
 * their price, the share of the peasants a levy takes, the gold the
 * mercenaries would cost (« affiche les % en dessous des chevauchées »); then
 * the warship, by its key B, its price doubling with each afloat. Folded, the
 * face is the one in hand, with its figure: what a click sends. The levies'
 * share by the purse's icon for the peasants it takes.
 */
export function armies(summary: Summary, m: Messages, acts: Acts): Family {
  const color = summary.me ? hex(summary.me.color) : 'var(--color-vellum)'
  const fleet = summary.fleet
  const army = (a: Summary['armies'][number], held: boolean) => (
    <SealEmblem
      icon={ARMY_MARKS[a.army]}
      color={ARMY_WAX[a.army] ?? (held ? color : 'var(--color-vellum)')}
      size="s"
      held={held}
      // An army that would take no man, at half ink: the mercenaries without the gold for one.
      dim={a.men === 0 && !held}
    />
  )
  const figure = (a: Summary['armies'][number], held: boolean) =>
    a.share === null ? (
      <Price price={a.gold ?? 0} short={a.men === 0 && !held} />
    ) : (
      <Figure icon="soldier" size="m">
        {m.game.percent(a.share)}
      </Figure>
    )
  const inHand = (a: Summary['armies'][number]) =>
    !summary.work && !summary.coup && !fleet.held && a.army === summary.army
  const chosen =
    summary.armies.find((a) => a.army === summary.army) ?? summary.armies[0]
  return {
    label: m.game.families.armies,
    held: !summary.work && !summary.coup,
    face: fleet.held ? (
      <>
        <SealEmblem icon="warship" color={GOLD} size="s" held />
        <Price price={fleet.price} short={false} />
      </>
    ) : (
      <>
        {army(chosen, inHand(chosen))}
        {figure(chosen, inHand(chosen))}
      </>
    ),
    pieces: (named) => [
      ...summary.armies.map((a, i) => {
        const held = inHand(a)
        return (
          <Piece
            key={a.army}
            k={keyAt(i + 1)}
            name={m.game.armies[a.army]}
            hint={[m.hints.armies.men(count(a.men)), m.hints.armies[a.army]]}
            held={held}
            named={named}
            // What cannot be had is not taken in hand, only refused (« tu peux cliquer sur les constructions qui sont disable c'est un bug »).
            onClick={() => (a.men > 0 || held) && acts.onArmy(a.army)}
            figure={figure(a, held)}
            emblem={army(a, held)}
            short={a.men === 0 && !held}
          />
        )
      }),
      <Piece
        key="warship"
        k={FLEET_KEY.toUpperCase()}
        name={m.game.warship}
        hint={[m.hints.warship]}
        held={fleet.held}
        named={named}
        onClick={() => (fleet.can || fleet.held) && acts.onFleet(!fleet.held)}
        emblem={
          <SealEmblem
            icon="warship"
            color={GOLD}
            size="s"
            held={fleet.held}
            dim={!fleet.can && !fleet.held}
          />
        }
        short={!fleet.can && !fleet.held}
        figure={<Price price={fleet.price} short={!fleet.can && !fleet.held} />}
      />,
    ],
  }
}

/** The works as gilt medallions, each with its price; folded, behind a castle's medallion and the family's word. */
export function works(summary: Summary, m: Messages, acts: Acts): Family {
  return {
    label: m.game.families.works,
    held: summary.work !== null,
    face: (
      <>
        <WorkEmblem icon="castle" size="s" held={summary.work !== null} />
        <Word>{m.game.families.works}</Word>
      </>
    ),
    pieces: (named) =>
      summary.works.map((w) => {
        const held = summary.work === w.work
        const short = !w.can && !held
        return (
          <Piece
            key={w.work}
            k={workKey(w.work).toUpperCase()}
            name={m.game.works[w.work]}
            hint={[m.hints.works[w.work]]}
            held={held}
            named={named}
            onClick={() => (w.can || held) && acts.onWork(held ? null : w.work)}
            emblem={
              <WorkEmblem icon={w.work} size="s" held={held} dim={short} />
            }
            short={short}
            figure={<Price price={w.price} short={short} />}
          />
        )
      }),
  }
}

/** The coups as lozenges ringed in gules, each with its price; folded, behind the trebuchet's lozenge and the family's word. */
export function coups(summary: Summary, m: Messages, acts: Acts): Family {
  return {
    label: m.game.families.coups,
    held: summary.coup !== null,
    face: (
      <>
        <CoupEmblem
          icon={COUP_MARKS.trebuchet}
          size="s"
          held={summary.coup !== null}
        />
        <Word>{m.game.families.coups}</Word>
      </>
    ),
    pieces: (named) =>
      summary.coups.map((c) => {
        const held = summary.coup === c.coup
        const short = !c.can && !held
        return (
          <Piece
            key={c.coup}
            k={coupKey(c.coup)}
            name={m.game.coups[c.coup]}
            hint={[m.hints.coups[c.coup]]}
            held={held}
            named={named}
            onClick={() => (c.can || held) && acts.onCoup(held ? null : c.coup)}
            emblem={
              <CoupEmblem
                icon={COUP_MARKS[c.coup]}
                size="s"
                held={held}
                dim={short}
              />
            }
            short={short}
            figure={<Price price={c.price} short={short} />}
          />
        )
      }),
  }
}
