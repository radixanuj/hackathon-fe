import { http, unwrap, unwrapList } from '../lib/http'

/** params: q, status, category, mine, user_id, page — sorted by interest. */
export const listInvites = (params) => http.get('/open-invites', params).then(unwrapList)

export const getInvite = (id) => http.get(`/open-invites/${id}`).then(unwrap)

/** Posting counts as interest, so the count starts at 1. */
export const createInvite = (payload) => http.post('/open-invites', payload).then(unwrap)

export const updateInvite = (id, payload) => http.patch(`/open-invites/${id}`, payload).then(unwrap)

export const deleteInvite = (id) => http.delete(`/open-invites/${id}`)

export const addInterest = (id) => http.post(`/open-invites/${id}/interest`).then(unwrap)

export const removeInterest = (id) => http.delete(`/open-invites/${id}/interest`)

/** Author only. Creates an Event and RSVPs everyone interested. Returns the Event. */
export const convertToEvent = (id, payload) =>
  http.post(`/open-invites/${id}/convert-to-event`, payload).then(unwrap)
