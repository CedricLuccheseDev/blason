import { useLayoutEffect, useState } from 'react'
import { useCompact } from './useCompact'
import { useSize } from './useSize'
import type { CSSProperties, RefObject } from 'react'

// Where a piece set by the pointer stands (the cartouche, the right click's
// menu): a little past the pointer on the side it would rather be, or on the
// other near an edge of the screen or over the HUD's bottom row, so that it
// never runs off the screen nor lies on the bar. On a phone, above the bar
// and across the middle, where no finger hides it and it lies on no other
// piece.

/** How far from the pointer it stands, and from the screen's sides and the bar's row at the least (the HUD's edge). */
const [DX, DY, EDGE] = [24, 20, 16]
/** On a phone, how far above the bottom of the screen it stands: over the bar, its three rows. */
const ABOVE_BAR = 216

/**
 * Where its near side stands along one of the screen's axes: `gap` past the
 * pointer on the side it would rather be, or on the other when it would run
 * past `end` there, or held within it when it fits on neither.
 */
function beside(
  at: number,
  gap: number,
  after: boolean,
  length: number,
  end: number,
): number {
  const fits = (start: number) => start >= EDGE && start + length <= end - EDGE
  const [rather, other] = after
    ? [at + gap, at - gap - length]
    : [at - gap - length, at + gap]
  if (fits(rather)) return rather
  if (fits(other)) return other
  return Math.max(EDGE, Math.min(rather, end - EDGE - length))
}

/** The top of the HUD's bottom row (the bar, the camera), read before the screen is painted: the screen's bottom without one. */
function useFloor(row: RefObject<HTMLElement | null>): number {
  const [top, setTop] = useState(0)
  useLayoutEffect(() => {
    const y = row.current?.getBoundingClientRect().top ?? window.innerHeight
    if (y !== top) setTop(y)
  })
  return top || window.innerHeight
}

/**
 * The piece's box, to be measured, and where it stands by the pointer at
 * (x, y): on its right or left, below or above it, as it would rather be,
 * kept above `floor`, the HUD's bottom row; on a phone (`narrow`), above
 * the bar.
 */
export function useBeside(floor: RefObject<HTMLElement | null>) {
  const narrow = useCompact()
  const { box, size } = useSize()
  const bottom = useFloor(floor)
  const place = (
    x: number,
    y: number,
    right: boolean,
    below: boolean,
  ): CSSProperties =>
    narrow
      ? {
          left: '50%',
          bottom: ABOVE_BAR,
          transform: 'translateX(-50%)',
          maxWidth: 'calc(100% - 1rem)',
        }
      : {
          left: beside(x, DX, right, size.w, window.innerWidth),
          top: beside(y, DY, below, size.h, bottom),
        }
  return { box, place, narrow }
}
