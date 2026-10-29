import { randomBytes } from 'node:crypto'
import { ONLINE_OPENING_TICKS } from '../engine'
import { SEATS, TURN_MS } from '../net/protocol'
import { fingerprints, isMove, tell } from './checks'
import type { Fingerprints } from './checks'
import type { FromRelay, Lobby, ToRelay, Turn, Upcoming } from '../net/protocol'
import type { MapSize, Order } from '../engine'

// The games, relayed turn by turn (protocol.ts). One public game is always
// in its opening, as on OpenFront, with no room to wait in: it begins as it
// opens, its land drawn and a bot in every seat, its turns flowing from the
// first; whoever comes sits at once on a bot's seat, given the turns so far
// to catch up, and plants his standard. No one comes in during the opening's
// last seconds (LAST_CALL), so that the last to come still has the time to
// plant: then the game goes on with whoever came, bots in the empty seats,
// and the next opens; if no one came, it is dropped and the next takes its
// place. A private room, joined by its code, gathers its players first and
// begins on its host's word, its players seated from the first turn. A
// player who leaves a game gives his seat back to a bot, on every browser at
// the same turn; before a private game begins, he frees it.

/** Turns before the opening ends when no one may come in any more: the time for the last to come to plant his standard. */
const LAST_CALL = 50
/** Turns a public game may be joined for, from its first. */
const JOIN_TURNS = ONLINE_OPENING_TICKS - LAST_CALL
/** Ms a public game may be joined for: then the next opens. */
export const JOIN_MS = JOIN_TURNS * TURN_MS
/** The land of a game online. */
const SIZE: MapSize = 'standard'

export type Player = {
  name: string
  send: (message: FromRelay) => void
}

type Room = {
  code: string
  seed: string
  size: MapSize
  /** By seat, the persons; a seat without one is a bot's. */
  players: Array<Player | null>
  turn: number
  /** What the next turn will carry. */
  pending: Array<Order>
  joined: Array<number>
  left: Array<number>
  /** The turns played, kept while players may come in, to catch them up; none once no one may. */
  played: Array<Turn> | null
  prints: Fingerprints
  timer: ReturnType<typeof setInterval> | null
}

/** The private rooms by their code. */
const privates = new Map<string, Room>()
/** The public game in its opening, which anyone may join; none until someone asks. */
let open: Room | null = null

/** A private room's code: five letters or figures, none taken. */
function freeCode(): string {
  const code = randomBytes(3).toString('hex').toUpperCase().slice(0, 5)
  return privates.has(code) ? freeCode() : code
}

function makeRoom(code: string): Room {
  return {
    code,
    seed: `online-${randomBytes(6).toString('hex')}`,
    size: SIZE,
    players: [],
    turn: 0,
    pending: [],
    joined: [],
    left: [],
    played: null,
    prints: fingerprints(),
    timer: null,
  }
}

/** The public game in its opening; when none is, one opens and begins, so that there always is one to see or to join. */
function publicGame(): Room {
  if (open) return open
  const room = makeRoom('PUBLIC')
  room.played = []
  open = room
  run(room)
  return room
}

const started = (room: Room) => room.timer !== null
const seated = (room: Room) => room.players.filter(Boolean).length

/** The public game in its opening, as anyone may see it without joining it. */
export function upcoming(): Upcoming {
  const room = publicGame()
  return {
    seed: room.seed,
    size: room.size,
    closesIn: Math.max(0, JOIN_TURNS - room.turn) * TURN_MS,
    taken: seated(room),
    seats: SEATS,
  }
}

/** A private room as it stands, told to each of its players. */
function tellLobby(room: Room) {
  const names = room.players.map((p) => p?.name ?? '')
  const lobby: Lobby = { room: room.code, names, host: 0 }
  room.players.forEach((p, seat) => p?.send({ t: 'lobby', seat, lobby }))
}

function broadcast(room: Room, message: FromRelay) {
  for (const p of room.players) p?.send(message)
}

/** The game as a player begins it, from his seat. */
function beginning(room: Room, seat: number): FromRelay {
  const { seed, size } = room
  return {
    t: 'begin',
    seat,
    seed,
    size,
    level: 'normal',
    opening: ONLINE_OPENING_TICKS,
  }
}

/** The game's turns, one every 100 ms from the first. */
function run(room: Room) {
  room.timer = setInterval(() => play(room), TURN_MS)
}

function play(room: Room) {
  const turn: Turn = {
    t: 'turn',
    n: room.turn,
    orders: room.pending,
    joined: room.joined,
    left: room.left,
  }
  room.turn += 1
  room.pending = []
  room.joined = []
  room.left = []
  room.played?.push(turn)
  broadcast(room, turn)
  if (room === open && room.turn >= JOIN_TURNS) closeDoors(room)
}

/** No one comes into the public game any more: it goes on with whoever came, or is dropped if no one did; the next opens at the next ask. */
function closeDoors(room: Room) {
  if (open === room) open = null
  room.played = null
  if (seated(room) === 0) close(room)
}

function close(room: Room) {
  if (room.timer) clearInterval(room.timer)
  if (privates.get(room.code) === room) privates.delete(room.code)
  if (open === room) open = null
}

/** Takes a value out of a list; whether it was there. */
function drop(list: Array<number>, value: number): boolean {
  const i = list.indexOf(value)
  if (i >= 0) list.splice(i, 1)
  return i >= 0
}

/** A player comes into the public game in its opening: the first free seat, a bot's until the next turn; the game so far, to catch up. */
function sit(player: Player, room: Room): Room {
  const free = room.players.indexOf(null)
  const seat = free >= 0 ? free : room.players.length
  room.players[seat] = player
  // A seat left this very turn stays a person's: its bot never comes back.
  if (!drop(room.left, seat)) room.joined.push(seat)
  player.send(beginning(room, seat))
  for (const turn of room.played ?? []) player.send(turn)
  if (seated(room) >= SEATS) closeDoors(room)
  return room
}

/** A player joins the public game in its opening (null), a private room by its code, or a new private room ('new'). */
export function join(player: Player, code: string | null): Room | null {
  if (code === null) return sit(player, publicGame())
  const room =
    code === 'new' ? makeRoom(freeCode()) : privates.get(code.toUpperCase())
  if (!room) {
    player.send({ t: 'error', reason: 'unknown' })
    return null
  }
  if (started(room)) {
    player.send({ t: 'error', reason: 'started' })
    return null
  }
  if (seated(room) >= SEATS) {
    player.send({ t: 'error', reason: 'full' })
    return null
  }
  privates.set(room.code, room)
  room.players.push(player)
  tellLobby(room)
  return room
}

/** A private game begins on its host's word: each player his seat, a person's from the first turn. */
function begin(room: Room) {
  if (started(room)) return
  room.players.forEach((p, seat) => {
    if (!p) return
    room.joined.push(seat)
    p.send(beginning(room, seat))
  })
  run(room)
}

/** A message from a player of a room. */
export function hear(room: Room, player: Player, message: ToRelay) {
  const seat = room.players.indexOf(player)
  if (seat < 0) return
  if (message.t === 'start' && seat === 0) begin(room)
  else if (message.t === 'order' && started(room) && isMove(message.move))
    room.pending.push({ ...message.move, player: seat })
  else if (
    message.t === 'hash' &&
    tell(room.prints, seat, message.turn, message.hash)
  )
    broadcast(room, { t: 'desync', turn: message.turn })
}

/** A player gone: before a private game his seat is freed; during a game, a bot takes it again. */
export function leave(room: Room, player: Player) {
  const seat = room.players.indexOf(player)
  if (seat < 0) return
  if (!started(room)) {
    room.players.splice(seat, 1)
    if (room.players.length === 0) close(room)
    else tellLobby(room)
    return
  }
  room.players[seat] = null
  // A seat taken this very turn was never a person's on any browser.
  if (!drop(room.joined, seat)) room.left.push(seat)
  // The public game in its opening runs on, empty or not, until its doors close.
  if (room !== open && seated(room) === 0) close(room)
}
