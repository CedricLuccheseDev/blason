import type { RefObject } from 'react'

// Behind the home's menu, the bots' game (useSpectator.ts) under a veil of
// parchment, so the menu reads first; watched, the veil lifts. Where the
// game cannot be drawn (no WebGL), the parchment alone. It takes no pointer
// and says nothing to a screen reader.

export function Backdrop({
  host,
  clear,
}: Readonly<{ host: RefObject<HTMLDivElement | null>; clear: boolean }>) {
  return (
    <>
      <div
        ref={host}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-vellum"
      />
      <div
        aria-hidden="true"
        className={`pointer-events-none fixed inset-0 bg-vellum transition-opacity duration-(--duration-hud-enter) ease-hud motion-reduce:transition-none ${clear ? 'opacity-0' : 'opacity-60'}`}
      />
    </>
  )
}
