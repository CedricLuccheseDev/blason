import { createServer } from 'node:http'
import { WebSocketServer } from 'ws'
import { parse } from '../net/protocol'
import { hear, join, leave } from './rooms'
import type { ToRelay } from '../net/protocol'
import type { Player } from './rooms'

// The relay: a small Node server of its own, beside the site, that gathers
// the players and passes their orders round in turns (rooms.ts). It speaks
// WebSocket on /ws and answers /health for the deployment's check.
// npm run relay (PORT, 8787 by default)

const PORT = Number(process.env.PORT ?? 8787)

const http = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'text/plain' }).end('ok')
    return
  }
  res.writeHead(404).end()
})

const wss = new WebSocketServer({ server: http, path: '/ws' })

wss.on('connection', (socket) => {
  const player: Player = {
    name: '',
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
      player.name = String(message.name).slice(0, 24)
      room = join(player, message.room)
    } else if (room) hear(room, player, message)
  })
  socket.on('close', () => {
    if (room) leave(room, player)
  })
})

http.listen(PORT, () => {
  console.warn(`relay listening on :${PORT}`)
})
