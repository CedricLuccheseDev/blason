// The fingers and the mouse on the map, as the camera reads them: one
// pointer drags the map, two pinch it, zooming round their middle while their
// middle drags it. Points are in pixels of the map's element.

type Point = { x: number; y: number }

export function makeGestures(
  canvas: HTMLCanvasElement,
  on: {
    /** A pointer comes down: whatever the camera was doing on its own stops. */
    start: () => void
    pan: (dx: number, dy: number) => void
    pinch: (factor: number, at: Point) => void
  },
) {
  const down = new Map<number, Point>()
  let last: { mid: Point; span: number } | null = null

  const local = (e: PointerEvent): Point => {
    const box = canvas.getBoundingClientRect()
    return { x: e.clientX - box.left, y: e.clientY - box.top }
  }
  /** The middle of the pointers down, and the span between the first two. */
  function shape() {
    const points = [...down.values()]
    const [a, b] = points
    if (points.length < 2) return { mid: a, span: 0 }
    return {
      mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
      span: Math.hypot(a.x - b.x, a.y - b.y),
    }
  }

  const onDown = (e: PointerEvent) => {
    down.set(e.pointerId, local(e))
    last = shape()
    on.start()
  }
  const onMove = (e: PointerEvent) => {
    if (!down.has(e.pointerId)) return
    down.set(e.pointerId, local(e))
    const now = shape()
    if (last) {
      on.pan(now.mid.x - last.mid.x, now.mid.y - last.mid.y)
      if (now.span > 0 && last.span > 0) on.pinch(now.span / last.span, now.mid)
    }
    last = now
  }
  const onUp = (e: PointerEvent) => {
    down.delete(e.pointerId)
    last = down.size > 0 ? shape() : null
  }
  canvas.addEventListener('pointerdown', onDown)
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
  window.addEventListener('pointercancel', onUp)

  return {
    destroy() {
      canvas.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    },
  }
}
