import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { THEME_KEYS, THEMES } from './themes'

const STORAGE_KEY = 'radix.theme'

const ThemeContext = createContext(null)

function randomKey(except) {
  const pool = except ? THEME_KEYS.filter((key) => key !== except) : THEME_KEYS
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
}

export function ThemeProvider({ children }) {
  const [key, setKey] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored && THEMES[stored] ? stored : randomKey()
  })

  useEffect(() => {
    apply(key)
    localStorage.setItem(STORAGE_KEY, key)
  }, [key])

  const shuffle = useCallback(() => setKey((current) => randomKey(current)), [])

  return <ThemeContext.Provider value={{ theme: key, shuffle }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}
