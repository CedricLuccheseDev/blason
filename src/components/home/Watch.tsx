import { useEffect, useState } from 'react'
import { Figure } from '../hud/Figure'
import { Act } from '../hud/Act'
import { Line, Stack } from '../hud/Layout'
import { Fine, Heading, Name, Note } from '../hud/Text'
import { adminUrl } from '~/render/link'

// What the relay holds, as a watcher reads it (server/watch.ts): the
// process's weight, then each room, public or private, its land, its turn,
// its age, its seats and who sits them, whether he still answers. Its key
// asked once and kept in the browser. For the team, not the players: its
// words are not translated.

type Census = {
  at: number
  uptime: number
  heapMb: number
  rssMb: number
  rooms: Array<{
    code: string
    public: boolean
    started: boolean
    turn: number
    ageS: number
    land: string
    seated: number
    bots: number
    players: Array<{ seat: number; name: string; answers: boolean }>
  }>
}

/** Its words, for the team alone: English, not translated. */
const WORDS = {
  key: 'Relay key',
  watch: 'Watch',
  silent: 'The relay does not answer, or the key is wrong.',
  another: 'Another key',
  reading: 'Reading the relay…',
  rooms: 'Rooms',
  players: 'Players connected',
  up: 'Relay up',
  memory: 'Memory (heap / process)',
  failed: 'Last reading failed.',
}

const KEY = 'blason-admin-key'
const EVERY_MS = 2000

const readKey = () => {
  try {
    return localStorage.getItem(KEY) ?? ''
  } catch {
    return ''
  }
}

const time = (s: number) =>
  `${Math.floor(s / 3600)}h${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}`

export function Watch() {
  const [key, setKey] = useState(readKey)
  const [typed, setTyped] = useState('')
  const [census, setCensus] = useState<Census | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!key) return
    let live = true
    const read = async () => {
      const url = adminUrl(key)
      if (!url) return setFailed(true)
      try {
        const answer = await fetch(url, { cache: 'no-store' })
        if (!live) return
        if (!answer.ok) return setFailed(true)
        setCensus((await answer.json()) as Census)
        setFailed(false)
      } catch {
        if (live) setFailed(true)
      }
    }
    void read()
    const timer = setInterval(() => void read(), EVERY_MS)
    return () => {
      live = false
      clearInterval(timer)
    }
  }, [key])

  if (!key)
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault()
          try {
            localStorage.setItem(KEY, typed)
          } catch {
            // Kept for this visit only.
          }
          setKey(typed)
        }}
      >
        <Stack>
          <label>
            <Stack gap="hair">
              <Note>{WORDS.key}</Note>
              <input
                type="password"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                className="hud-word border-[1.5px] border-quill bg-vellum text-quill"
              />
            </Stack>
          </label>
          <Act onClick={() => setKey(typed)}>{WORDS.watch}</Act>
        </Stack>
      </form>
    )

  if (failed && !census)
    return (
      <Stack>
        <Note>{WORDS.silent}</Note>
        <Act tone="plain" onClick={() => setKey('')}>
          Another key
        </Act>
      </Stack>
    )
  if (!census) return <Note>{WORDS.reading}</Note>

  const players = census.rooms.reduce((n, r) => n + r.seated, 0)
  return (
    <Stack gap="piece">
      <Stack gap="hair">
        <Line name={<Note>{WORDS.rooms}</Note>}>
          <Figure size="m">{census.rooms.length}</Figure>
        </Line>
        <Line name={<Note>{WORDS.players}</Note>}>
          <Figure size="m">{players}</Figure>
        </Line>
        <Line name={<Note>{WORDS.up}</Note>}>
          <Figure size="m">{time(census.uptime)}</Figure>
        </Line>
        <Line name={<Note>{WORDS.memory}</Note>}>
          <Figure size="m">{`${census.heapMb} / ${census.rssMb} MB`}</Figure>
        </Line>
        {failed && <Fine className="text-gules">{WORDS.failed}</Fine>}
      </Stack>
      {census.rooms.map((room) => (
        <section key={`${room.code}-${room.ageS}`}>
          <Stack gap="hair">
            <Heading>
              {room.public ? 'Public game' : `Private ${room.code}`}
            </Heading>
            <Fine>
              {`${room.land} · ${room.started ? `turn ${room.turn}` : 'lobby'} · ${time(room.ageS)} old · ${room.seated} persons, ${room.bots} bots`}
            </Fine>
            {room.players.map((p) => (
              <Line key={p.seat} name={<Name>{p.name}</Name>}>
                <Fine className={p.answers ? 'text-thrive' : 'text-gules'}>
                  {`seat ${p.seat + 1} · ${p.answers ? 'answers' : 'silent'}`}
                </Fine>
              </Line>
            ))}
          </Stack>
        </section>
      ))}
    </Stack>
  )
}
