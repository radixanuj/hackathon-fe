import { http, unwrap } from '../lib/http'

export const demoLogin = (name, password) =>
  http.post('/auth/demo-login', { name, password }, { auth: false }).then(unwrap)

export const login = (email, password) =>
  http.post('/auth/login', { email, password }, { auth: false }).then(unwrap)

export const register = (payload) =>
  http.post('/auth/register', payload, { auth: false }).then(unwrap)

export const me = () => http.get('/auth/me').then(unwrap)

export const logout = () => http.post('/auth/logout')
