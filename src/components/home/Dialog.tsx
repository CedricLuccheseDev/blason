import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { Act } from '~/components/hud/Act'
import { Sheet } from '~/components/hud/Sheet'
import { useMessages } from '~/i18n'

// A sheet laid over the home for one thing to set (the solo game, a private
// room), as OpenFront's dialogs: the browser's own modal dialog, so the
// keyboard stays inside it and Escape puts it down.

export function Dialog({
  open,
  title,
  onClose,
  children,
}: Readonly<{
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}>) {
  const t = useMessages().home
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-label={title}
      className="hud m-auto w-[calc(100%-2rem)] max-w-[440px] overflow-visible bg-transparent p-0 backdrop:bg-quill/40"
    >
      {open && (
        <Sheet className="flex flex-col gap-4 p-4">
          <header className="flex items-center justify-between gap-3">
            <h2 className="font-caps text-hud-xl leading-none text-quill">
              {title}
            </h2>
            <Act tone="plain" label={t.close} onClick={onClose}>
              <svg
                viewBox="0 0 16 16"
                className="size-4"
                aria-hidden="true"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              >
                <path d="M3 3 L13 13 M13 3 L3 13" />
              </svg>
            </Act>
          </header>
          {children}
        </Sheet>
      )}
    </dialog>
  )
}
