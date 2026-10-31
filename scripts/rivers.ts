import { readFileSync, writeFileSync } from 'node:fs'
import { riversWithin } from './earth'

// The rivers of a map of the atlas baked again, its ground left as it is
// (« il faut faire les fleuves dans les cartes France, britannique, Europe »):
// the world's main rivers of so great a rank, and Europe's own finer ones of
// so great a rank, for a small map where the main ones are few (Britain had
// two). Rewrites only the `rivers` of engine/map/atlas/<map>.ts.
// npm run rivers -- britain 9 10
// npm run rivers -- france 9 10

const [name = 'britain', rank = '7', europe = '0'] = process.argv.slice(2)
const path = `engine/map/atlas/${name}.ts`
const text = readFileSync(path, 'utf8')
const frame = ['west', 'east', 'south', 'north'].map((k) =>
  Number(new RegExp(`\\n  ${k}: (-?[\\d.]+),`).exec(text)?.[1]),
) as [number, number, number, number]
if (frame.some(Number.isNaN)) throw new Error(`No frame in ${path}`)
const rivers = await riversWithin(frame, Number(rank), Number(europe))
const block = /\n {2}rivers: \[\n[\s\S]*?\n {2}\],/
if (!block.test(text)) throw new Error(`No rivers in ${path}`)
writeFileSync(
  path,
  text.replace(
    block,
    `\n  rivers: [\n${rivers.map((r) => `    [${r.join(', ')}],`).join('\n')}\n  ],`,
  ),
)
console.log(`${name}: ${rivers.length} rivers`)
