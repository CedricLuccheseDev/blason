import { Raycaster, Vector2 } from 'three'
import type { Object3D, PerspectiveCamera } from 'three'
import type { Pick } from './stage'

// What the pointer is over on the table: a ray from the eye through the
// pointer, the first thing it meets that can be touched (a shadow on the
// wood is never one). The HTML on the table that takes the pointer itself
// (a card's settings) keeps it.

const ray = new Raycaster()
const at = new Vector2()

/** The thing under a point of the frame, if one can be touched. */
export function pickAt(
  frame: HTMLElement,
  camera: PerspectiveCamera,
  things: Array<Object3D>,
  e: { clientX: number; clientY: number },
): Pick | null {
  const r = frame.getBoundingClientRect()
  at.set(
    ((e.clientX - r.left) / r.width) * 2 - 1,
    -((e.clientY - r.top) / r.height) * 2 + 1,
  )
  ray.setFromCamera(at, camera)
  const hit = ray
    .intersectObjects(things, true)
    .find((h) => h.object.userData.shade !== true)
  let o: Object3D | null = hit ? hit.object : null
  while (o && !o.userData.pick) o = o.parent
  return o ? (o.userData.pick as Pick) : null
}

/** Whether an event belongs to HTML of the table that takes the pointer. */
export const ownedByHtml = (e: Event) =>
  e.target instanceof Element &&
  e.target.closest('[data-own], button, input, label, a') !== null

/** Follows the pointer over the frame; returns how to stop. */
export function followPointer(
  frame: HTMLElement,
  pick: (e: PointerEvent | MouseEvent) => Pick | null,
  on: { hover: (p: Pick | null) => void; click: (p: Pick | null) => void },
) {
  const moved = (e: PointerEvent) => {
    const p = ownedByHtml(e) ? null : pick(e)
    on.hover(p)
    frame.classList.toggle('hot', p !== null)
  }
  const left = () => {
    on.hover(null)
    frame.classList.remove('hot')
  }
  const clicked = (e: MouseEvent) => {
    if (!ownedByHtml(e)) on.click(pick(e))
  }
  frame.addEventListener('pointermove', moved)
  frame.addEventListener('pointerleave', left)
  frame.addEventListener('click', clicked)
  return () => {
    frame.removeEventListener('pointermove', moved)
    frame.removeEventListener('pointerleave', left)
    frame.removeEventListener('click', clicked)
  }
}
