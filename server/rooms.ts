import { randomBytes } from 'node:crypto'
import {
  SETUP_LIMITS,
  botsSetup,
  publicSetup,
  readSetup,
  seatPersons,
} from '../engine'
import { SEATS, TURN_MS } from '../net/protocol'
import { fingerprints, isMove, tell } from './checks'
import {
  beginning,
  broadcast,
  makeRoom,
  nextTurn,
  order,
  seated,
  started,
} from './room'
import type { Player, Room } from './room'
import type { Lobby, ToRelay, Upcoming } from '../net/protocol'

// The games, relayed turn by turn (protocol.ts). One public game is always
// in its opening, as on OpenFront, with no room to wait in: it begins as it
// opens, its land drawn and no bot in it (« en ligne il faut 0 bot »), every
// seat empty, its turns flowing from the first; whoever comes sits at once
// on the first free seat, given the turns so far to catch up, and plants his
// standard. No one comes in during the opening's last seconds (SETUP_LIMITS.opening.lastCall),
// so that the last to come still has the time to plant: then the game goes
// on with whoever came, the seats no one took empty, and the next opens; if
// no one came, it is dropped and the next takes its place; if one alone
// came, no one wins alone: the opening begins again on the same land, his
// standard still planted (again), and the home says a lord is waiting. A
// private room, joined by its code, gathers its players first and begins on
// its host's word, its players seated from the first turn, bots in the other
// seats. A player who leaves a game leaves his seat to its bot, if the setup
// gives it one, on every browser at the same turn, and his lord idle if not;
// before a private game begins, he frees it.

/** Turns a public game may be joined for, from its first: all its opening but its last call. */
const JOIN_TURNS = SETUP_LIMITS.opening.public - SETUP_LIMITS.opening.lastCall
/** Ms a public game may be joined for: then the next opens. */
export const JOIN_MS = JOIN_TURNS * TURN_MS

export type { Player } from './room'

/** The private rooms by their code. */
const privates = new Map<string, Room>()
/** The public game in its opening, which anyone may join; none until someone asks. */
let open: Room | null = null

/** A private room's code: five letters or figures, none taken. */
function freeCode(): string {
  const code = randomBytes(3).toString('hex').toUpperCase().slice(0, 5)
  return privates.has(code) ? freeCode() : code
}

const freshSeed = () => `online-${randomBytes(6).toString('hex')}`

/** The public game in its opening; when none is, one opens and begins, so that there always is one to see or to join. */
function publicGame(): Room {
  if (open) return open
  const room = makeRoom('PUBLIC', publicSetup(freshSeed()))
  room.players = Array.from({ length: SEATS }, () => null)
  room.played = []
  open = room
  run(room)
  return room
}

/** The public game in its opening, as anyone may see it without joining it. */
export function upcoming(): Upcoming {
  const room = publicGame()
  return {
    seed: room.setup.seed,
    size: room.setup.land.size,
    closesIn: Math.max(0, JOIN_TURNS - room.turn) * TURN_MS,
    startsIn: Math.max(0, SETUP_LIMITS.opening.public - room.turn) * TURN_MS,
    taken: seated(room),
    seats: SEATS,
    waiting: room.players.filter((p) => p && room.waited.has(p)).length,
  }
}

/** The longest book a host may send, as its JSON: twenty seats are some 1,500 characters. */
const BOOK_MAX = 4000

/** A private room as it stands, told to each of its players. */
function tellLobby(room: Room) {
  const names = room.players.map((p) => p?.name ?? '')
  const lobby: Lobby = { room: room.code, names, host: 0, setup: room.book }
  room.players.forEach((p, seat) => p?.send({ t: 'lobby', seat, lobby }))
}

/** The game's turns, one every 100 ms from the first. */
function run(room: Room) {
  room.timer = setInterval(() => play(room), TURN_MS)
}

function play(room: Room) {
  broadcast(room, nextTurn(room))
  if (room === open && room.turn >= JOIN_TURNS) closeDoors(room)
}

/** No one comes into the public game any more: it goes on with whoever came, or is dropped if no one did, the next opening at the next ask; one alone, it begins again. */
function closeDoors(room: Room) {
  const persons = seated(room)
  if (persons === 1) return again(room)
  if (open === room) open = null
  room.played = null
  if (persons === 0) close(room)
}

/**
 * One alone when the doors close: no one wins alone, the opening begins
 * again, on the same land, as a new game. He is told it begins (his browser
 * makes it again from its setup), his seat his from its first turn, which
 * carries his last standard again, so that it stands where he planted it;
 * whoever comes plays the same turns from the first, so every browser has
 * the same game. A leaver's lord is no more: his seat is empty again.
 */
function again(room: Room) {
  const seat = room.players.findIndex(Boolean)
  const player = room.players[seat]
  if (!player) return
  const standard = room.planted.get(seat)
  room.turn = 0
  room.pending = standard ? [standard] : []
  room.joined = [seat]
  room.left = []
  room.played = []
  room.prints = fingerprints()
  room.planted = new Map(standard ? [[seat, standard]] : [])
  room.waited = new Set([player])
  player.send(beginning(room, seat))
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

/** A player comes into the public game in its opening: the first free seat, empty until the next turn; the game so far, to catch up. */
function sit(player: Player, room: Room): Room {
  const free = room.players.indexOf(null)
  const seat = free >= 0 ? free : room.players.length
  room.players[seat] = player
  // A seat left this very turn stays a person's, on every browser.
  if (!drop(room.left, seat)) room.joined.push(seat)
  player.send(beginning(room, seat))
  for (const turn of room.played ?? []) player.send(turn)
  if (seated(room) >= SEATS) closeDoors(room)
  return room
}

/** A player joins the public game in its opening (null), a private room by its code, or a new private room ('new'). */
export function join(player: Player, code: string | null): Room | null {
  if (code === null) return sit(player, publicGame())
  // A bot in every seat no player takes, as before the host's book sets it.
  const made = () =>
    makeRoom(
      freeCode(),
      botsSetup({ seed: freshSeed(), opening: SETUP_LIMITS.opening.public }),
    )
  const room = code === 'new' ? made() : privates.get(code.toUpperCase())
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

/** The host's book, while his room waits, passed on to his guests; a book too large to be one is not. */
function keepBook(room: Room, setup: unknown) {
  if (started(room)) return
  if (JSON.stringify(setup ?? null).length > BOOK_MAX) return
  room.book = setup
  tellLobby(room)
}

/** A message from a player of a room. */
export function hear(room: Room, player: Player, message: ToRelay) {
  const seat = room.players.indexOf(player)
  if (seat < 0) return
  // Once begun, a game's setup is never changed (the public game, begun
  // from its first turn, takes no start at all).
  if (message.t === 'start' && seat === 0 && !started(room)) {
    // The host's book, if the relay can read it, fitted to who sits now:
    // a guest come or gone since he launched keeps it his game.
    const setup = message.setup === undefined ? null : readSetup(message.setup)
    if (setup) room.setup = seatPersons(setup, seated(room))
    begin(room)
  } else if (message.t === 'book' && seat === 0) keepBook(room, message.setup)
  else if (message.t === 'order' && started(room) && isMove(message.move))
    order(room, { ...message.move, player: seat })
  else if (
    message.t === 'hash' &&
    tell(room.prints, seat, message.turn, message.hash, room.turn)
  )
    broadcast(room, { t: 'desync', turn: message.turn })
}

/** A player gone: before a private game his seat is freed; during a game, its bot takes it again, or his lord stays idle. */
export function leave(room: Room, player: Player) {
  const seat = room.players.indexOf(player)
  if (seat < 0) return
  if (!started(room)) {
    room.players.splice(seat, 1)
    // The host gone before his game, no one may launch it: his guests are
    // told, and the room is no more.
    if (seat === 0)
      for (const p of room.players) p?.send({ t: 'error', reason: 'gone' })
    if (seat === 0 || room.players.length === 0) close(room)
    else tellLobby(room)
    return
  }
  room.players[seat] = null
  // A seat taken this very turn was never a person's on any browser.
  if (!drop(room.joined, seat)) room.left.push(seat)
  // The public game in its opening runs on, empty or not, until its doors close.
  if (room !== open && seated(room) === 0) close(room)
}
