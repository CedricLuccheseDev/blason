import { useEffect, useRef, useState } from 'react'
import { readSetup } from '../../../engine'
import type { Link } from '~/render/link'
import type { Online } from '~/render/online'
import type { FromRelay, Lobby } from '../../../net/protocol'
import { connect, relayUrl } from '~/render/link'

// A seat at the relay (server/rooms.ts), from the home: in the public game
// in its opening, straight away; or in a private room, by its code or a new
// one, told live (who sits) until its host starts it. When the relay says
// the game begins, the line is handed over, open, to whoever plays it. One
// at a time: joining another, or leaving, closes the line.

export type Room =
  | { status: 'off' }
  | { status: 'unavailable' }
  | { status: 'joining'; code: string | null }
  /** In a private room, waiting for its host. */
  | { status: 'seated'; seat: number; lobby: Lobby }
  | {
      status: 'error'
      /** What failed: the public game (null), or a room's code or 'new'. */
      code: string | null
      reason: 'full' | 'unknown' | 'started' | 'lost'
    }

export type RoomActions = {
  /** Joins the public game (null), a private room by its code, or a new one ('new'). */
  join: (code: string | null) => void
  leave: () => void
  /** The host starts the game now. */
  start: () => void
}

export function useRoom(
  onBegin: (online: Online) => void,
): [Room, RoomActions] {
  const [room, setRoom] = useState<Room>({ status: 'off' })
  const line = useRef<Link | null>(null)
  const begun = useRef(onBegin)
  begun.current = onBegin
  // Every line opened gets a number: what a closed one says is not heard.
  const opened = useRef(0)

  const leave = () => {
    opened.current += 1
    line.current?.close()
    line.current = null
    setRoom({ status: 'off' })
  }

  const join = (code: string | null) => {
    leave()
    const url = relayUrl()
    if (!url) {
      setRoom({ status: 'unavailable' })
      return
    }
    const mine = opened.current
    setRoom({ status: 'joining', code })
    connect(url)
      .then((link) => {
        if (mine !== opened.current) return link.close()
        line.current = link
        const stop = link.listen((message: FromRelay) => {
          if (mine !== opened.current) return
          if (message.t === 'lobby')
            setRoom({
              status: 'seated',
              seat: message.seat,
              lobby: message.lobby,
            })
          else if (message.t === 'error')
            setRoom({ status: 'error', code, reason: message.reason })
          else if (message.t === 'begin') {
            // From here the turns wait for the game: no one here listens any more.
            stop()
            line.current = null
            // A setup this browser cannot read is a relay of another version.
            const setup = readSetup(message.setup)
            if (!setup) {
              link.close()
              setRoom({ status: 'error', code, reason: 'lost' })
            } else begun.current({ link, seat: message.seat, setup })
          }
        })
        link.send({ t: 'join', room: code, name: '' })
      })
      .catch(() => {
        if (mine === opened.current)
          setRoom({ status: 'error', code, reason: 'lost' })
      })
  }

  const start = () => line.current?.send({ t: 'start' })

  // Leaving the home leaves the room, unless the game began.
  useEffect(
    () => () => {
      opened.current += 1
      line.current?.close()
    },
    [],
  )

  return [room, { join, leave, start }]
}

/** Whether the public game is the one being joined, or that failed. */
export const atPublic = (room: Room): boolean =>
  (room.status === 'joining' || room.status === 'error') && room.code === null

/** Whether a private room is the one sat at, being joined, or that failed. */
export const atPrivate = (room: Room): boolean =>
  room.status === 'seated' ||
  ((room.status === 'joining' || room.status === 'error') && room.code !== null)
