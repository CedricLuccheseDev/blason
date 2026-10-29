// What the boards show, taken again from the game as it now stands: its
// moments saved anew (scripts/maquette.ts), the game and the relay served on
// free ports (the relay for the home's next public game), the moments the
// boards name captured at the sizes they show them, and the interface's
// pieces (capture.mjs); the servers stopped after, whatever happened.

import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../../', import.meta.url))
const CAPTURE = 'design/maquette/capture.mjs'

/** A command run to its end in the repository, its output shown; it fails if the command does. */
function run(command, args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: ROOT,
      env: { ...process.env, ...env },
      stdio: 'inherit',
    })
    child.on('error', reject)
    child.on('exit', (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${command} ${args.join(' ')} failed (${code})`)),
    )
  })
}

/** A server started in the repository, in a process group of its own so that it is stopped whole. */
function serve(command, args, env) {
  const child = spawn(command, args, {
    cwd: ROOT,
    env: { ...process.env, ...env },
    stdio: 'ignore',
    detached: true,
  })
  return () => {
    try {
      process.kill(-child.pid, 'SIGTERM')
    } catch {
      // Already gone.
    }
  }
}

/** A port no one listens on. */
function freePort() {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address()
      server.close(() => resolve(port))
    })
  })
}

/** Once the address answers, within so many ms. */
async function answers(url, within = 120_000) {
  const end = Date.now() + within
  for (;;) {
    try {
      if ((await fetch(url)).ok) return
    } catch {
      // Not up yet.
    }
    if (Date.now() > end) throw new Error(`${url} never answered`)
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
}

/** Retakes the moments named, each at its sizes ({ moment: ['1920x1080', …] }), and the pieces. */
export async function take(needs) {
  await run('npx', ['tsx', 'scripts/maquette.ts'])
  const [site, relay] = [await freePort(), await freePort()]
  const stops = [
    serve('npx', ['tsx', 'server/relay.ts'], { PORT: String(relay) }),
    serve(
      'npx',
      ['vite', 'dev', '--port', String(site), '--host', '127.0.0.1'],
      { VITE_RELAY_URL: `ws://127.0.0.1:${relay}/ws` },
    ),
  ]
  try {
    const base = `http://127.0.0.1:${site}`
    await answers(`http://127.0.0.1:${relay}/public`)
    await answers(base)
    // The moments taken at the same sizes, in one run of the capture each.
    const runs = new Map()
    for (const [moment, sizes] of Object.entries(needs)) {
      const key = [...sizes].sort().join(',')
      runs.set(key, [...(runs.get(key) ?? []), moment])
    }
    for (const [sizes, moments] of runs)
      await run('node', [CAPTURE, base, ...moments], { SIZES: sizes })
    await run('node', [CAPTURE, base, 'pieces'])
  } finally {
    for (const stop of stops) stop()
  }
}
