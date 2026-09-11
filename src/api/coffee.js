import { http, unwrap, unwrapList } from '../lib/http'

/** params: scope (open | past | mine | all), kind, location, page */
export const listInvites = (params) => http.get('/coffee-invites', params).then(unwrapList)

export const getInvite = (id) => http.get(`/coffee-invites/${id}`).then(unwrap)

/** kind: coffee | lunch | walk. `capacity` counts guest seats, not the host. */
export const createInvite = (payload) => http.post('/coffee-invites', payload).then(unwrap)

export const updateInvite = (id, payload) => http.patch(`/coffee-invites/${id}`, payload).then(unwrap)

export const deleteInvite = (id) => http.delete(`/coffee-invites/${id}`)

export const join = (id) => http.post(`/coffee-invites/${id}/join`).then(unwrap)

export const leave = (id) => http.delete(`/coffee-invites/${id}/join`)
