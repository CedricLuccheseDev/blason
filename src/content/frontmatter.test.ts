import { describe, expect, it } from 'vitest'
import { parseFrontmatter } from './frontmatter'

describe('parseFrontmatter', () => {
  it('reads the fenced fields and returns the rest as the body', () => {
    const { data, body } = parseFrontmatter(
      '---\ntitle: Why Downlink\ndate: 2026-08-06\n---\n\nFirst line.\n',
    )

    expect(data).toEqual({ title: 'Why Downlink', date: '2026-08-06' })
    expect(body).toBe('First line.')
  })

  it('keeps colons that belong to the value', () => {
    const { data } = parseFrontmatter('---\ntitle: Gate: a story\n---\nx')

    expect(data.title).toBe('Gate: a story')
  })

  it('drops the quotes an editor may have added', () => {
    const { data } = parseFrontmatter(
      '---\ntitle: "Free download"\nexcerpt: \'30 percent\'\n---\nx',
    )

    expect(data).toEqual({ title: 'Free download', excerpt: '30 percent' })
  })

  it('survives a BOM, CRLF line endings and a comment line', () => {
    const { data, body } = parseFrontmatter(
      '﻿---\r\n# note\r\ntitle: Windows\r\n---\r\nBody.\r\n',
    )

    expect(data).toEqual({ title: 'Windows' })
    expect(body).toBe('Body.')
  })

  it('treats a file without a fence as pure body', () => {
    const { data, body } = parseFrontmatter('No fence here.\n')

    expect(data).toEqual({})
    expect(body).toBe('No fence here.')
  })

  it('does not mistake a horizontal rule for a fence', () => {
    const { body } = parseFrontmatter('Intro.\n\n---\n\nMore.')

    expect(body).toBe('Intro.\n\n---\n\nMore.')
  })
})
