import { Link } from '@tanstack/react-router'
import { useMessages } from '~/i18n'

// The journal at the home's foot, as OpenFront's news but quiet: its name,
// leading to the whole journal, and the last post's line, its date and its
// title, leading to it.

export type Entry = { slug: string; title: string; date: string }

/** A link of the line: tall enough for a finger, gilt when it is pointed at. */
const LINK =
  'hud-press flex min-h-11 min-w-0 items-center gap-2 font-fell text-hud-m text-quill hover:text-gilt-deep'

export function Journal({ entries }: Readonly<{ entries: Array<Entry> }>) {
  const t = useMessages().home
  const last = entries.at(0)
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Link to="/blog" className={`${LINK} shrink-0 font-caps`}>
        {t.journal}
      </Link>
      {last && (
        <Link to="/blog/$slug" params={{ slug: last.slug }} className={LINK}>
          <time
            dateTime={last.date}
            className="hud-figure shrink-0 text-hud-s opacity-70 max-sm:hidden"
          >
            {last.date}
          </time>
          <span className="truncate">{last.title}</span>
        </Link>
      )}
    </div>
  )
}
