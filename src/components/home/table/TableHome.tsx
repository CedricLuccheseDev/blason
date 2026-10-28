import { useEffect, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useLevel } from '../useLevel'
import { useTable } from './useTable'
import { useFocusFollows } from './useFocusFollows'
import { useSpectator } from './useSpectator'
import { useRoom } from './useRoom'
import { useChoice } from './useChoice'
import { useNow, useVariant, useWatch } from './useFrame'
import { ribbonOf } from './ribbon'
import { CardFace, DieAndBoard, Profile, Ribbon } from './Overlays'
import { BotsBack, OnlineBack, Stock } from './Backs'
import { PrivateBack } from './PrivateBack'
import { Journal } from './Journal'
import { TableFoot } from './TableFoot'
import type { Entry } from './Journal'
import type { Pick } from '~/table'
import { useMessages } from '~/i18n'
import { Act } from '~/components/hud/Act'
import { holdOnline } from '~/render/online'
import { MODES } from '~/table/modes'

/**
 * The home as a board game on a wooden table, in 3D (src/table): the board
 * in the middle, a game of bots on it; the box's lid for a title; the modes
 * as cards, their settings on their backs; the seal that plays; the die for
 * a mode at random; the journal; the player's pawn and card. Clicking the
 * board dives into its game, to watch it. The words are HTML laid on the
 * things (Overlays.tsx); the table decides nothing.
 */
export function TableHome({
  entries,
  onFail,
}: Readonly<{ entries: Array<Entry>; onFail: () => void }>) {
  const m = useMessages()
  const t = m.table
  const navigate = useNavigate()
  const frame = useRef<HTMLDivElement>(null)
  const overlay = useRef<HTMLDivElement>(null)
  const variant = useVariant()
  const [level, , setLevel] = useLevel()
  const pick = useRef<(p: Pick | null) => void>(() => {})
  const { handle, ready } = useTable(frame, overlay, variant, {
    pick: (p) => pick.current(p),
    fail: onFail,
  })
  const spectator = useSpectator()
  const [watching, watch, unwatch] = useWatch(handle, spectator.canvas !== null)
  const [room, rooms] = useRoom((online) => {
    holdOnline(online)
    void navigate({ to: '/play', search: { online: true } })
  })
  const choice = useChoice({ table: handle, ready, level, room, rooms, watch })
  pick.current = choice.act
  useFocusFollows(overlay, choice.open)
  const touch = {
    act: choice.act,
    focus: (p: Pick | null) => handle.current?.view({ focus: p }),
  }
  const now = useNow(room.status === 'seated')
  const ribbon = ribbonOf(t, m.home.levels, {
    mode: choice.mode,
    level,
    room,
    now,
  })

  // The board shows the bots' game once it is drawn.
  useEffect(() => {
    if (ready && spectator.canvas) handle.current?.show(spectator.canvas)
  }, [ready, spectator.canvas])

  // Escape puts down what is held up, or leaves the game watched.
  const escape = useRef(() => {})
  escape.current = () => {
    if (watching) unwatch()
    else if (choice.open !== null) choice.turn(null)
    else choice.setReading(false)
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') escape.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const desk = variant === 'desk'
  return (
    <main
      ref={frame}
      aria-label={t.label}
      className={`table-home h-dvh w-full select-none${ready ? ' ready' : ''}`}
    >
      <h1 className="sr-only">{t.name}</h1>
      <span className="setting">{t.setting}</span>
      <div ref={overlay} className="ov">
        {MODES.map((mode, i) => (
          <CardFace
            key={mode}
            mode={mode}
            i={i}
            open={choice.open === i}
            touch={touch}
          />
        ))}
        {MODES.map((mode, i) => (
          <div
            key={mode}
            className="ovi fade"
            data-ov={`back-${i}`}
            inert={choice.open !== i}
          >
            <Stock title={t.modes[mode].name} onTurn={() => choice.turn(null)}>
              {mode === 'bots' && <BotsBack level={level} onLevel={setLevel} />}
              {mode === 'online' && (
                <OnlineBack
                  room={room}
                  now={now}
                  onRetry={() => rooms.join(null)}
                />
              )}
              {mode === 'private' && (
                <PrivateBack room={room} actions={rooms} />
              )}
            </Stock>
          </div>
        ))}
        <Ribbon
          word={choice.sealed ? t.sealed : t.play}
          what={choice.sealed ? t.making : ribbon}
          touch={touch}
        />
        <DieAndBoard touch={touch} />
        {desk && <Profile />}
        {desk && (
          <Journal entries={entries} reading={choice.reading} touch={touch} />
        )}
      </div>
      <div
        ref={spectator.host}
        className={watching ? 'watch-host on' : 'watch-host'}
        aria-hidden={!watching}
      />
      {watching && (
        <div className="absolute top-4 left-4 z-[4500]">
          <Act tone="plain" onClick={unwatch}>
            {t.back}
          </Act>
        </div>
      )}
      <TableFoot />
    </main>
  )
}
