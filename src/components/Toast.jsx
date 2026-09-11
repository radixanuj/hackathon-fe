import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

const ToastContext = createContext(() => {})

export function ToastProvider({ children }) {
  const [message, setMessage] = useState(null)
  const timer = useRef(null)

  const say = useCallback((text) => {
    clearTimeout(timer.current)
    setMessage(text)
    timer.current = setTimeout(() => setMessage(null), 2600)
  }, [])

  useEffect(() => () => clearTimeout(timer.current), [])

  return (
    <ToastContext.Provider value={say}>
      {children}
      {message && (
        <div
          role="status"
          className="fixed bottom-8 left-1/2 z-[200] max-w-[90vw] -translate-x-1/2 rounded-full bg-ink px-[26px] py-4 text-center text-[16.5px] font-semibold text-white shadow-[0_20px_50px_rgb(20_18_15/0.32)]"
          style={{ animation: 'bumpUp .35s cubic-bezier(.2,1.4,.3,1) both' }}
        >
          {message}
        </div>
      )}
    </ToastContext.Provider>
  )
}

/** `const say = useToast()` — one-line confirmations, as the prototype does. */
export function useToast() {
  return useContext(ToastContext)
}
