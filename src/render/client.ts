import { NO_ONE, hostSetup } from '../../engine'
import { makeAiming } from './aiming'
import { makePin } from './pin'
import { makeCamera } from './camera'
import { makeHand } from './hand'
import { landAsked, takeLand } from './ahead'
import { makeApp } from './app'
import { menuFrom, seeking } from './clicks'
import { makeControls } from './controls'
import { makePerf } from './perf'
import { landBox } from './marks'
import { makeScene } from './scene'
import { openSession } from './sessions'
import { standCamera } from './still'
import { makeNews } from './news'
import { makeNotes } from './notes'
import { summarize } from './summary'
import { makeEarnings } from './earnings'
import { makeHeralds } from './heralds'
import { makeRecord } from './record'
import { makeSound } from './sound'
import { makeSpending } from './spending'
import { governFrames } from './quality'
import type { GameHandle, GameHooks } from './handle'

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
  hooks: GameHooks,
): Promise<GameHandle> {
  const { save } = hooks
  const asked = landAsked(seed, hooks)
  const { land, grid } = takeLand(asked.seed, asked.land)
  const app = await makeApp(element)
  const session = openSession(
    grid,
    { seed: land.seed, land: asked.land },
    me,
    hooks,
  )
  const { state } = session
  const scene = makeScene(app, land, me, state, hooks.names)
  const heralds = makeHeralds(scene.world, () => app.screen)
  const sound = makeSound(state, me, scene.world, () => app.screen, scene.ear)

  const home = () => (me < 0 ? null : landBox(state, me))
  const camera = makeCamera(app, scene.world, land, home)
  if (save) standCamera(camera, state, save)

  const hand = makeHand()
  const aiming = makeAiming(app.canvas, state, me, scene.world)
  const pin = makePin(
    (tile, pinned) => aiming.at(tile, pinned, hand.hand),
    hooks.onAim,
  )
  const controls = makeControls(app.canvas, scene.world, state, me, {
    send: session.send,
    hand,
    pin,
    refresh,
    sound,
  })
  /** What is in hand changed: the figures and the aim again. */
  const handed = (change: () => void) => {
    change()
    refresh()
  }
  /** The figures and the aim again: when what is in hand changed, and once a second, the land, or in the opening the standards, having moved under the pointer. */
  function refresh() {
    hooks.onSummary({
      ...summarize(state, me, hand.hand, earnings.total()),
      record: record.read(earnings.total()),
    })
    pin.again()
  }

  let drawn = false
  // A saved game stands its own camera: the player's land is not looked for.
  let found = Boolean(save)
  let reported = -1
  const spending = makeSpending(state, me)
  const news = makeNews(state, me)
  const notes = makeNotes(state)
  const earnings = makeEarnings(me)
  const record = makeRecord(state, me)
  const play = (ms: number, most?: number) =>
    session.advance(
      ms,
      () => {
        earnings.watch(state)
        sound.tick()
      },
      most,
    )
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
    // What I spent, at once: a work laid, an army raised, a coup launched
    // (« quand je construit un batiment le panel en bas ne se met pas a jour
    // immédiatement sur l'argent »).
    if (spending.changed()) refresh()
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
      sound.news(fresh)
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
      controls.destroy()
      sound.destroy()
      session.stop?.()
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
      session.launch?.(hostSetup({ ...book, seed: land.seed }))
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
