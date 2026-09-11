import { http, unwrap, unwrapList } from '../lib/http'

/** `{ signup, pairing }` — either may be null. `pairing.buddy` is the other person. */
export const getBuddy = () => http.get('/me/buddy').then(unwrap)

/** Opt in and attempt a match. 422 with no location on your profile. */
export const joinPool = (note) => http.post('/me/buddy', { note }).then(unwrap)

export const leavePool = () => http.delete('/me/buddy')

export const history = (params) => http.get('/me/buddy/history', params).then(unwrapList)

export const endPairing = (id) => http.post(`/buddy-pairings/${id}/end`).then(unwrap)
