import { createContext } from 'react'
import { dark } from './theme'
import type { Theme } from './theme'
import type { Lang } from './i18n'

export const ThemeCtx = createContext<{ theme: Theme; tokens: typeof dark; toggle: () => void }>({
  theme: 'dark', tokens: dark, toggle: () => {},
})

export const LangCtx = createContext<{ lang: Lang; t: (k: string) => string; setLang: (l: Lang) => void }>({
  lang: 'en', t: (k) => k, setLang: () => {},
})
