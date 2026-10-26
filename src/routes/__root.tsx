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
import { LocaleProvider } from '~/i18n'
import { getLocale } from '~/i18n/locale'

export const Route = createRootRoute({
  // The locale never changes within a session — don't refetch on navigation.
  loader: () => getLocale(),
  staleTime: Infinity,
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Blason' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700&display=swap',
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
