import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { faviconHref } from './mark'
import { THEME_KEYS, THEMES } from './themes'

const ThemeContext = createContext(null)

function randomKey(exclude) {
  const pool = exclude ? THEME_KEYS.filter((k) => k !== exclude) : THEME_KEYS
  return pool[Math.floor(Math.random() * pool.length)]
}

function apply(key) {
  const theme = THEMES[key] ?? THEMES.Cobalt
  const style = document.documentElement.style
  style.setProperty('--acc', theme.acc)
  style.setProperty('--on-acc', theme.on)
  style.setProperty('--tint', theme.tint)
  style.setProperty('--acc-ink', theme.ink)
  style.setProperty('--acc-soft', theme.soft)
  style.setProperty('--inv', '#FFFFFF')
  style.setProperty('--on-inv', theme.ink)

  // The logo in the tab is drawn from the same palette as the one in the
  // header, so the browser tab shuffles along with the page.
  const icon = document.querySelector('link[rel="icon"]')
  if (icon) icon.href = faviconHref(theme)
}

const INITIAL = randomKey()
apply(INITIAL)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(INITIAL)

  useEffect(() => {
    apply(theme)
  }, [theme])

  const shuffle = useCallback(() => {
    setTheme((current) => randomKey(current))
  }, [])

  return <ThemeContext.Provider value={{ theme, shuffle }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext) ?? { theme: 'Cobalt', shuffle: () => {} }
}
