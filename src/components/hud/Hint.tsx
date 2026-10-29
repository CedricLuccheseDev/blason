import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Sheet } from './Sheet'
import type { ReactNode } from 'react'

// The HUD's hint (« ajoute des helpers »): a piece pointed at a moment, or
// reached by the keyboard, opens a small sheet beside it saying what it does,
// a title and a line or two with its figures. Above the piece, or under it
// for a piece at the top of the screen; never off the screen's sides. It is
// laid over the whole page, so that no sheet the piece stands in clips it.

/** How long the pointer rests on a piece before its hint opens, in ms: a pointer passing by opens none. */
const REST = 350
/** The room kept from the screen's sides, and from the piece, in pixels. */
const [EDGE, GAP] = [8, 8]

type At = { x: number; y: number }

export function Hint({
  title,
  lines,
  under = false,
  children,
}: Readonly<{
  title: string
  /** What the piece does, a sentence a line; none empty. */
  lines: ReadonlyArray<string>
  /** Opens under the piece rather than above it. */
  under?: boolean
  children: ReactNode
}>) {
  const [at, setAt] = useState<At | null>(null)
  const piece = useRef<HTMLSpanElement>(null)
  const sheet = useRef<HTMLDivElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  /** Opens it at the piece's middle, by its top or its foot. */
  const open = () => {
    const box = piece.current?.getBoundingClientRect()
    if (box)
      setAt({
        x: box.left + box.width / 2,
        y: under ? box.bottom + GAP : box.top - GAP,
      })
  }
  const show = (later: boolean) => {
    clearTimeout(timer.current)
    if (later) timer.current = setTimeout(open, REST)
    else open()
  }
  const hide = () => {
    clearTimeout(timer.current)
    setAt(null)
  }

  // Kept within the screen: moved aside by as much as it would run off.
  useLayoutEffect(() => {
    const box = sheet.current?.getBoundingClientRect()
    if (!at || !box) return
    let x = at.x
    if (box.left < EDGE) x += EDGE - box.left
    else if (box.right > window.innerWidth - EDGE)
      x -= box.right - (window.innerWidth - EDGE)
    // A pixel's difference is the measure's rounding, not a move.
    if (Math.abs(x - at.x) >= 1) setAt({ x: Math.round(x), y: at.y })
  }, [at])

  return (
    <span
      ref={piece}
      className="pointer-events-auto relative inline-flex"
      onPointerEnter={(e) => e.pointerType === 'mouse' && show(true)}
      onPointerLeave={hide}
      onFocus={() => show(false)}
      onBlur={hide}
    >
      {children}
      {at &&
        createPortal(
          <div
            ref={sheet}
            role="tooltip"
            className="hud pointer-events-none fixed z-50 w-max max-w-72"
            style={{
              left: at.x,
              top: at.y,
              transform: `translate(-50%, ${under ? '0' : '-100%'})`,
            }}
          >
            <Sheet className="flex flex-col gap-1 px-3 py-2 text-left">
              <span className="hud-word font-semibold">{title}</span>
              {lines.map((line) => (
                <span key={line} className="hud-word text-hud-s leading-snug">
                  {line}
                </span>
              ))}
            </Sheet>
          </div>,
          document.body,
        )}
    </span>
  )
}
