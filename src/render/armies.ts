import { BitmapText, Container, Graphics, TextStyle } from 'pixi.js'
import { UNIT } from '../../engine'
import { drawSoldier } from './art/soldier'
import { makeMelee, rankOf } from './layers/melee'
import { TONE, playerColor } from './palette'
import { siteOf } from './marks'
import type { GameState, Host, Point } from '../../engine'
import type { Clash } from './layers/melee'
import type { Stamps } from './textures'

// The armies on the march. Where an army bites into a land, at the tiles it
// took last, two ranks of soldiers fight, its own facing the land's; over
// them, its men in a pill of its lord's colour. One watches the wash of its
// colour spread from where it entered. Sized on screen; the soldiers at the
// land's scale.

const SHARP = 8
const LIGHT = 0xfbf4e2
const figures = new TextStyle({
  fontFamily: "'Alegreya Sans', 'Trebuchet MS', sans-serif",
  fontWeight: '900',
  fontSize: 14 * SHARP,
  fill: LIGHT,
  stroke: { color: TONE.ink, width: 3 * SHARP, join: 'round' },
})

/** A coin of gold, centred on (0, 0), 12 units across. */
function drawCoin(g: Graphics) {
  g.circle(0, 0, 6).fill(TONE.gold).stroke({ width: 1.2, color: TONE.ink })
  g.circle(0, 0, 3.6).stroke({ width: 0.9, color: TONE.goldLight })
}

/** A pill of a lord's colour: a soldier and his men, and a coin and its gold when they cost some; centred on (0, 0). */
export function makePill(color: number) {
  const box = new Container()
  const back = box.addChild(new Graphics())
  const mark = box.addChild(new Graphics())
  drawSoldier(mark, LIGHT)
  mark.pivot.set(1.9, -4.5)
  const men = box.addChild(new BitmapText({ text: '', style: figures }))
  men.anchor.set(0, 0.5)
  const coin = box.addChild(new Graphics())
  drawCoin(coin)
  const gold = box.addChild(new BitmapText({ text: '', style: figures }))
  gold.anchor.set(0, 0.5)
  return {
    box,
    show(soldiers: number, price: number | null, zoom: number) {
      const s = 1 / zoom
      men.text = soldiers.toLocaleString('fr-FR')
      men.scale.set(s / SHARP)
      coin.visible = price !== null
      gold.visible = price !== null
      gold.text = String(price ?? '')
      gold.scale.set(s / SHARP)
      const paid = price === null ? 0 : gold.width + 26 * s
      const w = men.width + paid + 40 * s
      back
        .clear()
        .roundRect(-w / 2, -13 * s, w, 26 * s, 13 * s)
        .fill(color)
        .stroke({ width: 1.6 * s, color: TONE.ink })
      mark.scale.set((18 / 14) * s)
      mark.position.set(-w / 2 + 15 * s, 0)
      men.position.set(-w / 2 + 28 * s, 0)
      const right = -w / 2 + 28 * s + men.width
      coin.scale.set(s * 1.25)
      coin.position.set(right + 16 * s, 0)
      gold.position.set(right + 26 * s, 0)
    },
  }
}

/** World units for each size of the melee: small soldiers on a fine land. */
const MELEE = 0.2
/** Fights drawn at once at most, and places each army fights at. */
const CLASHES = 60
const PLACES = 3

/** The middle of some tiles, in map units. */
function middle(state: GameState, tiles: Array<number>) {
  let x = 0
  let y = 0
  for (const t of tiles) {
    const p = siteOf(state, t)
    x += p.x
    y += p.y
  }
  return { x: x / tiles.length, y: y / tiles.length }
}

/** An army's fights: at a few of the tiles it took last, its rank facing the land's, coming from where it entered. */
function clashesOf(state: GameState, host: Host): Array<Clash> {
  const from = siteOf(state, host.entry)
  const places = host.edge.filter((_, i) => i % 3 === 0).slice(0, PLACES)
  return places.map((tile) => {
    const p = siteOf(state, tile)
    const d = Math.hypot(from.x - p.x, from.y - p.y) || 1
    const out: Point = [(from.x - p.x) / d, (from.y - p.y) / d]
    const defender =
      host.target >= 0
        ? Math.floor(state.players[host.target].peasants / UNIT / 20)
        : 2
    return {
      at: [p.x, p.y],
      out,
      colors: [playerColor(host.owner), playerColor(host.target)],
      ranks: [rankOf(host.men / UNIT / PLACES / 4), rankOf(defender)],
      seed: tile,
    }
  })
}

/** The armies on the march: their soldiers fighting where they bite, their men. */
export function makeArmies(stamps: Stamps) {
  const container = new Container()
  const melee = makeMelee(stamps, MELEE)
  container.addChild(melee.container)
  const pills = new Map<Host, ReturnType<typeof makePill>>()

  /** Each army's men in a pill over where it fights; a pill goes with its army. */
  function count(state: GameState, zoom: number) {
    for (const [host, pill] of pills) {
      if (state.hosts.includes(host)) continue
      pill.box.destroy({ children: true })
      pills.delete(host)
    }
    for (const host of state.hosts) {
      const where = host.edge.length ? host.edge : [host.entry]
      let pill = pills.get(host)
      if (!pill) {
        pill = makePill(playerColor(host.owner))
        pills.set(host, pill)
        container.addChild(pill.box)
      }
      const at = middle(state, where)
      pill.box.position.set(at.x, at.y - 16 / zoom)
      pill.show(Math.floor(host.men / UNIT), null, zoom)
    }
  }

  return {
    container,
    draw(state: GameState, zoom: number) {
      const fights = state.hosts.flatMap((h) => clashesOf(state, h))
      melee.draw(fights.slice(0, CLASHES), performance.now() / 1000)
      count(state, zoom)
    },
  }
}
