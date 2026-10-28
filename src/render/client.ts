import { Application } from 'pixi.js'
import { NO_ONE } from '../../engine'
import { makeAiming } from './aiming'
import { makeCamera } from './camera'
import { makeInput } from './input'
import { makeHand } from './hand'
import { TONE } from './palette'
import { takeLand } from './ahead'
import { makeDirector } from './director'
import { landBox, tileAt } from './marks'
import { makeScene } from './scene'
import { startSession } from './session'
import { startRemoteSession } from './remote'
import { makeNews } from './news'
import { summarize } from './summary'
import { makeEarnings } from './earnings'
import type { Aim } from './aiming'
import type { News } from './news'
import type { Room } from './director'
import type { Army, Coup, Level, MapSize, Work } from '../../engine'
import type { Summary } from './summary'
import type { Online } from './online'

// The game on screen, the land taken bit by bit: the manuscript map
// of the game, its lands spreading tile by tile as in OpenFront, with its
// villages, works and armies. A click on another's land raises the army in
// hand (1 to 3: a raid, a host, the whole levy) and sends it in where the
// border is nearest the click; with a work in hand (4 to 6: a village, a
// castle, a market), a click on one's own land builds it there; with a coup
// in hand (7 to 9: a troublemaker, archers, Greek fire), a click launches it
// at the land clicked (hand.ts).

export type GameHandle = {
  destroy: () => void
  choose: (army: Army) => void
  hold: (work: Work | null) => void
  /** A coup taken in hand, or put down. */
  aim: (coup: Coup | null) => void
  close: () => void
  /** An order about another lord: to offer or accept an alliance, renew it, or break it. */
  treat: (type: 'ally' | 'breakAlliance', target: number) => void
  /** The camera: one step closer (1) or farther (-1), back to the player's land. */
  zoom: (step: 1 | -1) => void
  home: () => void
}

export type { Summary } from './summary'
export type { Aim } from './aiming'
export type { News } from './news'
export { prepareGame, randomSeed } from './ahead'
export { faces } from './faces'

export async function mountGame(
  element: HTMLElement,
  seed: string | null,
  me: number,
  hooks: {
    onSummary: (summary: Summary) => void
    /** The pointer over land a click would strike, or the one right clicked; none elsewhere. */
    onAim: (aim: Aim | null) => void
    /** What happened in the last second that the player should read. */
    onNews?: (news: Array<News>) => void
    names: Array<string>
    /** The bots' level, chosen at the home; normal if none. */
    level?: Level
    /** The land's size; standard if none, and online. */
    size?: MapSize
    /** Watching alone, the camera directed (director.ts), so many pixels on the left left to a menu. */
    spectate?: () => Room
    /** A game online (online.ts): its land, its turns and my seat come from the relay. */
    online?: Online
  },
): Promise<GameHandle> {
  const app = new Application()
  // Online, the standard land: the relay sends no size yet.
  const { land, grid } = takeLand(hooks.online?.seed ?? seed, hooks.size)
  await app.init({
    preference: 'webgl',
    resizeTo: element,
    background: TONE.edge,
    antialias: true,
    // Behind the home's menu, fewer pixels: a sharp game is not worth it there.
    resolution: Math.min(devicePixelRatio || 1, hooks.spectate ? 1.5 : 2),
    autoDensity: true,
  })
  element.appendChild(app.canvas)
  const session = hooks.online
    ? startRemoteSession(
        grid,
        land.seed,
        me,
        hooks.online.level,
        hooks.online.players,
        hooks.online.link,
      )
    : startSession(grid, land.seed, me, hooks.level)
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

  const hand = makeHand()
  let hovered = -1
  // The aim pinned by a right click.
  let pinned: Aim | null = null
  const aiming = makeAiming(app.canvas, state, me, scene.world)
  const aimAt = (tile: number, pin: boolean) => aiming.at(tile, pin, hand.hand)

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
    else {
      const held = hand.holding()
      session.send(hand.order(me, tile))
      if (held) refresh()
    }
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
    if (e.key === 'Escape') unpin()
    if (hand.key(e.key)) refresh()
  }
  /** The figures and the aim again, after what is in hand changed. */
  function refresh() {
    hooks.onSummary(summarize(state, me, hand.hand, earnings.total()))
    if (!pinned) hooks.onAim(aimAt(hovered, false))
  }
  if (me >= 0) window.addEventListener('keydown', onKey)

  let drawn = false
  let found = false
  let reported = -1
  const news = makeNews(state, me)
  const earnings = makeEarnings(me)
  let announced = false
  app.ticker.add((ticker) => {
    // How far the game is into its next tick, for what moves between two.
    const between = drawn
      ? session.advance(Math.min(ticker.elapsedMS, 1000), () =>
          earnings.watch(state),
        )
      : 0
    drawn = true
    if (director) director.step(ticker.elapsedMS)
    else camera.step()
    // Farther than the whole land, the names shrink with it (the director never goes so far).
    const far = director ? 1 : Math.min(1, camera.level())
    scene.draw(hovered, hand.hand, camera.zoom(), between, far)
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
      hooks.onSummary(summarize(state, me, hand.hand, earnings.total()))
      const fresh = news.read()
      if (fresh.length > 0) hooks.onNews?.(fresh)
    }
  })

  const frame = new ResizeObserver(() => {
    app.resize()
    camera.resize()
  })
  frame.observe(element)

  return {
    destroy() {
      aiming.destroy()
      frame.disconnect()
      input?.destroy()
      window.removeEventListener('keydown', onKey)
      camera.destroy()
      // The textures stay: the fonts' and the stamps' are shared with the
      // next game on the page, which a destroyed one would break.
      app.destroy(true, { children: true })
      scene.destroy()
      hooks.online?.link.close()
    },
    choose(next) {
      hand.choose(next)
      refresh()
    },
    hold(next) {
      hand.hold(next)
      refresh()
    },
    aim(next) {
      hand.aim(next)
      refresh()
    },
    close: unpin,
    zoom: (step) => camera.zoomBy(step),
    home: () => camera.home(),
    treat(type, target) {
      session.send({ player: me, type, target })
      unpin()
    },
  }
}
