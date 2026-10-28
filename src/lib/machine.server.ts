import { loadPosts } from '~/content/posts.runtime'
import { SITE_URL } from '~/lib/site'

// What a machine receives: every public address (the sitemap) and a summary
// in Markdown (llms.txt), generated from the same routes and posts as the
// pages so that they never lie. Server module.

/** The public pages, the legal notice aside (it carries noindex). */
const PAGES = ['/', '/play', '/about', '/blog']

async function blogPosts() {
  const slugs = new Set(
    [...(await loadPosts('fr')), ...(await loadPosts('en'))].map((p) => p.slug),
  )
  return [...slugs].map((slug) => `/blog/${slug}`)
}

export async function sitemapXml() {
  const urls = [...PAGES, ...(await blogPosts())]
  const date = new Date().toISOString().slice(0, 10)
  const esc = (s: string) => s.replace(/&/g, '&amp;')
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls
      .map(
        (u) =>
          `<url><loc>${esc(SITE_URL + u)}</loc><lastmod>${date}</lastmod></url>`,
      )
      .join('\n') +
    '\n</urlset>\n'
  )
}

export async function llmsTxt() {
  const posts = await loadPosts('en')
  const blog = posts.length
    ? [
        '## Journal',
        '',
        ...posts.map(
          (p) =>
            `- [${p.title}](${SITE_URL}/blog/${p.slug}) (${p.date}): ${p.excerpt}`,
        ),
        '',
      ]
    : []
  return [
    '# Blason',
    '',
    '> A medieval real-time strategy game in the browser, inspired by OpenFront: twenty lords on a land drawn anew each game take it from one another tile by tile. Peasants hold the land and are raised as armies, gold pays for works, alliances are short, traitors are marked, merchants carry gold between markets. Played alone against nineteen bots for now; the simulation is deterministic, ready for lockstep multiplayer. Free software under the AGPL-3.0.',
    '',
    '## Pages',
    '',
    `- [Home](${SITE_URL}/): a title screen, with a game of bots filmed behind the menu.`,
    `- [Play](${SITE_URL}/play): a game against nineteen bots; the land is chosen during the first ten seconds.`,
    `- [How it works](${SITE_URL}/about): the land from a seed, the step of a game, from the state to the screen.`,
    `- [Journal](${SITE_URL}/blog): what was written and what shipped.`,
    `- [Legal](${SITE_URL}/legal)`,
    '',
    ...blog,
    '## The game',
    '',
    '- Three armies raised from the peasants: the raid (10 %), the host (25 %), the levy (50 %). An army enters by the border nearest the click and spreads at most three tiles a tick; each tile costs the men who hold it.',
    '- Villages feed more peasants, castles hold their land three times better, markets send caravans to other lords’ markets.',
    '- Alliances last five minutes; breaking one marks the breaker a traitor for thirty seconds.',
    '- A lord wins with 80 % of the land, a share that drops from the tenth minute down to 50 %.',
    '',
  ].join('\n')
}
