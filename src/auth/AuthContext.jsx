import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import * as authApi from '../api/auth'
import { token } from '../lib/http'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // 'loading' only while we verify a stored token on boot.
  const [status, setStatus] = useState(token.get() ? 'loading' : 'anonymous')

  const signOut = useCallback(async () => {
    try {
      if (token.get()) await authApi.logout()
    } finally {
      token.clear()
      setUser(null)
      setStatus('anonymous')
    }
  }, [])

  // http.js fires this when any request comes back 401 with a token attached.
  useEffect(() => {
    const drop = () => {
      setUser(null)
      setStatus('anonymous')
    }
    window.addEventListener('radix:unauthorized', drop)
    return () => window.removeEventListener('radix:unauthorized', drop)
  }, [])

  useEffect(() => {
    if (status !== 'loading') return
    let cancelled = false
    authApi
      .me()
      .then((me) => {
        if (cancelled) return
        setUser(me)
        setStatus('authenticated')
      })
      .catch(() => {
        if (cancelled) return
        token.clear()
        setStatus('anonymous')
      })
    return () => {
      cancelled = true
    }
  }, [status])

  // `identity` is { user_id } for someone chosen from the directory, or { name }
  // for a person the roster does not have yet.
  const signIn = useCallback(async (identity, password) => {
    const result = await authApi.demoLogin(identity, password)
    token.set(result.token)
    setUser(result.user)
    setStatus('authenticated')
    return result.user
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        status,
        isAdmin: user?.role === 'admin',
        isLoading: status === 'loading',
        isAuthenticated: status === 'authenticated',
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
