import { useEffect, useState } from 'react'

// The screen's bottom darkened, no edge, while the pointer is near it
// (« assombri en fonction de la souris »): the floating pieces read there
// over the map, the map left whole the rest of the time. The top's pieces
// stand on their sheets (« dans le header tu peux mettre des fonds, mais en
// bas laisse sans fond »).

/** How near the screen's bottom the pointer darkens it, as a share of its height. */
const NEAR = 0.2

export function Shades() {
  const [near, setNear] = useState(false)
  useEffect(() => {
    const move = (e: PointerEvent) => {
      setNear(e.clientY > window.innerHeight * (1 - NEAR))
    }
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [])
  // norm-ok: the shades are gradients by Cédric's own ask (« assombri en fonction de la souris »), an edge that fades rather than a band.
  return (
    <div
      aria-hidden="true"
      className={`hud-shade bottom-0 h-56 bg-linear-to-t from-quill/60 to-transparent`}
      style={{ opacity: near ? 1 : 0 }}
    />
  )
}
