import { createServer } from 'node:http'
import { WebSocketServer } from 'ws'
import { parse } from '../net/protocol'
import { hear, join, leave, upcoming } from './rooms'
import { census } from './watch'
import type { ToRelay } from '../net/protocol'
import type { Player } from './rooms'

// The relay: a small Node server of its own, beside the site, that seats
// the players and passes their orders round in turns (rooms.ts). It speaks
// WebSocket on /ws; it answers /public with the public game in its opening,
// which the home shows without joining it, /admin with every room it holds
// for whoever has its key (ADMIN_KEY), and /health for the deployment's
// check.
// npm run relay (PORT, 8787 by default)

const PORT = Number(process.env.PORT ?? 8787)

const http = createServer((req, res) => {
  const path = (req.url ?? '/').split('?')[0]
  if (path === '/health') {
    res.writeHead(200, { 'content-type': 'text/plain' }).end('ok')
    return
  }
  // The watcher's census (/admin on the site), behind its key: none set,
  // none told.
  if (path === '/admin' && req.method === 'GET') {
    // The request's own path and query, read against any base: none is fetched.
    const key = new URL(req.url ?? '/', 'https://relay').searchParams.get('key')
    const admin = process.env.ADMIN_KEY
    if (!admin || key !== admin) {
      res.writeHead(404, { 'access-control-allow-origin': '*' }).end()
      return
    }
    res
      .writeHead(200, {
        'content-type': 'application/json',
        'cache-control': 'no-store',
        'access-control-allow-origin': '*',
      })
      .end(JSON.stringify(census()))
    return
  }
  if (path === '/public' && req.method === 'GET') {
    // No secret and no cookie: any page may read it, as anyone may join it.
    res
      .writeHead(200, {
        'content-type': 'application/json',
        'cache-control': 'no-store',
        'access-control-allow-origin': '*',
      })
      .end(JSON.stringify(upcoming()))
    return
  }
  res.writeHead(404).end()
})

// No message is larger than a host's book (rooms.ts, BOOK_MAX).
const wss = new WebSocketServer({
  server: http,
  path: '/ws',
  maxPayload: 16 * 1024,
})

/** How often each player is asked whether he is still there, in ms. */
const BEAT_MS = 30_000
/** The sockets that answered since the last asking. */
const answered = new WeakSet<object>()

wss.on('connection', (socket) => {
  answered.add(socket)
  socket.on('pong', () => answered.add(socket))
  const player: Player = {
    name: '',
    answers: () => answered.has(socket),
    send: (message) => {
      if (socket.readyState === socket.OPEN)
        socket.send(JSON.stringify(message))
    },
  }
  let room: ReturnType<typeof join> = null
  socket.on('message', (data) => {
    const message = parse<ToRelay>(data)
    if (!message) return
    if (message.t === 'join') {
      if (room) return
      // Anything may come down the wire: a room is a code, 'new' or none.
      const code = typeof message.room === 'string' ? message.room : null
      player.name = String(message.name).slice(0, 24)
      room = join(player, code)
    } else if (room) hear(room, player, message)
  })
  socket.on('close', () => {
    if (room) leave(room, player)
  })
})

// A player gone without a word (his network lost, his laptop shut) leaves
// no close behind him: asked every half minute, one who did not answer the
// last asking is cut, and leaves his game, which closes once no one is left
// in it (« est-ce qu'il y a plein de parties fantome dans le serveur ? »).
const beat = setInterval(() => {
  for (const socket of wss.clients) {
    if (!answered.has(socket)) {
      socket.terminate()
      continue
    }
    answered.delete(socket)
    socket.ping()
  }
}, BEAT_MS)
wss.on('close', () => clearInterval(beat))

http.listen(PORT, () => {
  console.warn(`relay listening on :${PORT}`)
})
