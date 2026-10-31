import { createContext, useContext, useState } from 'react'
import { en } from './en'
import { fr } from './fr'
import type { ReactNode } from 'react'
import type { Messages } from './en'
import type { Locale } from './locale'

// Exported for route heads, which build meta tags outside the React tree.
export const dictionaries: Record<Locale, Messages> = { en, fr }

const LocaleContext = createContext<Locale>('en')
const ChooseContext = createContext<(locale: Locale) => void>(() => {})

/** The language chosen in the settings, kept a year for the server to read (locale.ts): the one cookie the site sets. */
const LOCALE_COOKIE = 'locale'
const YEAR = 60 * 60 * 24 * 365

/** The page's language, as the server read it; the player may choose another in the settings, the page changing at once, with no reload that would end a game. */
export function LocaleProvider({
  locale: first,
  children,
}: Readonly<{
  locale: Locale
  children: ReactNode
}>) {
  const [locale, setLocale] = useState(first)
  const choose = (next: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${YEAR}; samesite=lax`
    document.documentElement.lang = next
    setLocale(next)
  }
  return (
    <ChooseContext.Provider value={choose}>
      <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
    </ChooseContext.Provider>
  )
}

export function useLocale(): Locale {
  return useContext(LocaleContext)
}

/** How to choose another language. */
export function useChooseLocale(): (locale: Locale) => void {
  return useContext(ChooseContext)
}

export function useMessages(): Messages {
  return dictionaries[useLocale()]
}
