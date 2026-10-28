import { useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import type { RefObject } from 'react'
import type { Pick, TableHandle } from '~/table'
import type { Level } from '../../../../engine'
import type { Room, RoomActions } from './useRoom'
import { MODES } from '~/table/modes'
import { chance } from '~/table/chance'

// What the player does at the table, and what it means for the game: a card
// turned (one at a time, its settings on its back; the public room's card
// sits him at that room while it stays turned), the journal raised, the die
// rolled for a mode, the board to watch, and the seal, which plays the card
// turned (the bots' if none is): a game against the bots, a seat at the
// public room, a private room started by its host.

const still = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Whether the public room is the one sat at, or being joined. */
const atPublic = (room: Room) =>
  (room.status === 'seated' && room.lobby.open) ||
  (room.status === 'joining' && room.code === null)

type Needs = {
  table: RefObject<TableHandle | null>
  ready: boolean
  level: Level
  room: Room
  rooms: RoomActions
  watch: () => void
}

export function useChoice({ table, ready, level, room, rooms, watch }: Needs) {
  const navigate = useNavigate()
  const [open, setOpenNow] = useState<number | null>(null)
  const [reading, setReading] = useState(false)
  const [sealed, setSealed] = useState(false)
  const rolling = useRef(false)

  useEffect(
    () => table.current?.view({ open, reading }),
    [open, reading, ready],
  )

  const turn = (i: number | null) => {
    setOpenNow(i)
    if (i !== null) setReading(false)
    if (i === 1 && !atPublic(room)) rooms.join(null)
    else if (i !== 1 && atPublic(room)) rooms.leave()
  }
  const mode = MODES[open ?? 0]

  const seal = () => {
    table.current?.press()
    if (mode === 'bots') {
      setSealed(true)
      const go = () => void navigate({ to: '/play', search: { level } })
      setTimeout(go, still() ? 0 : 450)
    } else if (mode === 'online') {
      // The public room is sat at while its card is turned: the seal sits again after a failure.
      if (room.status === 'error' || room.status === 'off') rooms.join(null)
    } else if (
      room.status === 'seated' &&
      !room.lobby.open &&
      room.seat === room.lobby.host
    )
      rooms.start()
    else turn(2)
  }

  const roll = () => {
    const handle = table.current
    if (!handle || rolling.current) return
    rolling.current = true
    const pick = Math.floor(chance() * MODES.length)
    void handle.roll(pick).then(() => {
      rolling.current = false
      turn(pick)
    })
  }

  const act = (p: Pick | null) => {
    if (!p) {
      if (open !== null) turn(null)
      setReading(false)
    } else if (p.kind === 'card') turn(open === p.i ? null : p.i)
    else if (p.kind === 'seal') seal()
    else if (p.kind === 'die') roll()
    else if (p.kind === 'board') watch()
    else {
      setReading(!reading)
      if (!reading && open !== null) turn(null)
    }
  }

  return { open, reading, mode, sealed, act, turn, setReading }
}
