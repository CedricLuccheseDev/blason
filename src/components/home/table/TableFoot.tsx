import { Link } from '@tanstack/react-router'
import { useMessages } from '~/i18n'

const PORTFOLIO_URL = 'https://clhub.fr'

/** The rest of the site, small on the table's near edge: the version, how it works, the legal notice, the author. */
export function TableFoot() {
  const m = useMessages()
  return (
    <footer className="table-foot">
      <Link to="/blog" className="v" aria-label={m.blog.title}>
        v{__APP_VERSION__}
        {__APP_VERSION__.startsWith('0.') ? ' alpha' : ''}
      </Link>
      <Link to="/about">{m.common.about}</Link>
      <Link to="/legal">{m.common.legal}</Link>
      <a href={PORTFOLIO_URL}>{m.common.author}</a>
    </footer>
  )
}
