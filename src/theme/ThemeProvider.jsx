import { createContext, useContext } from 'react'
import { THEME_KEYS, THEMES } from './themes'

const ThemeContext = createContext(null)

function randomKey() {
  return THEME_KEYS[Math.floor(Math.random() * THEME_KEYS.length)]
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

// The colour of the day: rolled once per load, never chosen by hand.
const KEY = randomKey()
apply(KEY)

export function ThemeProvider({ children }) {
  return <ThemeContext.Provider value={{ theme: KEY }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}
