// Frontmatter reader for the Markdown posts: a `---` fenced block of
// `key: value` lines at the top of the file. Deliberately not YAML — a post
// only ever carries flat string fields, so a parser dependency would buy
// nothing and let a post grow structure the blog cannot render.
export type Frontmatter = Record<string, string | undefined>

const FENCE = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/

export function parseFrontmatter(source: string): {
  data: Frontmatter
  body: string
} {
  // Editors and git checkouts both hand out BOMs; one would hide the fence.
  const text = source.replace(/^\uFEFF/, '')
  const fence = FENCE.exec(text)
  if (!fence) return { data: {}, body: text.trim() }

  const data: Frontmatter = {}
  for (const line of fence[1].split(/\r?\n/)) {
    const separator = line.indexOf(':')
    if (separator < 1) continue
    const key = line.slice(0, separator).trim()
    if (key.startsWith('#')) continue
    data[key] = unquote(line.slice(separator + 1).trim())
  }

  return { data, body: text.slice(fence[0].length).trim() }
}

function unquote(value: string): string {
  const quoted =
    value.length >= 2 &&
    (value.startsWith('"') || value.startsWith("'")) &&
    value.endsWith(value[0])
  return quoted ? value.slice(1, -1) : value
}
