import { useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { useMessages } from '~/i18n'

// Router-level fallbacks. The error screen deliberately shows no detail:
// stack traces stay in the console (and in the server logs via
// /api/client-error), never in the page.
// The router types what was thrown as unknown: anything can be thrown.
export function ErrorScreen({ error }: Readonly<{ error?: unknown }>) {
  const m = useMessages()

  useEffect(() => {
    if (!error) return
    const thrown = error instanceof Error ? error : new Error(String(error))
    void fetch('/api/client-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: thrown.message,
        stack: thrown.stack,
        url: window.location.href,
      }),
    })
  }, [error])

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-5 text-center">
      <p className="text-xl font-bold">{m.errors.title}</p>
      <p className="text-dim">{m.errors.tryReload}</p>
      <button
        onClick={() => window.location.reload()}
        className="mt-4 bg-accent px-6 py-3 font-semibold text-paper transition-colors hover:bg-accent-hover"
      >
        {m.errors.reload}
      </button>
    </main>
  )
}

export function NotFoundScreen() {
  const m = useMessages()
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-5 text-center">
      <p className="text-8xl font-display font-bold tracking-tight text-hairline">
        404
      </p>
      <p className="text-dim">{m.errors.pageNotFound}</p>
      <Link
        to="/"
        className="mt-4 text-sm font-medium text-dim underline underline-offset-4 hover:text-ink"
      >
        {m.errors.backHome}
      </Link>
    </main>
  )
}
