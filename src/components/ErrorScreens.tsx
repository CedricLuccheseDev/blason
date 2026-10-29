import { useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { Leaf } from '~/components/home/Leaf'
import { Act } from '~/components/hud/Act'
import { Word } from '~/components/hud/Text'
import { useMessages } from '~/i18n'

// Router-level fallbacks, on a leaf of the game's book as every page beside
// the game (Leaf.tsx). The error screen deliberately shows no detail:
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
    <Leaf title={m.errors.title} line={m.errors.tryReload}>
      <div>
        <Act onClick={() => window.location.reload()}>{m.errors.reload}</Act>
      </div>
    </Leaf>
  )
}

export function NotFoundScreen() {
  const m = useMessages()
  return (
    <Leaf title="404" line={m.errors.pageNotFound}>
      <Link to="/" className="hud-press hover:text-gilt-deep">
        <Word className="italic text-gilt-deep">{m.errors.backHome}</Word>
      </Link>
    </Leaf>
  )
}
