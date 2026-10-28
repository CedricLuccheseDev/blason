import { BitmapText, Container, Graphics, TextStyle } from 'pixi.js'
import { UNIT, marching, positionOf } from '../../engine'
import { drawSoldier } from './art/soldier'
import { makeMelee, rankOf } from './layers/melee'
import { headOf, makeColumns, pointOn } from './layers/column'
import { TONE, playerColor } from './palette'
import { siteOf } from './marks'
import type { GameState, Host, Point } from '../../engine'
import type { Clash } from './layers/melee'
import type { Stamps } from './textures'

// The armies. On its road from its barracks, an army walks in a column
// (layers/column.ts); where it bites into a land, at the tiles it took last,
// two ranks of soldiers fight, its own facing the land's; where two armies
// meet, their ranks face each other. Over each army, its men in a pill of its
// lord's colour. Sized on screen; the soldiers at the land's scale.

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

/** Where an army stands now: its head on its road while it marches, else where it fights. */
function standing(state: GameState, host: Host, between: number) {
  if (marching(host))
    return pointOn(state, host.road, headOf(state, host, between))
  return siteOf(state, positionOf(host))
}

/** The battles between armies: their ranks face each other halfway between them. */
function battlesOf(state: GameState, between: number): Array<Clash> {
  const fighting = state.hosts.filter((h) => h.fighting)
  const reach = state.rules.meetTiles * state.grid.size
  const battles: Array<Clash> = []
  fighting.forEach((a, i) => {
    for (const b of fighting.slice(i + 1)) {
      if (a.owner === b.owner) continue
      const p = standing(state, a, between)
      const q = standing(state, b, between)
      const d = Math.hypot(p.x - q.x, p.y - q.y)
      if (d > reach * 1.5) continue
      const out: Point = d > 0 ? [(p.x - q.x) / d, (p.y - q.y) / d] : [1, 0]
      battles.push({
        at: [(p.x + q.x) / 2, (p.y + q.y) / 2],
        out,
        colors: [playerColor(a.owner), playerColor(b.owner)],
        ranks: [rankOf(a.men / UNIT / 4), rankOf(b.men / UNIT / 4)],
        seed: a.from + b.from,
      })
    }
  })
  return battles
}

/** The armies: their columns on the road, their soldiers fighting where they bite or meet, their men. */
export function makeArmies(stamps: Stamps) {
  const container = new Container()
  const columns = makeColumns(stamps)
  const melee = makeMelee(stamps, MELEE)
  container.addChild(columns.container, melee.container)
  const pills = new Map<Host, ReturnType<typeof makePill>>()

  /** Each army's men in a pill over where it fights; a pill goes with its army. */
  function count(state: GameState, zoom: number, between: number) {
    for (const [host, pill] of pills) {
      if (state.hosts.includes(host)) continue
      pill.box.destroy({ children: true })
      pills.delete(host)
    }
    for (const host of state.hosts) {
      let pill = pills.get(host)
      if (!pill) {
        pill = makePill(playerColor(host.owner))
        pills.set(host, pill)
        container.addChild(pill.box)
      }
      const at =
        marching(host) || host.fighting || host.edge.length === 0
          ? standing(state, host, between)
          : middle(state, host.edge)
      pill.box.position.set(at.x, at.y - 16 / zoom)
      pill.show(Math.floor(host.men / UNIT), null, zoom)
    }
  }

  return {
    container,
    draw(state: GameState, zoom: number, between = 0) {
      columns.draw(state, zoom, between)
      const bites = state.hosts
        .filter((h) => !marching(h) && !h.fighting)
        .flatMap((h) => clashesOf(state, h))
      const fights = [...battlesOf(state, between), ...bites]
      melee.draw(fights.slice(0, CLASHES), performance.now() / 1000)
      count(state, zoom, between)
    },
  }
}
