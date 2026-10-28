import { Link } from '@tanstack/react-router'
import type { Touch } from './Overlays'
import { useMessages } from '~/i18n'

// The journal open on the table: the newest posts of the blog, their date
// and their title, on its two pages; raised to be read, each one leads to
// its post, and the last line to the whole journal.

export type Entry = { slug: string; title: string; date: string }

function Item({
  entry,
  reading,
}: Readonly<{ entry: Entry; reading: boolean }>) {
  return (
    <Link
      to="/blog/$slug"
      params={{ slug: entry.slug }}
      className="item"
      tabIndex={reading ? 0 : -1}
    >
      <time dateTime={entry.date}>{entry.date}</time>
      <span>{entry.title}</span>
    </Link>
  )
}

export function Journal({
  entries,
  reading,
  touch,
}: Readonly<{ entries: Array<Entry>; reading: boolean; touch: Touch }>) {
  const t = useMessages().table
  const pageClass = reading ? 'ovi reading' : 'ovi'
  return (
    <>
      <div className={pageClass} data-ov="page-l">
        <div className="pg">
          <h2>{t.journal}</h2>
          {entries.slice(0, 1).map((e) => (
            <Item key={e.slug} entry={e} reading={reading} />
          ))}
          <button
            type="button"
            className="hit"
            aria-label={t.readJournal}
            aria-expanded={reading}
            onClick={() => touch.act({ kind: 'book' })}
            onFocus={() => touch.focus({ kind: 'book' })}
            onBlur={() => touch.focus(null)}
          />
        </div>
      </div>
      <div className={pageClass} data-ov="page-r">
        <div className="pg">
          {entries.slice(1, 3).map((e) => (
            <Item key={e.slug} entry={e} reading={reading} />
          ))}
          <Link to="/blog" className="item more" tabIndex={reading ? 0 : -1}>
            {t.allJournal}
          </Link>
        </div>
      </div>
    </>
  )
}
