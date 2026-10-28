import { randomBytes } from 'node:crypto'
import { HASH_EVERY, SEATS, TURN_MS } from '../net/protocol'
import type { FromRelay, Lobby, Move, ToRelay } from '../net/protocol'
import type { Order } from '../engine'

// The rooms: players gathered, then a game relayed turn by turn. The public
// room starts by itself a while after its first player came, or once full;
// a private room, joined by its code, when its host says so. Before the
// game a player who leaves frees his seat; during it his seat goes to a bot,
// on every browser at the same turn.

/** Ms the public room waits after its first player before it starts. */
const PUBLIC_WAIT = 30_000

export type Player = {
  name: string
  send: (message: FromRelay) => void
}

type Room = {
  code: string
  open: boolean
  players: Array<Player | null>
  startsAt: number | null
  turn: number
  pending: Array<Order>
  left: Array<number>
  hashes: Map<number, Map<number, string>>
  timer: ReturnType<typeof setInterval> | null
  wait: ReturnType<typeof setTimeout> | null
  desynced: boolean
}

const rooms = new Map<string, Room>()
let publicRoom: Room | null = null

const codeOf = () => randomBytes(3).toString('hex').toUpperCase().slice(0, 5)

function makeRoom(open: boolean): Room {
  const room: Room = {
    code: open ? 'PUBLIC' : codeOf(),
    open,
    players: [],
    startsAt: null,
    turn: 0,
    pending: [],
    left: [],
    hashes: new Map(),
    timer: null,
    wait: null,
    desynced: false,
  }
  rooms.set(room.code + (open ? `-${Date.now()}` : ''), room)
  return room
}

const started = (room: Room) => room.timer !== null

function lobbyOf(room: Room): Lobby {
  return {
    room: room.code,
    open: room.open,
    names: room.players.map((p) => p?.name ?? ''),
    host: 0,
    startsIn:
      room.startsAt === null ? null : Math.max(0, room.startsAt - Date.now()),
  }
}

function tellLobby(room: Room) {
  const lobby = lobbyOf(room)
  room.players.forEach((p, seat) => p?.send({ t: 'lobby', seat, lobby }))
}

function broadcast(room: Room, message: FromRelay) {
  for (const p of room.players) p?.send(message)
}

/** The game begins: a seed for everyone, then a turn every 100 ms. */
function begin(room: Room) {
  if (started(room)) return
  if (room.wait) clearTimeout(room.wait)
  if (room === publicRoom) publicRoom = null
  const seed = `online-${randomBytes(6).toString('hex')}`
  const names = room.players.map((p) => p?.name ?? '')
  broadcast(room, { t: 'begin', seed, level: 'normal', names })
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
  if (room.wait) clearTimeout(room.wait)
  for (const [key, r] of rooms) if (r === room) rooms.delete(key)
  if (room === publicRoom) publicRoom = null
}

/** A player joins a room: the public one, a private one by its code, or a new private one. */
export function join(player: Player, code: string | null): Room | null {
  let room: Room | undefined
  if (code === null) room = publicRoom ?? (publicRoom = makeRoom(true))
  else if (code === 'new') room = makeRoom(false)
  else
    room = [...rooms.values()].find(
      (r) => !r.open && r.code === code.toUpperCase(),
    )
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
  if (room.open && room.startsAt === null) {
    room.startsAt = Date.now() + PUBLIC_WAIT
    const ready = room
    room.wait = setTimeout(() => begin(ready), PUBLIC_WAIT)
  }
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
  if (room.players.every((p) => p === null)) close(room)
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
