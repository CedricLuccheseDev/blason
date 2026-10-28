import { useEffect, useRef, useState } from 'react'
import { RoomTrouble, Seats } from './Backs'
import type { KeyboardEvent } from 'react'
import type { Room, RoomActions } from './useRoom'
import { useMessages } from '~/i18n'

// The private game's back: create a room and give its code, or type the
// code a friend gave (five letters or figures, the relay's); once in the
// room, who sits, and for the host the way to start.

const LENGTH = 5
const sign = (s: string) =>
  s
    .replace(/[^a-z0-9]/gi, '')
    .slice(-1)
    .toUpperCase()

export function PrivateBack({
  room,
  actions,
}: Readonly<{ room: Room; actions: RoomActions }>) {
  const t = useMessages().table.privateRoom
  const inside = room.status === 'seated' && !room.lobby.open
  const [typed, setTyped] = useState<Array<string>>(Array(LENGTH).fill(''))
  const boxes = useRef<Array<HTMLInputElement | null>>([])
  const code = inside ? room.lobby.room.split('') : typed

  // The code typed whole: the room is joined.
  useEffect(() => {
    if (typed.every(Boolean)) actions.join(typed.join(''))
  }, [typed.join('')])

  const type = (i: number, value: string) => {
    const s = sign(value)
    setTyped((now) => now.map((c, k) => (k === i ? s : c)))
    if (s) boxes.current[i + 1]?.focus()
  }
  const back = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !typed[i]) boxes.current[i - 1]?.focus()
  }
  const create = () => {
    setTyped(Array(LENGTH).fill(''))
    actions.join('new')
  }

  return (
    <div className="private">
      {!inside && (
        <>
          <button type="button" className="make" onClick={create}>
            {t.create}
          </button>
          <div className="or">{t.or}</div>
        </>
      )}
      <div className={inside ? 'code made' : 'code'}>
        {code.map((c, i) => (
          <input
            key={i}
            ref={(el) => {
              boxes.current[i] = el
            }}
            value={c}
            readOnly={inside}
            maxLength={2}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            aria-label={t.char(i + 1)}
            onChange={(e) => type(i, e.target.value)}
            onKeyDown={(e) => back(i, e)}
          />
        ))}
      </div>
      <Inside room={room} actions={actions} />
    </div>
  )
}

function Inside({
  room,
  actions,
}: Readonly<{ room: Room; actions: RoomActions }>) {
  const t = useMessages().table.privateRoom
  if (room.status === 'off') return <p className="code-note">{t.note}</p>
  if (room.status !== 'seated' || room.lobby.open)
    return <RoomTrouble room={room} onRetry={actions.leave} />
  const host = room.seat === room.lobby.host
  return (
    <>
      <p className="code-note" aria-live="polite">
        {host ? t.yours : t.joined}
      </p>
      <Seats taken={room.lobby.names.length} />
      {host ? (
        <button type="button" className="make" onClick={actions.start}>
          {t.start}
        </button>
      ) : (
        <p className="code-note">{t.waitHost}</p>
      )}
    </>
  )
}
