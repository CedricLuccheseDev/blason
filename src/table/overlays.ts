import { Vector3 } from 'three'
import { quadMatrix } from './quad'
import type { Object3D, PerspectiveCamera } from 'three'
import type { Point } from './quad'
import type { Spec, V3 } from './pins'

// The words laid on the things: each piece of HTML on the table is mapped
// to the screen every frame where its pin says (pins.ts): by a projective
// transform onto a thing's face, so that it follows the thing's perspective
// and stays crisp text; or round a disc, or at a point. Something lifted
// towards the eye (a turned card, the journal read) hides what it covers.

type Laid = {
  on: boolean
  depth: number
  box: [number, number, number, number]
}

const v = new Vector3()

/** A point of a thing on screen: x, y in pixels, its depth (NDC) and its distance from the eye. */
function screen(
  camera: PerspectiveCamera,
  obj: Object3D,
  p: V3,
  w: number,
  h: number,
) {
  v.set(p[0], p[1], p[2]).applyMatrix4(obj.matrixWorld)
  const d = v.distanceTo(camera.position)
  v.project(camera)
  return [((v.x + 1) / 2) * w, ((1 - v.y) / 2) * h, v.z, d] as const
}

function layOne(
  el: HTMLElement,
  spec: Spec,
  camera: PerspectiveCamera,
  [w, h, scale]: [number, number, number],
): Laid {
  let on = !spec.show || spec.show()
  if (spec.quad) {
    const q = spec.quad.corners.map((c) => screen(camera, spec.obj, c, w, h))
    let area = 0
    for (let i = 0; i < 4; i++) {
      const [a, b] = [q[i], q[(i + 1) % 4]]
      area += a[0] * b[1] - b[0] * a[1]
    }
    if (area <= 40 || q.some((x) => x[2] > 1)) on = false
    const xs = q.map((x) => x[0])
    const ys = q.map((x) => x[1])
    if (on)
      el.style.transform = quadMatrix(
        spec.quad.w,
        spec.quad.h,
        q.map((x) => [x[0], x[1]]) as [Point, Point, Point, Point],
      )
    return {
      on,
      depth: q.reduce((s, x) => s + x[3], 0) / 4,
      box: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)],
    }
  }
  if (spec.disc) {
    const c = screen(camera, spec.obj, spec.disc.at, w, h)
    const e = screen(
      camera,
      spec.obj,
      [spec.disc.at[0] + spec.disc.r, spec.disc.at[1], spec.disc.at[2]],
      w,
      h,
    )
    const r = Math.hypot(e[0] - c[0], e[1] - c[1])
    el.style.width = el.style.height = `${(2 * r).toFixed(1)}px`
    el.style.transform = `translate(${(c[0] - r).toFixed(1)}px, ${(c[1] - r * 0.8).toFixed(1)}px) scaleY(0.8)`
    return { on, depth: c[3], box: [c[0] - r, c[1] - r, c[0] + r, c[1] + r] }
  }
  const c = screen(camera, spec.obj, spec.point ?? [0, 0, 0], w, h)
  el.style.transform = `translate(${c[0].toFixed(1)}px, ${c[1].toFixed(1)}px) translateX(-50%) scale(${scale.toFixed(3)})`
  return { on, depth: c[3], box: [c[0] - 30, c[1], c[0] + 30, c[1] + 20] }
}

const overlaps = (a: Laid['box'], b: Laid['box'], m: number) =>
  a[0] < b[2] + m && a[2] > b[0] - m && a[1] < b[3] + m && a[3] > b[1] - m

/** Lays every piece of HTML under `root` on its thing, this frame. */
export function layOverlays(
  root: HTMLElement,
  specs: Map<string, Spec>,
  camera: PerspectiveCamera,
  size: [number, number, number],
) {
  const laid: Array<{ el: HTMLElement; spec: Spec; at: Laid }> = []
  for (const el of root.querySelectorAll<HTMLElement>('[data-ov]')) {
    const spec = specs.get(el.dataset.ov ?? '')
    if (spec) laid.push({ el, spec, at: layOne(el, spec, camera, size) })
  }
  const raised = laid.filter((l) => l.spec.raise?.())
  for (const { el, spec, at } of laid) {
    const hidden =
      at.on &&
      !raised.some((r) => r.el === el) &&
      raised.some(
        (r) =>
          r.spec.obj !== spec.obj &&
          r.at.depth < at.depth &&
          overlaps(
            at.box,
            r.at.box,
            (r.spec.pad ?? 0) * (r.at.box[2] - r.at.box[0]),
          ),
      )
    el.classList.toggle('on', at.on && !hidden)
    el.style.zIndex = String(Math.max(1, 2000 - Math.round(at.depth * 8)))
  }
}
