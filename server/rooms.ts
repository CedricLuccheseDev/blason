import { randomBytes } from 'node:crypto'
import { HASH_EVERY, SEATS, TURN_MS } from '../net/protocol'
import type { FromRelay, Lobby, Move, ToRelay, Upcoming } from '../net/protocol'
import type { MapSize, Order } from '../engine'

// The rooms: players gathered, then a game relayed turn by turn. Each room
// draws its game's land as it opens, a seed and a size. One public room is
// always open, as OpenFront's lobbies: a minute after it opened it starts
// with whoever sits, or at once when full, and the next opens; if no one
// sits by then, another takes its place, a new land and a new minute. A
// private room, joined by its code, starts when its host says so. Before
// the game a player who leaves frees his seat, the public room keeping its
// minute; during it his seat goes to a bot, on every browser at the same
// turn.

/** Ms a public room stays open: then it starts, or another takes its place. */
export const PUBLIC_WAIT = 60_000
/** The land of a game online. */
const SIZE: MapSize = 'standard'

export type Player = {
  name: string
  send: (message: FromRelay) => void
}

type Room = {
  code: string
  open: boolean
  seed: string
  size: MapSize
  players: Array<Player | null>
  turn: number
  pending: Array<Order>
  left: Array<number>
  hashes: Map<number, Map<number, string>>
  timer: ReturnType<typeof setInterval> | null
  desynced: boolean
}

/** The public room open now, when it starts, and the timer that starts it or lets it go. */
type Next = {
  room: Room
  startsAt: number
  wait: ReturnType<typeof setTimeout>
}

/** The private rooms by their code; a public room is its players' once it starts. */
const privates = new Map<string, Room>()
let next: Next | null = null

/** A private room's code: five letters or figures, none taken. */
function freeCode(): string {
  const code = randomBytes(3).toString('hex').toUpperCase().slice(0, 5)
  return privates.has(code) ? freeCode() : code
}

function makeRoom(open: boolean): Room {
  const room: Room = {
    code: open ? 'PUBLIC' : freeCode(),
    open,
    seed: `online-${randomBytes(6).toString('hex')}`,
    size: SIZE,
    players: [],
    turn: 0,
    pending: [],
    left: [],
    hashes: new Map(),
    timer: null,
    desynced: false,
  }
  if (!open) privates.set(room.code, room)
  return room
}

/** The public room open now; when none is, one opens, so there always is one to see or to sit at. */
function publicRoom(): Next {
  if (next) return next
  const room = makeRoom(true)
  const wait = setTimeout(() => {
    if (room.players.length > 0) begin(room)
    else close(room)
  }, PUBLIC_WAIT)
  next = { room, startsAt: Date.now() + PUBLIC_WAIT, wait }
  return next
}

/** A room started or closed is no longer the public room open: the next ask opens another. */
function letGo(room: Room) {
  if (next?.room !== room) return
  clearTimeout(next.wait)
  next = null
}

const started = (room: Room) => room.timer !== null

/** Ms before the public room open starts. */
const left = (open: Next) => Math.max(0, open.startsAt - Date.now())

function lobbyOf(room: Room): Lobby {
  return {
    room: room.code,
    open: room.open,
    seed: room.seed,
    size: room.size,
    names: room.players.map((p) => p?.name ?? ''),
    host: 0,
    // The public room open counts down; a private one waits for its host.
    startsIn: next?.room === room ? left(next) : null,
  }
}

/** The next public game, as anyone may see it without sitting at it. */
export function upcoming(): Upcoming {
  const open = publicRoom()
  return {
    seed: open.room.seed,
    size: open.room.size,
    startsIn: left(open),
    taken: open.room.players.length,
    seats: SEATS,
  }
}

function tellLobby(room: Room) {
  const told = lobbyOf(room)
  room.players.forEach((p, seat) => p?.send({ t: 'lobby', seat, lobby: told }))
}

function broadcast(room: Room, message: FromRelay) {
  for (const p of room.players) p?.send(message)
}

/** The game begins on the room's land, then a turn every 100 ms. */
function begin(room: Room) {
  if (started(room)) return
  letGo(room)
  const { seed, size } = room
  const names = room.players.map((p) => p?.name ?? '')
  broadcast(room, { t: 'begin', seed, size, level: 'normal', names })
  room.timer = setInterval(() => {
    const message: FromRelay = {
      t: 'turn',
      n: room.turn,
      orders: room.pending,
      left: room.left,
    }
    room.turn += 1
    room.pending = []
    room.left = []
    broadcast(room, message)
  }, TURN_MS)
}

function close(room: Room) {
  if (room.timer) clearInterval(room.timer)
  if (privates.get(room.code) === room) privates.delete(room.code)
  letGo(room)
}

/** The room a player asks for: the public one (null), a new private one ('new'), or a private one by its code. */
function roomFor(code: string | null): Room | undefined {
  if (code === null) return publicRoom().room
  if (code === 'new') return makeRoom(false)
  return privates.get(code.toUpperCase())
}

/** A player joins a room: the public one, a private one by its code, or a new private one. */
export function join(player: Player, code: string | null): Room | null {
  const room = roomFor(code)
  if (!room) {
    player.send({ t: 'error', reason: 'unknown' })
    return null
  }
  if (started(room)) {
    player.send({ t: 'error', reason: 'started' })
    return null
  }
  if (room.players.filter(Boolean).length >= SEATS) {
    player.send({ t: 'error', reason: 'full' })
    return null
  }
  room.players.push(player)
  if (room.open && room.players.length >= SEATS) begin(room)
  else tellLobby(room)
  return room
}

/** A message from a player of a room. */
export function hear(room: Room, player: Player, message: ToRelay) {
  const seat = room.players.indexOf(player)
  if (seat < 0) return
  if (message.t === 'start' && seat === 0 && !room.open) begin(room)
  else if (message.t === 'order' && started(room) && isMove(message.move))
    room.pending.push({ ...message.move, player: seat })
  else if (message.t === 'hash') check(room, seat, message.turn, message.hash)
}

/** A player gone: before the game his seat is freed; during it, a bot takes it. */
export function leave(room: Room, player: Player) {
  const seat = room.players.indexOf(player)
  if (seat < 0) return
  if (started(room)) {
    room.players[seat] = null
    room.left.push(seat)
  } else room.players.splice(seat, 1)
  // The public room open keeps its minute, empty or not.
  if (next?.room !== room && room.players.every((p) => p === null)) close(room)
  else if (!started(room)) tellLobby(room)
}

/** The fingerprints told for a turn: if two differ, everyone is told once. */
function check(room: Room, seat: number, turn: number, hash: string) {
  if (turn % HASH_EVERY !== 0 || room.desynced) return
  const told = room.hashes.get(turn) ?? new Map<number, string>()
  told.set(seat, hash)
  room.hashes.set(turn, told)
  if (new Set(told.values()).size > 1) {
    room.desynced = true
    broadcast(room, { t: 'desync', turn })
  }
  for (const old of room.hashes.keys())
    if (old < turn - 10 * HASH_EVERY) room.hashes.delete(old)
}

/** Whether something sent as an order looks like one: the engine checks the rest. */
function isMove(move: unknown): move is Move {
  return (
    typeof move === 'object' &&
    move !== null &&
    'type' in move &&
    typeof move.type === 'string'
  )
}
