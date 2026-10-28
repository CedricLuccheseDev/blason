import { LEVELS } from '../../../../engine'
import { SEATS } from '../../../../net/protocol'
import { clock, leftOf } from './useRoom'
import type { ReactNode } from 'react'
import type { Level } from '../../../../engine'
import type { Room } from './useRoom'
import { useMessages } from '~/i18n'
import { PLAYERS } from '~/render/palette'

// The backs of the cards, once turned: each mode's settings on the card's
// own stock. The bots' level; the public room live, its seats and its clock;
// a private room's code (PrivateBack.tsx).

/** A seat's colour, as CSS. */
export const seatColour = (seat: number) =>
  `#${PLAYERS[seat % PLAYERS.length].color.toString(16).padStart(6, '0')}`

/** The back's stock and its head: the title and the way to turn the card back. */
export function Stock({
  title,
  onTurn,
  children,
}: Readonly<{ title: string; onTurn: () => void; children: ReactNode }>) {
  const t = useMessages().table
  return (
    <div className="cb" data-own>
      <div className="stock">
        <div className="zoom">
          <div className="set">
            <div className="set-head">
              <h2 className="t">{title}</h2>
              <button
                type="button"
                className="turn"
                onClick={onTurn}
                aria-label={t.turnBack}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                >
                  <path
                    d="M3 6 A5.5 5.5 0 1 1 3.6 11"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M1.2 3.4 L3 6.4 L6.2 5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export function BotsBack({
  level,
  onLevel,
}: Readonly<{ level: Level; onLevel: (level: Level) => void }>) {
  const m = useMessages()
  const t = m.table
  return (
    <>
      <fieldset className="levels">
        <legend>{t.levelLegend}</legend>
        {LEVELS.map((l, i) => (
          <label key={l} className="lvl">
            <input
              type="radio"
              name="table-level"
              value={l}
              checked={l === level}
              onChange={() => onLevel(l)}
            />
            <span className="tok" aria-hidden="true">
              <i>
                {[0, 1, 2].map((k) => (
                  <b key={k} className={k <= i ? 'on' : ''} />
                ))}
              </i>
            </span>
            <span className="nm">{m.home.levels[l]}</span>
            <span className="ds">{t.levelLines[l]}</span>
          </label>
        ))}
      </fieldset>
      <p className="set-foot">{t.botsFoot}</p>
    </>
  )
}

/** The seats of a room, those taken in their lord's colour. */
export function Seats({ taken }: Readonly<{ taken: number }>) {
  const t = useMessages().table
  return (
    <>
      <div className="seats-line">
        <span>{t.room.seated}</span>
        <b>
          {taken} / {SEATS}
        </b>
      </div>
      <div className="seats" aria-hidden="true">
        {Array.from({ length: SEATS }, (_, i) => (
          <i
            key={i}
            className={i < taken ? 'in' : ''}
            style={{ ['--c' as string]: seatColour(i) }}
          />
        ))}
      </div>
    </>
  )
}

/** What a room that is not (or no longer) sat in says. */
export function RoomTrouble({
  room,
  onRetry,
}: Readonly<{ room: Room; onRetry: () => void }>) {
  const t = useMessages().table
  if (room.status === 'unavailable')
    return <p className="code-note">{t.room.unavailable}</p>
  if (room.status !== 'error')
    return <p className="code-note">{t.room.joining}</p>
  return (
    <>
      <p className="code-note" role="alert">
        {room.reason === 'lost' ? t.room.lost : t.room.errors[room.reason]}
      </p>
      <button type="button" className="make" onClick={onRetry}>
        {t.room.retry}
      </button>
    </>
  )
}

export function OnlineBack({
  room,
  now,
  onRetry,
}: Readonly<{ room: Room; now: number; onRetry: () => void }>) {
  const t = useMessages().table
  const left = leftOf(room, now)
  return (
    <>
      <div className="room-live" aria-live="polite">
        {room.status === 'seated' && room.lobby.open ? (
          <>
            <div className="count">
              <span className="lbl">{t.room.startsIn}</span>
              <span className="clock">{left === null ? '' : clock(left)}</span>
            </div>
            <Seats taken={room.lobby.names.length} />
          </>
        ) : (
          <RoomTrouble room={room} onRetry={onRetry} />
        )}
      </div>
      <p className="set-foot">{t.room.botsFill}</p>
    </>
  )
}
