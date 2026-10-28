import { useEffect, useRef, useState } from 'react'
import { RoomTrouble, Seats } from './Seats'
import type { KeyboardEvent } from 'react'
import type { Room, RoomActions } from './useRoom'
import { Act } from '~/components/hud/Act'
import { useMessages } from '~/i18n'

// A private room, from either side: the host's, made as the sheet opens, its
// code given to share; or a friend's, the code typed (five letters or
// figures, the relay's), the room joined once it is whole. Inside, who sits,
// and for the host the way to start.

const LENGTH = 5
const sign = (s: string) =>
  s
    .replace(/[^a-z0-9]/gi, '')
    .slice(-1)
    .toUpperCase()

// norm-ok: the letters of the code are form controls, on the HUD's plate.
const BOX =
  'hud-figure aspect-[4/5] w-full min-w-0 rounded-md border-[1.5px] border-quill bg-vellum p-0 text-center text-hud-xl uppercase caret-gilt-deep read-only:bg-shade focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gilt-deep'

export function PrivateRoom({
  way,
  room,
  actions,
}: Readonly<{ way: 'create' | 'join'; room: Room; actions: RoomActions }>) {
  const t = useMessages().home.privateRoom
  const inside = room.status === 'seated' && !room.lobby.open
  const [typed, setTyped] = useState<Array<string>>(Array(LENGTH).fill(''))
  const boxes = useRef<Array<HTMLInputElement | null>>([])
  const shown = inside ? room.lobby.room.split('') : typed

  // The host's room is made as the sheet opens; a friend types (Dialog.tsx gives him the first box).
  useEffect(() => {
    if (way === 'create') actions.join('new')
  }, [way])

  // The code typed whole: the room is joined.
  const whole = typed.join('')
  useEffect(() => {
    if (way === 'join' && whole.length === LENGTH) actions.join(whole)
  }, [whole])

  const type = (i: number, value: string) => {
    const s = sign(value)
    setTyped((now) => now.map((c, k) => (k === i ? s : c)))
    if (s) boxes.current[i + 1]?.focus()
  }
  const back = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !typed[i]) boxes.current[i - 1]?.focus()
  }

  return (
    <>
      {(way === 'join' || inside) && (
        <fieldset className="flex flex-col gap-2">
          <legend className="hud-note mb-2">{t.code}</legend>
          <div className="grid grid-cols-5 gap-2">
            {shown.map((c, i) => (
              <input
                key={i}
                ref={(el) => {
                  boxes.current[i] = el
                }}
                value={c}
                readOnly={inside || way === 'create'}
                maxLength={2}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                aria-label={t.char(i + 1)}
                data-first={i === 0 && way === 'join' ? true : undefined}
                onChange={(e) => type(i, e.target.value)}
                onKeyDown={(e) => back(i, e)}
                className={BOX}
              />
            ))}
          </div>
        </fieldset>
      )}
      <Inside way={way} room={room} actions={actions} />
    </>
  )
}

function Inside({
  way,
  room,
  actions,
}: Readonly<{ way: 'create' | 'join'; room: Room; actions: RoomActions }>) {
  const t = useMessages().home
  const p = t.privateRoom
  if (room.status === 'off') return <p className="hud-note">{p.note}</p>
  if (room.status !== 'seated' || room.lobby.open)
    return (
      <div className="flex flex-col gap-3" aria-live="polite">
        <RoomTrouble room={room} />
        {room.status === 'error' && way === 'create' && (
          <div className="grid">
            <Act tone="plain" onClick={() => actions.join('new')}>
              {t.room.retry}
            </Act>
          </div>
        )}
      </div>
    )
  const host = room.seat === room.lobby.host
  return (
    <div className="flex flex-col gap-3">
      <p className="hud-word" aria-live="polite">
        {host ? p.yours : p.joined}
      </p>
      <Seats taken={room.lobby.names.length} />
      {host ? (
        <div className="grid">
          <Act onClick={actions.start}>
            <span className="text-hud-l">{p.start}</span>
          </Act>
        </div>
      ) : (
        <p className="hud-note">{p.waitHost}</p>
      )}
    </div>
  )
}
