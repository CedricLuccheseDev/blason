import { createFileRoute } from '@tanstack/react-router'

// Uptime probe. Point an external monitor at this URL. Projects with a Convex
// backend should query it here too, so the probe fails when the backend is down.
export const Route = createFileRoute('/api/health')({
  server: {
    handlers: {
      GET: () => Response.json({ ok: true }),
    },
  },
})
