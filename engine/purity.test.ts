import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// The engine and its bots must play the same game on every machine. These calls can
// differ from one browser to another, or depend on the moment they run.
const FORBIDDEN = [
  /Math\.(random|sin|cos|tan|asin|acos|atan2?|pow|exp|log\w*|sqrt|cbrt|hypot)\b/,
  /[\w)\]]\s*\*\*\s*[\w(]/,
  /Date\.now|new Date|performance\./,
  /from 'react'|from 'convex/,
]

function sources(dir: string): Array<string> {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return sources(path)
    const isCode = path.endsWith('.ts') && !path.endsWith('.test.ts')
    return isCode ? [path] : []
  })
}

describe('purity of the engine and the bots', () => {
  it('uses nothing that could change from one machine to another', () => {
    const dirs = [import.meta.dirname]
    const offences = dirs
      .flatMap(sources)
      .flatMap((path) =>
        FORBIDDEN.filter((pattern) =>
          pattern.test(readFileSync(path, 'utf8')),
        ).map((pattern) => `${path}: ${pattern}`),
      )
    expect(offences).toEqual([])
  })
})
