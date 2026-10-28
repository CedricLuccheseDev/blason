import { Application } from 'pixi.js'
import { NEUTRAL, NO_ONE, entryFor } from '../../engine'
import { makeCamera } from './camera'
import { makeInput } from './input'
import { ARMY_KEYS, WORK_KEYS } from './keys'
import { TONE } from './palette'
import { takeLand } from './ahead'
import { makeDirector } from './director'
import { landBox, siteOf, tileAt } from './marks'
import { makeScene } from './scene'
import { startSession } from './session'
import { summarize } from './summary'
import type { Army, Work } from '../../engine'
import type { Summary } from './summary'

// The game on screen, the land taken bit by bit: the manuscript map
// of the game, its lands spreading tile by tile as in OpenFront, with its
// villages, works and armies. A click on another's land raises the army in
// hand (1 to 3: a raid, a host, the whole levy) and sends it in where the
// border is nearest the click; with a work in hand (4 to 6: a village, a
// castle, a market), a click on one's own land builds it there.

/** Where the pointer aims at another's land, in pixels of the map's element: where the army would enter, whose land, and whether a right click pinned it there. */
export type Aim = {
  x: number
  y: number
  /** Where an army would enter, or none on an ally's land, which no army strikes. */
  entry: { x: number; y: number } | null
  lord: number | null
  pinned: boolean
}

export type GameHandle = {
  destroy: () => void
  choose: (army: Army) => void
  hold: (work: Work | null) => void
  close: () => void
  /** An order about another lord: to offer or accept an alliance, renew it, or break it. */
  treat: (type: 'ally' | 'breakAlliance', target: number) => void
}

export type { Summary } from './summary'
export { prepareGame, randomSeed } from './ahead'

export async function mountGame(
  element: HTMLElement,
  seed: string | null,
  me: number,
  hooks: {
    onSummary: (summary: Summary) => void
    /** The pointer over land a click would strike, or the one right clicked; none elsewhere. */
    onAim: (aim: Aim | null) => void
    names: Array<string>
    /** Watching alone, the camera directed (director.ts), so many pixels on the left left to a menu. */
    spectate?: () => number
  },
): Promise<GameHandle> {
  const app = new Application()
  const { land, grid } = takeLand(seed)
  await app.init({
    preference: 'webgl',
    resizeTo: element,
    background: TONE.frame,
    antialias: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoDensity: true,
  })
  element.appendChild(app.canvas)
  const session = startSession(grid, land.seed, me)
  const { state } = session
  const scene = makeScene(app, land, me, state, hooks.names)

  const home = () => (me < 0 ? null : landBox(state, me))
  const camera = makeCamera(app, scene.world, land, home)
  const director = hooks.spectate
    ? makeDirector(app, scene.world, land, state, hooks.spectate)
    : null
  // Behind a menu, half the frames are enough.
  if (director) app.ticker.maxFPS = 30

  const pick = (x: number, y: number) => tileAt(grid, x, y)

  let army: Army = 'host'
  let work: Work | null = null
  let hovered = -1
  // Where the pointer is on the map's element, and the aim pinned by a right click.
  const pointer = { x: 0, y: 0 }
  let pinned: Aim | null = null
  const onPointer = (e: PointerEvent) => {
    pointer.x = e.offsetX
    pointer.y = e.offsetY
  }
  app.canvas.addEventListener('pointermove', onPointer)
  app.canvas.addEventListener('pointerdown', onPointer)

  /** The aim at a tile: another's land or free land a click would strike; none elsewhere, in the opening, or with a work in hand. */
  function aimAt(tile: number, pin: boolean): Aim | null {
    if (tile < 0 || work || state.tick < state.rules.openingTicks) return null
    const gate = entryFor(state, me, tile)
    const owner = state.owner[tile]
    // An ally's land: nothing to strike, but a right click opens what binds us.
    if (gate < 0 && !(pin && owner >= 0 && owner !== me)) return null
    const at = gate < 0 ? null : scene.world.toGlobal(siteOf(state, gate))
    return {
      ...pointer,
      entry: at && { x: at.x, y: at.y },
      lord: owner === NEUTRAL ? null : owner,
      pinned: pin,
    }
  }
  function unpin() {
    pinned = null
    hooks.onAim(aimAt(hovered, false))
  }
  function click(tile: number) {
    if (tile < 0 || me < 0) return
    if (pinned) {
      unpin()
      return
    }
    if (state.tick < state.rules.openingTicks)
      session.send({ player: me, type: 'pickStart', tile })
    else if (work) {
      session.send({ player: me, type: 'build', tile, work })
      work = null
    } else session.send({ player: me, type: 'attack', tile, army })
  }
  const input =
    me >= 0
      ? makeInput(app.canvas, scene.world, pick, {
          hover(tile) {
            hovered = tile
            if (!pinned) hooks.onAim(aimAt(tile, false))
          },
          click,
          menu(tile) {
            pinned = aimAt(tile, true)
            hooks.onAim(pinned)
          },
          away: unpin,
        })
      : null
  const onKey = (e: KeyboardEvent) => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return
    if (e.key === 'Escape') {
      work = null
      unpin()
    }
    // An army taken in hand puts the work down, as on the bar.
    const raised = ARMY_KEYS[e.key]
    if (raised) {
      army = raised
      work = null
    }
    const held = WORK_KEYS[e.key]
    if (held) work = work === held ? null : held
    refresh()
  }
  /** The figures and the aim again, after what is in hand changed: a work in hand aims at nothing. */
  function refresh() {
    hooks.onSummary(summarize(state, me, { army, work }))
    if (!pinned) hooks.onAim(aimAt(hovered, false))
  }
  if (me >= 0) window.addEventListener('keydown', onKey)

  let drawn = false
  let found = false
  let reported = -1
  let announced = false
  app.ticker.add((ticker) => {
    if (drawn) session.advance(Math.min(ticker.elapsedMS, 1000))
    drawn = true
    if (director) director.step(ticker.elapsedMS)
    else camera.step()
    scene.draw(hovered, work, camera.zoom())
    // The figures are read once a second, as every figure of the game.
    // The end too, whenever it falls: the game stops on its tick, which may
    // not begin a second.
    const beat = Math.floor(state.tick / 10)
    const over = state.winner !== NO_ONE
    if (beat !== reported || (over && !announced)) {
      reported = beat
      announced = over
      if (!found && me >= 0 && state.tick >= state.rules.openingTicks) {
        found = true
        const box = home()
        if (box) camera.focus(box)
      }
      hooks.onSummary(summarize(state, me, { army, work }))
    }
  })

  const frame = new ResizeObserver(() => {
    app.resize()
    camera.resize()
    scene.resize()
  })
  frame.observe(element)

  return {
    destroy() {
      app.canvas.removeEventListener('pointermove', onPointer)
      app.canvas.removeEventListener('pointerdown', onPointer)
      frame.disconnect()
      input?.destroy()
      window.removeEventListener('keydown', onKey)
      camera.destroy()
      app.destroy(true, { children: true, texture: true, textureSource: true })
    },
    choose(next) {
      army = next
      work = null
      refresh()
    },
    hold(next) {
      work = next
      refresh()
    },
    close: unpin,
    treat(type, target) {
      session.send({ player: me, type, target })
      unpin()
    },
  }
}
