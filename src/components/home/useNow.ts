import { useEffect, useState } from 'react'

/** The time now, again every second while `ticking` (a room's clock); still otherwise. */
export function useNow(ticking: boolean): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!ticking) return
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [ticking])
  return now
}
