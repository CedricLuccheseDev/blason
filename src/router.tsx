import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { ErrorScreen, NotFoundScreen } from './components/ErrorScreens'

export function getRouter() {
  return createRouter({
    routeTree,
    defaultPreload: 'intent',
    scrollRestoration: true,
    defaultErrorComponent: ErrorScreen,
    defaultNotFoundComponent: NotFoundScreen,
  })
}

declare module '@tanstack/react-router' {
  interface StaticDataRouteOption {
    /** false on routes that render without the shared header and footer. */
    chrome?: boolean
  }
}
