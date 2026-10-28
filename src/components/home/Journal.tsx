import { Link } from '@tanstack/react-router'
import { Sheet } from '~/components/hud/Sheet'
import { useMessages } from '~/i18n'

// The journal beside the menu, as OpenFront's news: the newest posts of the
// blog, their date and their title, each leading to its post, and the way
// to the whole journal.

export type Entry = { slug: string; title: string; date: string }

const SHOWN = 4

/** A line of the journal, gilt when it is pointed at. */
const LINE =
  'hud-press flex min-h-11 flex-col justify-center font-fell text-hud-m text-quill hover:text-gilt-deep'

export function Journal({ entries }: Readonly<{ entries: Array<Entry> }>) {
  const t = useMessages().home
  return (
    <Sheet className="flex flex-col gap-2 p-4">
      <h2 className="font-caps text-hud-l leading-none text-quill">
        {t.journal}
      </h2>
      <ul className="flex flex-col">
        {entries.slice(0, SHOWN).map((e) => (
          <li key={e.slug}>
            <Link to="/blog/$slug" params={{ slug: e.slug }} className={LINE}>
              <time
                dateTime={e.date}
                className="hud-figure text-hud-s opacity-70"
              >
                {e.date}
              </time>
              <span className="leading-tight">{e.title}</span>
            </Link>
          </li>
        ))}
      </ul>
      <Link to="/blog" className={`${LINE} italic`}>
        {t.allJournal}
      </Link>
    </Sheet>
  )
}
