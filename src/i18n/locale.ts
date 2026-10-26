import { createServerFn } from '@tanstack/react-start'
import { getRequestHeader } from '@tanstack/react-start/server'

export type Locale = 'en' | 'fr'

const LOCALE_COOKIE = 'locale'

// Locale resolution: the explicit cookie wins, otherwise the browser's
// Accept-Language header (first tag) decides.
export const getLocale = createServerFn({ method: 'GET' }).handler(
  (): Locale => {
    const cookies = getRequestHeader('cookie') ?? ''
    for (const part of cookies.split(';')) {
      const [key, value] = part.trim().split('=')
      if (key === LOCALE_COOKIE && (value === 'fr' || value === 'en')) {
        return value
      }
    }
    const header = getRequestHeader('accept-language') ?? ''
    const first = header.split(',')[0]?.trim().toLowerCase() ?? ''
    return first.startsWith('fr') ? 'fr' : 'en'
  },
)
