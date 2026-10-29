import { useEffect, useState } from 'react'

// The screen's top or bottom darkened, no edge, while the pointer is near
// it (« assombri en fonction de la souris, si la souris est en bas ou en
// haut assombri, sinon non »): the floating HUD read there over the map,
// the map left whole the rest of the time.

/** How near the screen's top or bottom the pointer darkens it, as a share of its height. */
const NEAR = 0.2

export function Shades() {
  const [near, setNear] = useState<'top' | 'bottom' | null>(null)
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const h = window.innerHeight
      if (e.clientY < h * NEAR) setNear('top')
      else if (e.clientY > h * (1 - NEAR)) setNear('bottom')
      else setNear(null)
    }
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [])
  // norm-ok: the shades are gradients by Cédric's own ask (« assombri en fonction de la souris »), an edge that fades rather than a band.
  return (
    <>
      <div
        aria-hidden="true"
        className={`hud-shade top-0 h-44 bg-linear-to-b from-quill/55 to-transparent`}
        style={{ opacity: near === 'top' ? 1 : 0 }}
      />
      <div
        aria-hidden="true"
        className={`hud-shade bottom-0 h-56 bg-linear-to-t from-quill/60 to-transparent`}
        style={{ opacity: near === 'bottom' ? 1 : 0 }}
      />
    </>
  )
}
