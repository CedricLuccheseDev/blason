import { createFileRoute } from '@tanstack/react-router'
import { llmsTxt } from '~/lib/machine.server'

export const Route = createFileRoute('/llms.txt')({
  server: {
    handlers: {
      GET: async () =>
        new Response(await llmsTxt(), {
          headers: {
            'content-type': 'text/markdown; charset=utf-8',
            'cache-control': 'public, max-age=3600',
          },
        }),
    },
  },
})
