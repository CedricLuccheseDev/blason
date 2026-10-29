import { useLayoutEffect, useRef, useState } from 'react'

// The size a piece of the HUD is laid out at, read before the screen is
// painted and again whenever it changes, for what must be placed by it
// within the screen (the cartouche by the pointer, a herald's word).

export function useSize() {
  const box = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const [w, h] = [el.offsetWidth, el.offsetHeight]
    if (w !== size.w || h !== size.h) setSize({ w, h })
  })
  return { box, size }
}
