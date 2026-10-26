import { describe, expect, it } from 'vitest'
import { overlayPosts, parsePosts } from './posts'
import type { Post } from './posts'

const md = (title: string, date: string, body = 'Hello.') =>
  `---\ntitle: ${title}\ndate: ${date}\nexcerpt: e\n---\n\n${body}\n`

const post = (slug: string, date: string, title = slug): Post => ({
  slug,
  date,
  title,
  excerpt: '',
  html: '',
})

describe('parsePosts', () => {
  it('reads slug and locale from the basename, prefix or not', () => {
    const posts = parsePosts({
      './posts/hello.fr.md': md('Bonjour', '2026-01-01'),
      'hello.en.md': md('Hello', '2026-01-01'),
    })

    expect(posts.fr[0].slug).toBe('hello')
    expect(posts.en[0].title).toBe('Hello')
  })

  it('drops a file without title or date, silently by design', () => {
    const posts = parsePosts({
      'bad.fr.md': '---\nexcerpt: no title\n---\ncorps',
    })

    expect(posts.fr).toEqual([])
  })

  it('ignores a name that carries no locale', () => {
    expect(parsePosts({ 'readme.md': md('t', '2026-01-01') }).en).toEqual([])
  })

  it('renders the body to HTML', () => {
    const posts = parsePosts({
      'p.en.md': md('t', '2026-01-01', '**bold**'),
    })

    expect(posts.en[0].html).toContain('<strong>bold</strong>')
  })

  it('sorts newest first', () => {
    const posts = parsePosts({
      'old.en.md': md('old', '2026-01-01'),
      'new.en.md': md('new', '2026-03-01'),
    })

    expect(posts.en.map((p) => p.slug)).toEqual(['new', 'old'])
  })
})

describe('overlayPosts', () => {
  const none = { en: [], fr: [] }

  it('adds a dropped post to the bundled ones', () => {
    const merged = overlayPosts(
      { ...none, en: [post('bundled', '2026-01-01')] },
      { ...none, en: [post('dropped', '2026-02-01')] },
    )

    expect(merged.en.map((p) => p.slug)).toEqual(['dropped', 'bundled'])
  })

  it('lets the drop directory replace a bundled slug', () => {
    const merged = overlayPosts(
      { ...none, en: [post('same', '2026-01-01', 'bundled version')] },
      { ...none, en: [post('same', '2026-01-01', 'dropped version')] },
    )

    expect(merged.en).toHaveLength(1)
    expect(merged.en[0].title).toBe('dropped version')
  })

  it('keeps locales independent', () => {
    const merged = overlayPosts(
      { ...none, fr: [post('seul', '2026-01-01')] },
      { ...none, en: [post('alone', '2026-01-01')] },
    )

    expect(merged.fr.map((p) => p.slug)).toEqual(['seul'])
    expect(merged.en.map((p) => p.slug)).toEqual(['alone'])
  })

  it('changes nothing when nothing was dropped', () => {
    const bundled = { ...none, en: [post('a', '2026-01-01')] }

    expect(overlayPosts(bundled, none).en).toEqual(bundled.en)
  })
})
