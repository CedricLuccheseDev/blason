import { Application } from 'pixi.js'
import { NO_ONE, hostSetup } from '../../engine'
import { makeAiming } from './aiming'
import { makePin } from './pin'
import { makeCamera } from './camera'
import { makeInput } from './input'
import { makeHand } from './hand'
import { TONE } from './palette'
import { takeLand } from './ahead'
import { makeClick, makeKeys, menuFrom, seeking } from './clicks'
import { makePerf } from './perf'
import { landBox, tileAt } from './marks'
import { makeScene } from './scene'
import { openSession } from './sessions'
import { standCamera } from './still'
import { makeNews } from './news'
import { makeNotes } from './notes'
import { summarize } from './summary'
import { makeEarnings } from './earnings'
import { makeHeralds } from './heralds'
import { bestQuality, governFrames } from './quality'
import type { GameHandle } from './handle'
import type { Aim } from './aiming'
import type { News } from './news'
import type { Book, Level, MapSize } from '../../engine'
import type { Summary } from './summary'
import type { Online } from './online'
import type { Save } from './save'

// The game on screen, the land taken bit by bit: the manuscript map
// of the game, its lands spreading tile by tile as in OpenFront, with its
// villages, works and armies. A click on another's land raises the army in
// hand (1 to 4: a raid, a host, the whole levy, mercenaries) and sends it in
// by the border that brings it soonest to the click; with a work in hand (5
// to 7: a village, a market, a castle), a click on one's own land builds it there;
// with a coup in hand (8, 9 and 0: archers, a troublemaker, a trebuchet), a
// click launches it at the land clicked (hand.ts). A right click on another
// lord's land opens his menu there: the army in hand to send, the alliance,
// an offering.

export type { GameHandle } from './handle'
export type { Summary } from './summary'
export type { Aim } from './aiming'
export type { News } from './news'
export type { Herald, Heralds } from './heralds'
export { prepareGame, randomSeed } from './ahead'
export { faces } from './faces'

/** Ticks a frame plays at most, catching up on turns that piled up: the rest at the next frames, never a freeze. */
const CATCH_UP = 20

export async function mountGame(
  element: HTMLElement,
  seed: string | null,
  me: number,
  hooks: {
    onSummary: (summary: Summary) => void
    /** The pointer over land a click would strike, or another lord's land right clicked, for his menu; none elsewhere. */
    onAim: (aim: Aim | null) => void
    /** What happened in the last second that the player should read. */
    onNews?: (news: Array<News>) => void
    names: Array<string>
    /** The bots' level, chosen at the home; normal if none. */
    level?: Level
    /** The land's size; standard if none. Online, the relay's. */
    size?: MapSize
    /** A game online (online.ts): its land, its turns and my seat come from the relay. */
    online?: Online
    /** The host's game, held while he sets it in his book (« créer une partie »), its land the one asked. */
    book?: Book
    /** A saved game (save.ts), held still at its tick: its land, my seat and the camera come from it. */
    save?: Save
  },
): Promise<GameHandle> {
  const app = new Application()
  const { save } = hooks
  // Online, the relay says the land; a save says its own.
  const online = hooks.online?.setup
  const asked = online
    ? { seed: online.seed, size: online.land.size }
    : (save ?? { seed, size: hooks.size })
  const { land, grid } = takeLand(asked.seed, asked.size)
  await app.init({
    preference: 'webgl',
    resizeTo: element,
    background: TONE.edge,
    antialias: true,
    resolution: bestQuality().resolution,
    autoDensity: true,
    // The game reads its own gestures and has no filters: neither pixi's
    // events, which test the whole map under every move, nor its filters,
    // its DOM layer or its accessibility overlay are loaded.
    skipExtensionImports: true,
  })
  element.appendChild(app.canvas)
  const session = openSession(grid, land, me, hooks)
  const { state } = session
  const scene = makeScene(app, land, me, state, hooks.names)
  const heralds = makeHeralds(scene.world, () => app.screen)

  const home = () => (me < 0 ? null : landBox(state, me))
  const camera = makeCamera(app, scene.world, land, home)
  if (save) standCamera(camera, state, save)

  const pick = (x: number, y: number) => tileAt(grid, x, y)

  const hand = makeHand()
  const aiming = makeAiming(app.canvas, state, me, scene.world)
  const pin = makePin(
    (tile, pinned) => aiming.at(tile, pinned, hand.hand),
    hooks.onAim,
  )
  const click = makeClick(state, me, session.send, hand, pin.dismisses, refresh)
  const input =
    me >= 0
      ? makeInput(app.canvas, scene.world, pick, {
          hover: pin.hover,
          click,
          menu: pin.open,
          away: pin.close,
        })
      : null
  const onKey = makeKeys(pin.close, hand, refresh)
  /** What is in hand changed: the figures and the aim again. */
  const handed = (change: () => void) => {
    change()
    refresh()
  }
  /** The figures and the aim again: when what is in hand changed, and once a second, the land, or in the opening the standards, having moved under the pointer. */
  function refresh() {
    hooks.onSummary(summarize(state, me, hand.hand, earnings.total()))
    pin.again()
  }
  if (me >= 0) window.addEventListener('keydown', onKey)

  let drawn = false
  // A saved game stands its own camera: the player's land is not looked for.
  let found = Boolean(save)
  let reported = -1
  const news = makeNews(state, me)
  const notes = makeNotes(state)
  const earnings = makeEarnings(me)
  const play = (ms: number, most?: number) =>
    session.advance(ms, () => earnings.watch(state), most)
  // Stepped down and up with the frames; nothing drawn while hidden
  // (quality.ts): a game alone waits, one online plays the relay's turns on.
  // A saved game, held still, is drawn at its best.
  const governed = save
    ? () => undefined
    : governFrames(app, 1000 / 60, hooks.online && play)
  let announced = false
  const perf = makePerf(
    app,
    new URLSearchParams(window.location.search).has('perf'),
  )
  app.ticker.add((ticker) => {
    perf.frame()
    // How far the game is into its next tick, for what moves between two.
    const between = drawn
      ? perf.measure('jeu', () =>
          play(Math.min(ticker.elapsedMS, 1000), CATCH_UP),
        )
      : 0
    drawn = true
    camera.step()
    // Farther than the whole land, the names shrink with it.
    const far = Math.min(1, camera.level())
    scene.draw(
      pin.hovered(),
      hand.hand,
      camera.zoom(),
      between,
      far,
      perf.measure,
    )
    const now = performance.now() / 1000
    heralds.show([...scene.anchors(), ...notes.anchors(now)])
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
      refresh()
      const fresh = news.read()
      notes.tell(fresh, now)
      if (fresh.length > 0) hooks.onNews?.(fresh)
    }
    perf.mark()
  })

  const frame = new ResizeObserver(() => {
    app.resize()
    camera.resize()
  })
  frame.observe(element)

  return {
    destroy() {
      perf.destroy()
      aiming.destroy()
      frame.disconnect()
      governed()
      input?.destroy()
      window.removeEventListener('keydown', onKey)
      camera.destroy()
      // The textures stay: the fonts' and the stamps' are shared with the
      // next game on the page, which a destroyed one would break.
      app.destroy(true, { children: true })
      scene.destroy()
      hooks.online?.link.close()
    },
    choose: (next) => handed(() => hand.choose(next)),
    hold: (next) => handed(() => hand.hold(next)),
    aim: (next) => handed(() => hand.aim(next)),
    leave: pin.leave,
    zoom: (step) => camera.zoomBy(step),
    home: () => camera.home(),
    heralds: heralds.listen,
    light: scene.light,
    menu: menuFrom(state, aiming.point, pin.open),
    ...seeking(scene, camera),
    launch(book) {
      session.launch?.(hostSetup({ ...book, seed: land.seed, size: land.size }))
      refresh()
    },
    attack() {
      const tile = pin.menuAt()
      const { army } = hand.hand
      if (tile >= 0) session.send({ player: me, type: 'attack', tile, army })
      pin.close()
    },
    treat(type, target) {
      session.send({ player: me, type, target })
      pin.close()
    },
  }
}
