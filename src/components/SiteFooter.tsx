import { Link } from '@tanstack/react-router'
import { useMessages } from '~/i18n'

const PORTFOLIO_URL = 'https://clhub.fr'

// Shared chrome: one shape across every project (hairline above, max-w-7xl,
// identity left, actions right), mounted once in __root.
// The version comes from package.json at build time (see vite.config.ts), so
// what the footer shows is exactly what is deployed.
export function SiteFooter() {
  const m = useMessages()
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-hairline">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-5 px-5 py-8 text-xs text-dim">
        <p className="font-mono">© {year} Cédric Lucchese</p>
        <div className="flex flex-wrap items-center gap-4">
          <a href={PORTFOLIO_URL} className="transition-colors hover:text-ink">
            {m.common.author}
          </a>
          <Link to="/about" className="transition-colors hover:text-ink">
            {m.common.about}
          </Link>
          <Link to="/legal" className="transition-colors hover:text-ink">
            {m.common.legal}
          </Link>
          <Link
            to="/blog"
            aria-label={m.blog.title}
            className="font-mono transition-colors hover:text-ink"
          >
            v{__APP_VERSION__}
            {__APP_VERSION__.startsWith('0.') ? ' alpha' : ''}
          </Link>
        </div>
      </div>
    </footer>
  )
}
