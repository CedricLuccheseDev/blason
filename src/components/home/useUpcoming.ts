import { useEffect, useState } from 'react'
import { readUpcoming } from '../../../net/protocol'
import type { Upcoming } from '../../../net/protocol'
import { upcomingUrl } from '~/render/link'

// The next public game as the relay tells it (GET /public, server/relay.ts),
// without sitting at it: asked again every second and a half while the page
// is shown, as OpenFront asks for its lobbies, and not at all while it is
// hidden. What was heard last stays, with when it was heard, so that its
// clock runs between two answers; an ask unanswered says the relay is lost,
// until the next is answered.

/** Ms between an answer and the next ask. */
const EVERY = 1500

export type Heard = {
  /** The next public game as last heard, and when; none yet. */
  game: Upcoming | null
  at: number
  /** Whether the last ask went unanswered. */
  lost: boolean
}

export function useUpcoming(): Heard {
  const [heard, setHeard] = useState<Heard>({ game: null, at: 0, lost: false })

  useEffect(() => {
    const url = upcomingUrl()
    if (!url) return
    let timer: ReturnType<typeof setTimeout> | undefined
    let asking: AbortController | null = null
    const ask = async () => {
      const mine = new AbortController()
      asking = mine
      const game = await fetch(url, { cache: 'no-store', signal: mine.signal })
        .then((answer) => answer.json())
        .then(readUpcoming)
        .catch(() => null)
      if (mine.signal.aborted) return
      setHeard((last) =>
        game ? { game, at: Date.now(), lost: false } : { ...last, lost: true },
      )
      timer = setTimeout(() => void ask(), EVERY)
    }
    const stop = () => {
      clearTimeout(timer)
      asking?.abort()
    }
    // Shown, at once and then on; hidden, the ask on its way is called off.
    const watch = () => {
      stop()
      if (document.visibilityState === 'visible') void ask()
    }
    watch()
    document.addEventListener('visibilitychange', watch)
    return () => {
      document.removeEventListener('visibilitychange', watch)
      stop()
    }
  }, [])

  return heard
}
