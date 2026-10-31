import { Icon } from './Figure'
import { GAP, Stack } from './Layout'
import { Note } from './Text'
import type { IconName } from './Figure'
import type { ReactNode } from 'react'

/** One setting: its name above, its icon or its key beside it, its control (Choices.tsx) the page's width under it; the book's and the settings' sheet's (Settings.tsx) alike. */
export function Setting({
  name,
  icon,
  aside,
  children,
}: Readonly<{
  name: string
  icon?: IconName
  /** What follows the name: its key on the keyboard. */
  aside?: ReactNode
  children: ReactNode
}>) {
  return (
    <Stack gap="hair">
      <span className={`flex items-center ${GAP.hair}`}>
        {icon && <Icon name={icon} size={18} />}
        <Note>{name}</Note>
        {aside}
      </span>
      {children}
    </Stack>
  )
}
