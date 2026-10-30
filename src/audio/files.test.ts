import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { BEDS } from './beds'
import { CUES } from './cues'
import { PIECES } from './music'

// Every take the tables name is a file of public/sounds/, and credited
// there (CREDITS.md): a take renamed or forgotten is heard as silence.

const takes = [
  ...Object.values(CUES).flatMap(({ layers }) =>
    layers.flatMap(({ file }) => (typeof file === 'string' ? [file] : file)),
  ),
  ...Object.values(BEDS).flatMap(({ files }) => files),
  ...PIECES,
]
const credits = readFileSync('public/sounds/CREDITS.md', 'utf8')

describe('the sound files', () => {
  it.each(takes)('%s is there and credited', (take) => {
    expect(existsSync(`public/sounds/${take}.mp3`)).toBe(true)
    expect(credits).toContain(`\`${take}.mp3\``)
  })
})
