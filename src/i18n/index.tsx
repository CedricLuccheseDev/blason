import { createContext, useContext } from 'react'
import { en } from './en'
import { fr } from './fr'
import type { ReactNode } from 'react'
import type { Messages } from './en'
import type { Locale } from './locale'

// Exported for route heads, which build meta tags outside the React tree.
export const dictionaries: Record<Locale, Messages> = { en, fr }

const LocaleContext = createContext<Locale>('en')

export function LocaleProvider({
  locale,
  children,
}: Readonly<{
  locale: Locale
  children: ReactNode
}>) {
  return (
    <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
  )
}

export function useLocale(): Locale {
  return useContext(LocaleContext)
}

export function useMessages(): Messages {
  return dictionaries[useLocale()]
}
