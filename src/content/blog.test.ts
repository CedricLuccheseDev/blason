import { describe, expect, it } from 'vitest'
import { mergeCards } from './blog'
import type { Post } from './posts'
import type { Release } from './changelog'

const post = (slug: string, date: string): Post => ({
  slug,
  date,
  title: slug,
  excerpt: '',
  html: '',
})

const release = (version: string, date: string): Release => ({
  version,
  date,
  en: [`${version} en`],
  fr: [`${version} fr`],
})

describe('mergeCards', () => {
  it('interleaves posts and releases, newest first', () => {
    const cards = mergeCards(
      [post('older', '2026-01-10'), post('newer', '2026-03-01')],
      [release('1.1.0', '2026-02-01'), release('1.0.0', '2026-01-01')],
      'en',
    )

    expect(cards.map((card) => card.date)).toEqual([
      '2026-03-01',
      '2026-02-01',
      '2026-01-10',
      '2026-01-01',
    ])
  })

  it('puts the post first when it ships the same day as a release', () => {
    const cards = mergeCards(
      [post('launch', '2026-02-01')],
      [release('1.1.0', '2026-02-01')],
      'en',
    )

    expect(cards.map((card) => card.kind)).toEqual(['post', 'release'])
  })

  it('takes the release lines of the requested locale', () => {
    const [card] = mergeCards([], [release('1.0.0', '2026-01-01')], 'fr')

    expect(card).toMatchObject({ kind: 'release', lines: ['1.0.0 fr'] })
  })

  it('returns nothing when neither posts nor releases exist', () => {
    expect(mergeCards([], [], 'en')).toEqual([])
  })
})
