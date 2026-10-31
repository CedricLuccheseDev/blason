import { seated, started } from './room'
import type { Room } from './room'

// What the relay holds, for whoever watches it (« fais un /admin qui
// monitoring le live les parties en cours les joueurs tout ça »): every
// room made, public or private, until it closes; read whole, its land, its
// turn, its seats, who sits them and whether he still answers.

const rooms = new Set<Room>()
const born = new WeakMap<Room, number>()

/** A room made: watched until it closes. */
export function watch(room: Room): Room {
  rooms.add(room)
  born.set(room, Date.now())
  return room
}

/** A room closed: no longer watched. */
export function unwatch(room: Room) {
  rooms.delete(room)
}

/** The relay's rooms as a watcher reads them, with what the process weighs. */
export function census() {
  const memory = process.memoryUsage()
  return {
    at: Date.now(),
    uptime: Math.round(process.uptime()),
    heapMb: Math.round(memory.heapUsed / 1e6),
    rssMb: Math.round(memory.rss / 1e6),
    rooms: [...rooms].map((room) => ({
      code: room.code,
      public: room.code === 'PUBLIC',
      started: started(room),
      turn: room.turn,
      ageS: Math.round((Date.now() - (born.get(room) ?? Date.now())) / 1000),
      land:
        room.setup.land.kind === 'real'
          ? room.setup.land.map
          : `random ${room.setup.land.size}`,
      seated: seated(room),
      bots: room.setup.seats.filter((s) => s.bot !== null).length,
      players: room.players.flatMap((p, seat) =>
        p
          ? [{ seat, name: p.name || '?', answers: p.answers?.() ?? true }]
          : [],
      ),
    })),
  }
}
