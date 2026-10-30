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
