import { http, unwrap } from '../lib/http'

/** The roster the sign-in name box searches. Read before there is any token. */
export const searchDirectory = (q) =>
  http.get('/auth/directory', { q }, { auth: false }).then(unwrap)

/**
 * Pass `{ user_id }` for someone picked out of the directory — two colleagues can
 * share a first name, and an id cannot be misread. `{ name }` still works and is
 * what creates a profile for someone the roster has never heard of.
 */
export const demoLogin = (identity, password) =>
  http
    .post('/auth/demo-login', { ...identity, password }, { auth: false })
    .then(unwrap)

export const login = (email, password) =>
  http.post('/auth/login', { email, password }, { auth: false }).then(unwrap)

export const register = (payload) =>
  http.post('/auth/register', payload, { auth: false }).then(unwrap)

export const me = () => http.get('/auth/me').then(unwrap)

export const logout = () => http.post('/auth/logout')
