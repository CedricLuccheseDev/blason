import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Sheet } from '../hud/Sheet'
import { GAP } from '../hud/Layout'
import { LIT, PIECE } from './BarPiece'
import type { PointerEvent as Pointer, ReactNode } from 'react'

// A family of the bar folded behind one face when the bar lacks room (« si
// ya la place met tout en ligne sinon range en partant de coup puis
// construction aussi et ensuite l'armée »): the face, with a gilt notch over
// it saying it opens; the pointer on it lifts its drawer above it at once, a
// click or a tap too; in the drawer its pieces with their names, a new
// player's lesson. A piece taken shuts it; so do Escape, a press elsewhere,
// and the pointer gone a moment.

/** The room kept from the screen's sides, in pixels. */
const EDGE = 8
/** How long the drawer waits for the pointer gone before it shuts, in ms: room to cross from the face to the drawer. */
const LINGER = 250

export function Drawer({
  label,
  held,
  lit,
  face,
  children,
}: Readonly<{
  /** The family's name, for screen readers. */
  label: string
  /** Whether one of its pieces is in hand: the face raised. */
  held: boolean
  /** Whether one of its pieces is lit from the right click's menu: the face lit too. */
  lit: boolean
  face: ReactNode
  children: ReactNode
}>) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const linger = useRef<ReturnType<typeof setTimeout>>(undefined)
  const mouse = useRef(false)
  const tray = useRef<HTMLDivElement>(null)
  const lift = useRef<HTMLDivElement>(null)
  const [shift, setShift] = useState(0)

  useEffect(() => {
    if (!open) return
    const away = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false)
    }
    // Escape, or a key that takes a piece in hand, shuts it as a click would.
    const key = () => setOpen(false)
    // A piece of the drawer taken, not one refused: the drawer shuts.
    const took = (e: MouseEvent) => {
      const piece = (e.target as Element).closest('button')
      if (
        piece &&
        tray.current?.contains(piece) &&
        piece.getAttribute('aria-disabled') !== 'true'
      )
        setOpen(false)
    }
    window.addEventListener('pointerdown', away)
    window.addEventListener('keydown', key)
    window.addEventListener('click', took)
    return () => {
      window.removeEventListener('pointerdown', away)
      window.removeEventListener('keydown', key)
      window.removeEventListener('click', took)
    }
  }, [open])
  useEffect(() => () => clearTimeout(linger.current), [])
  // Kept within the screen, as the hints are: moved aside by as much as it would run off, its tail still at its face.
  useLayoutEffect(() => {
    const rect = lift.current?.getBoundingClientRect()
    if (!open || !rect) {
      if (!open && shift !== 0) setShift(0)
      return
    }
    let by = shift
    if (rect.left < EDGE) by += EDGE - rect.left
    else if (rect.right > window.innerWidth - EDGE)
      by -= rect.right - (window.innerWidth - EDGE)
    if (Math.abs(by - shift) >= 1) setShift(Math.round(by))
  }, [open, shift])

  const enter = (e: Pointer) => {
    mouse.current = e.pointerType === 'mouse'
    if (!mouse.current) return
    clearTimeout(linger.current)
    setOpen(true)
  }
  const leave = (e: Pointer) => {
    if (e.pointerType !== 'mouse') return
    linger.current = setTimeout(() => setOpen(false), LINGER)
  }
  return (
    <div
      ref={box}
      className="pointer-events-auto relative flex flex-col items-center"
      onPointerEnter={enter}
      onPointerLeave={leave}
    >
      {open && (
        // norm-ok: the drawer's foot, the room its tail and the pointer cross from the face.
        <div
          ref={lift}
          className="absolute bottom-full left-1/2 z-10 w-max max-w-[calc(100vw-16px)] pb-3"
          style={{ transform: `translateX(calc(-50% + ${shift}px))` }}
        >
          {/* norm-ok: the drawer's own margin, as a piece's sheet. */}
          <Sheet className="px-3 pt-2 pb-1">
            <div
              ref={tray}
              className={`flex flex-wrap items-start justify-center ${GAP.part}`}
            >
              {children}
            </div>
          </Sheet>
          <span
            aria-hidden="true"
            // norm-ok: the drawer's tail, the sheet's edge pointing at its face.
            className="absolute bottom-1.5 size-3 -translate-x-1/2 rotate-45 border-r-[1.5px] border-b-[1.5px] border-quill bg-vellum"
            style={{ left: `calc(50% - ${shift}px)` }}
          />
        </div>
      )}
      <Notch />
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-pressed={held}
        onPointerDown={(e) => (mouse.current = e.pointerType === 'mouse')}
        // The pointer has opened it already: a click keeps it open; a tap or a key opens or shuts it.
        onClick={() => setOpen(mouse.current ? true : !open)}
        className={`hud-afloat ${PIECE} ${lit ? LIT : ''}`}
      >
        {face}
      </button>
    </div>
  )
}

/** The gilt notch over a face: a drawer opens upward from it. */
function Notch() {
  return (
    <span
      aria-hidden="true"
      // norm-ok: the notch stands just over the face, as drawn on the maquette.
      className="absolute -top-2.5 left-1/2 -translate-x-1/2 leading-none"
    >
      <svg
        viewBox="0 0 12 7"
        className="h-[calc(7px*var(--hud))] w-[calc(12px*var(--hud))]"
      >
        <path
          d="M1 6 L6 1 L11 6"
          fill="none"
          stroke="var(--color-gilt)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}
