import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

/**
 * The keyboard follows the cards: a card turned from the keyboard hands the
 * focus to its settings once it is held up; put down, back to its face.
 */
export function useFocusFollows(
  overlay: RefObject<HTMLDivElement | null>,
  open: number | null,
) {
  const was = useRef<number | null>(null)
  useEffect(() => {
    const root = overlay.current
    const before = was.current
    was.current = open
    if (!root?.contains(document.activeElement)) return
    if (open === null) {
      root
        .querySelector<HTMLElement>(`[data-ov="front-${before}"] .hit`)
        ?.focus({ preventScroll: true })
      return
    }
    const back = `[data-ov="back-${open}"]`
    const first = () =>
      root
        .querySelector<HTMLElement>(
          `${back} input:checked, ${back} .make, ${back} input, ${back} button`,
        )
        ?.focus({ preventScroll: true })
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const id = setTimeout(first, still ? 0 : 520)
    return () => clearTimeout(id)
  }, [open])
}
