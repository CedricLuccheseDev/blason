import { describe, expect, it } from 'vitest'
import { UNIT, createGame } from '../../engine'
import { makeNews } from './news'

describe('the news', () => {
  it('tells an offering given me once, its gold, on the giver’s land nearest mine', () => {
    const land = Array.from({ length: 10 }, () => true)
    const grid = { width: 10, height: 1, size: 4, land, area: land.length }
    const state = createGame(grid, 3, 'test')
    for (const t of [0, 1, 2]) state.owner[t] = 0
    for (const t of [6, 7, 8, 9]) state.owner[t] = 1
    state.players[0].standard = 1
    const news = makeNews(state, 0)
    const { tick } = state
    state.offerings.push({ from: 1, to: 0, gold: 50 * UNIT + 400, tick })
    state.offerings.push({ from: 1, to: 2, gold: UNIT, tick })
    expect(news.read()).toEqual([
      { kind: 'offering', lord: 1, gold: 50, tile: 6 },
    ])
    expect(news.read()).toEqual([])
  })

  it('tells my alliances once each, offered, made and ended unbroken, on the other’s land nearest mine', () => {
    const land = Array.from({ length: 10 }, () => true)
    const grid = { width: 10, height: 1, size: 4, land, area: land.length }
    const state = createGame(grid, 3, 'test')
    for (const t of [0, 1, 2]) state.owner[t] = 0
    for (const t of [6, 7, 8, 9]) state.owner[t] = 1
    state.players[0].standard = 1
    const news = makeNews(state, 0)
    state.requests.push({ from: 1, to: 0, expires: 100 })
    state.requests.push({ from: 1, to: 2, expires: 100 })
    expect(news.read()).toEqual([
      { kind: 'pact', lord: 1, how: 'offered', tile: 6 },
    ])
    const alliance = { a: 0, b: 1, expires: 100, renewA: false, renewB: false }
    state.requests = []
    state.alliances.push(alliance)
    expect(news.read()).toEqual([
      { kind: 'pact', lord: 1, how: 'made', tile: 6 },
    ])
    expect(news.read()).toEqual([])
    state.alliances = []
    expect(news.read()).toEqual([
      { kind: 'pact', lord: 1, how: 'ended', tile: 6 },
    ])
  })
})
