// The ornament of the home's head: the gold rule under the title.

/** A gold rule across the column, a lozenge at its middle. */
export function Flourish() {
  return (
    <span aria-hidden="true" className="relative mt-3 h-px w-full bg-gilt">
      <span className="absolute top-1/2 left-1/2 size-2.5 -translate-1/2 rotate-45 border border-quill bg-gilt" />
    </span>
  )
}
