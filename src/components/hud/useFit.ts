import { useEffect, useLayoutEffect, useRef, useState } from 'react'

// How compact a piece of the HUD must be to fit the room the screen gives
// it: 0 as drawn, then one step more compact at a time, up to `last`.
// Measured, never guessed from the screen's size: `room` is the box the
// layout gives the piece, as wide as it may grow; `piece` is the piece laid
// at its own width inside it. While the piece is wider than its room it
// steps down, before the screen is painted; when the window changes, it
// tries again from as drawn.

export function useFit(last: number) {
  const room = useRef<HTMLDivElement>(null)
  const piece = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState(0)
  useEffect(() => {
    const retry = () => setStep(0)
    window.addEventListener('resize', retry)
    return () => window.removeEventListener('resize', retry)
  }, [])
  useLayoutEffect(() => {
    const [r, p] = [room.current, piece.current]
    if (r && p && step < last && p.offsetWidth > r.clientWidth)
      setStep(step + 1)
  })
  return { room, piece, step }
}
