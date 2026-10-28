import { createFileRoute } from '@tanstack/react-router'
import { sitemapXml } from '~/lib/machine.server'

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async () =>
        new Response(await sitemapXml(), {
          headers: {
            'content-type': 'application/xml; charset=utf-8',
            'cache-control': 'public, max-age=3600',
          },
        }),
    },
  },
})
