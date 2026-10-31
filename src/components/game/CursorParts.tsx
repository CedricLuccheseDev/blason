import { ActMedallion, SealEmblem, WorkEmblem } from '../hud/Emblem'
import { Figure } from '../hud/Figure'
import { Inline } from '../hud/Layout'
import { Note } from '../hud/Text'
import { useCompact } from '../hud/useCompact'
import { count } from './format'
import { GOLD } from './BarGroups'
import type { ReactNode } from 'react'
import type { Aim, Summary } from '~/render/client'
import { useMessages } from '~/i18n'

// The cartouche's small pieces (Cursor.tsx): the mice, what is struck
// through, and what a right click opens, a lord's menu or the place's.

/** A mouse, the button a click is made with in gold: what the cartouche's half answers to (« au lieu d'écrire clic droit, clic gauche, mets des icônes de souris »). */
export function Mouse({ button }: Readonly<{ button: 'left' | 'right' }>) {
  const lit =
    button === 'left'
      ? 'M12 3 V11 H5.5 V9 Q5.5 3 12 3 Z'
      : 'M12 3 V11 H18.5 V9 Q18.5 3 12 3 Z'
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-7 shrink-0">
      <path
        d="M5.5 9 Q5.5 3 12 3 Q18.5 3 18.5 9 V15 Q18.5 21 12 21 Q5.5 21 5.5 15 Z"
        fill="var(--color-vellum)"
        stroke="var(--color-quill)"
        strokeWidth="1.5"
      />
      <path
        d={lit}
        fill="var(--color-gilt)"
        stroke="var(--color-quill)"
        strokeWidth="1.2"
      />
      <path
        d="M12 3 V11 M5.5 11 H18.5"
        stroke="var(--color-quill)"
        strokeWidth="1.2"
        fill="none"
      />
    </svg>
  )
}

/** What cannot be had now, struck through in gules. */
export function Struck({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <span className="relative inline-flex">
      {children}
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full"
      >
        <path
          d="M4 20 L20 4"
          stroke="var(--color-gules)"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </span>
  )
}

/** Over another lord's land, greyed until it is pressed: what a right click opens there, his menu (a long press on a phone). */
export function MenuHint() {
  const m = useMessages()
  const compact = useCompact()
  if (compact) return <Note>{m.menu.hintTouch}</Note>
  return (
    <div className="opacity-50" title={m.menu.options}>
      <Inline gap="hair">
        <ActMedallion icon="links" ring="var(--color-pact)" />
        <ActMedallion icon="market" ring="var(--color-gilt)" />
      </Inline>
    </div>
  )
}

/** Over my land or the water a port of mine reaches, greyed until it is pressed: what a right click opens there, the works that may stand on the tile, or a warship. */
export function PlaceHint({ aim }: Readonly<{ aim: Aim }>) {
  const m = useMessages()
  const compact = useCompact()
  if (compact) return null
  return (
    <div className="opacity-50" title={aim.sea ? m.game.warship : m.menu.build}>
      <Inline gap="hair">
        {aim.works.map((work) => (
          <WorkEmblem key={work} icon={work} size="xs" />
        ))}
        {aim.sea && <SealEmblem icon="warship" color={GOLD} size="xs" />}
      </Inline>
    </div>
  )
}

/** With a warship in hand over the water a port of mine reaches: the warship, its price, what a click fits out. */
export function FleetHalf({ summary }: Readonly<{ summary: Summary }>) {
  const { price, can } = summary.fleet
  return (
    <Inline>
      <SealEmblem icon="warship" color={GOLD} size="xs" />
      <Figure icon="coins" size="m" tone={can ? 'info' : 'loss'}>
        {count(price)}
      </Figure>
    </Inline>
  )
}
