import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { Act } from '~/components/hud/Act'
import { Inline, Panel } from '~/components/hud/Layout'
import { Title } from '~/components/hud/Text'
import { useMessages } from '~/i18n'

// A sheet laid over the home for one thing to set (the solo game, a private
// room), as OpenFront's dialogs: the browser's own modal dialog, so the
// keyboard stays inside it and Escape, or a click outside it, puts it down. The control marked
// `data-first` takes the keyboard as it opens.

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
    if (open && !dialog.open) {
      dialog.showModal()
      // The browser hands the keyboard to the first control; a sheet may name another.
      dialog.querySelector<HTMLElement>('[data-first]')?.focus()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      // A click outside the sheet, on the backdrop, puts it down (« les modals quand on clique dehors ça ferme les modals »).
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      aria-label={title}
      // norm-ok: the browser's dialog, centred by its own margin and stripped of its own padding.
      className="hud m-auto w-[calc(100%-2rem)] max-w-[440px] overflow-visible bg-transparent p-0 backdrop:bg-quill/40"
    >
      {open && (
        <Panel page gap="piece">
          <header>
            <Inline gap="part" justify="between">
              <h2>
                <Title>{title}</Title>
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
            </Inline>
          </header>
          {children}
        </Panel>
      )}
    </dialog>
  )
}
