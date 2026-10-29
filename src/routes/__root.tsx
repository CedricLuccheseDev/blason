import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
  useRouterState,
} from '@tanstack/react-router'
import type { ReactNode } from 'react'
import appCss from '~/styles/app.css?url'
import { NotFoundScreen } from '~/components/ErrorScreens'
import { SiteFooter } from '~/components/SiteFooter'
import { SITE_URL } from '~/lib/site'
import { LocaleProvider } from '~/i18n'
import { getLocale } from '~/i18n/locale'

const DESCRIPTION =
  'A medieval real-time strategy game in the browser: twenty lords, a land drawn anew each game, taken tile by tile.'

/** The schema.org graph every page carries: the site and the game it serves. */
function siteGraph(): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', name: 'Blason', url: SITE_URL },
      {
        '@type': 'VideoGame',
        name: 'Blason',
        url: `${SITE_URL}/play`,
        description: DESCRIPTION,
        genre: 'Real-time strategy',
        gamePlatform: 'Web browser',
        playMode: 'SinglePlayer',
        applicationCategory: 'Game',
        operatingSystem: 'Any',
        isAccessibleForFree: true,
        license: 'https://www.gnu.org/licenses/agpl-3.0.html',
        author: { '@type': 'Person', name: 'Cédric Lucchese' },
      },
    ],
  }).replace(/</g, '\\u003c')
}

export const Route = createRootRoute({
  // The locale never changes within a session — don't refetch on navigation.
  loader: () => getLocale(),
  staleTime: Infinity,
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'theme-color', content: '#f6eedb' },
      { title: 'Blason' },
      { name: 'description', content: DESCRIPTION },
    ],
    scripts: [{ type: 'application/ld+json', children: siteGraph() }],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'alternate', type: 'text/markdown', href: '/llms.txt' },
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      { rel: 'icon', href: '/favicon.ico', sizes: '32x32' },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: '/favicon-32x32.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: '/favicon-16x16.png',
      },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/apple-touch-icon.png',
      },
      { rel: 'manifest', href: '/site.webmanifest' },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Alegreya+Sans:wght@700;800;900&family=Anton&family=Vollkorn:ital,wght@0,400;0,600;1,400&family=Vollkorn+SC:wght@400;600&family=Inter:wght@400;500;600;700&display=swap',
      },
      // The game's name alone is still drawn in IM Fell, as a mark: only its letters are fetched.
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=IM+Fell+English+SC&text=BLASONblason&display=swap',
      },
    ],
  }),
  notFoundComponent: NotFoundScreen,
  component: RootComponent,
})

function RootComponent() {
  const locale = Route.useLoaderData()

  return (
    <LocaleProvider locale={locale}>
      <RootDocument lang={locale}>
        <Outlet />
      </RootDocument>
    </LocaleProvider>
  )
}

function RootDocument({
  lang,
  children,
}: Readonly<{
  lang: string
  children: ReactNode
}>) {
  // A route that is a detour rather than a page (signing in) declares
  // `chrome: false` and renders on its own, with its own way back.
  const chrome = useRouterState({
    select: (s) =>
      !s.matches.some((match) => match.staticData.chrome === false),
  })

  return (
    <html lang={lang}>
      <head>
        <HeadContent />
      </head>
      <body className="flex min-h-screen flex-col">
        <div className="flex flex-1 flex-col">{children}</div>
        {chrome ? <SiteFooter /> : null}
        <Scripts />
      </body>
    </html>
  )
}
