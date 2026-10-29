import { Link } from '@tanstack/react-router'
import { Figure } from '~/components/hud/Figure'
import { Inline } from '~/components/hud/Layout'
import { useMessages } from '~/i18n'

// The rest of the site, small at the foot of the home: the version, how it
// works, the legal notice, the author.

const PORTFOLIO_URL = 'https://clhub.fr'

/** A link at the foot: discreet, tall enough for a finger, gilt under the pointer as the journal's. */
const FOOT =
  'hud-note hud-press inline-flex min-h-11 items-center hover:text-gilt-deep'

export function Foot() {
  const m = useMessages()
  return (
    <footer>
      <Inline gap="piece" justify="center" wrap>
        <Link to="/blog" className={FOOT} aria-label={m.blog.title}>
          <Figure size="s">
            v{__APP_VERSION__}
            {__APP_VERSION__.startsWith('0.') ? ' alpha' : ''}
          </Figure>
        </Link>
        <Link to="/about" className={FOOT}>
          {m.common.about}
        </Link>
        <Link to="/legal" className={FOOT}>
          {m.common.legal}
        </Link>
        <a href={PORTFOLIO_URL} className={FOOT}>
          {m.common.author}
        </a>
      </Inline>
    </footer>
  )
}
