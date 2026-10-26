import { createFileRoute } from '@tanstack/react-router'

// Client errors land in the server logs (visible in Dokploy) so production
// failures are not invisible. Payloads are truncated: this is a signal
// channel, not a log sink.
const MAX_FIELD = 2000

export const Route = createFileRoute('/api/client-error')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body: Record<string, unknown> = await request.json()
          const pick = (key: string) => {
            const value = body[key]
            return typeof value === 'string'
              ? value.slice(0, MAX_FIELD)
              : undefined
          }
          console.error('[client-error]', {
            message: pick('message'),
            stack: pick('stack'),
            url: pick('url'),
            userAgent: request.headers.get('user-agent')?.slice(0, 300),
          })
        } catch {
          // Malformed payloads are dropped silently.
        }
        return new Response(null, { status: 204 })
      },
    },
  },
})
