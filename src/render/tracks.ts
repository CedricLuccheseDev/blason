import { marching } from '../../engine'
import { siteOf } from './marks'
import { headOf, pathOf, pointOn } from './layers/column'
import type { GameState, Host } from '../../engine'

// What the screen keeps of each army from one frame to the next, so that
// nothing on it jumps: where its fight stands, eased towards the middle of
// the last tiles it took over the last second and a half rather than set on
// them; which way it faces; how far it has faded in, or out once it is gone;
// whether it still marches or already fights, eased too; and the men it lost
// since the last tick, for the dead to fall.

/** Seconds for a fight to glide most of the way to where it now stands, and for an army to fade in or out. */
const GLIDE = 0.6
const FADE = 0.5
/** Ticks of front kept to set where a fight stands. */
const TRAIL = 15

export type Track = {
  host: Host
  /** Where its men stand and fight, in map units, and the way back to its own land, of length one. */
  x: number
  y: number
  back: Spot
  /** How far along its road its head is, in tiles. */
  head: number
  /** Faded in (1) or out (0); 1 while it marches, 0 once it fights at the front. */
  alpha: number
  march: number
  gone: boolean
  /** Its men at the last tick read, the middles of its front over the last ticks. */
  men: number
  trail: Array<Spot>
}

type Spot = { x: number; y: number }

/** The middle of some points. */
function middle(points: Array<Spot>): Spot {
  let [x, y] = [0, 0]
  for (const p of points) {
    x += p.x
    y += p.y
  }
  return { x: x / points.length, y: y / points.length }
}

const ease = (from: number, to: number, k: number) => from + (to - from) * k

export function makeTracks(onLoss: (track: Track, men: number) => void) {
  const tracks = new Map<Host, Track>()
  let tick = -1
  let last = performance.now() / 1000

  /** Where an army stands now: on its road while it marches, else the middle of its front over the last ticks. */
  function target(state: GameState, track: Track, fresh: boolean) {
    const { host } = track
    const path = pathOf(state, host)
    if (marching(host)) return pointOn(path, track.head)
    if (fresh && host.edge.length > 0) {
      track.trail.push(middle(host.edge.map((t) => siteOf(state, t))))
      if (track.trail.length > TRAIL) track.trail.shift()
    }
    if (track.trail.length === 0)
      return path.at(-1) ?? siteOf(state, host.entry)
    return middle(track.trail)
  }

  function follow(state: GameState, host: Host) {
    let track = tracks.get(host)
    if (!track) {
      const start = pathOf(state, host)[0]
      track = {
        host,
        ...start,
        back: { x: -1, y: 0 },
        head: 0,
        alpha: 0,
        march: 1,
        gone: false,
        men: host.men,
        trail: [],
      }
      tracks.set(host, track)
    }
    return track
  }

  /** An army a frame further: its head on its road, where it stands, which way it faces. */
  function move(
    state: GameState,
    track: Track,
    between: number,
    dt: number,
    fresh: boolean,
  ) {
    const { host } = track
    const glide = 1 - Math.exp(-dt / GLIDE)
    track.head = headOf(state, host, between)
    const going = marching(host)
    track.march = going ? 1 : Math.max(0, track.march - dt / FADE)
    const to = target(state, track, fresh)
    // On the road the column is drawn where it walks; at the front, the fight glides.
    const k = going ? 1 : glide
    track.x = ease(track.x, to.x, k)
    track.y = ease(track.y, to.y, k)
    const home = pathOf(state, host).at(-1) ?? to
    const d = Math.hypot(home.x - track.x, home.y - track.y)
    if (d > 1) {
      track.back.x = ease(track.back.x, (home.x - track.x) / d, glide)
      track.back.y = ease(track.back.y, (home.y - track.y) / d, glide)
    }
  }

  return {
    /** Every army followed a frame further, those gone fading out. */
    update(state: GameState, between: number): Array<Track> {
      const seconds = performance.now() / 1000
      const dt = Math.min(0.1, seconds - last)
      last = seconds
      const fresh = state.tick !== tick
      tick = state.tick
      const out = new Set(state.hosts)
      for (const host of state.hosts) follow(state, host)
      for (const [host, track] of tracks) {
        if (!out.has(host)) {
          track.gone = true
          track.alpha -= dt / FADE
          if (track.alpha <= 0) tracks.delete(host)
          continue
        }
        track.alpha = Math.min(1, track.alpha + dt / FADE)
        move(state, track, between, dt, fresh)
        if (fresh && host.men < track.men) onLoss(track, track.men - host.men)
        if (fresh) track.men = host.men
      }
      return [...tracks.values()]
    },
  }
}
