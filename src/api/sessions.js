import { http, unwrap, unwrapList } from '../lib/http'

/** params: direction (incoming | outgoing | all), status, page */
export const listRequests = (params) => http.get('/session-requests', params).then(unwrapList)

export const getRequest = (id) => http.get(`/session-requests/${id}`).then(unwrap)

export const createRequest = (payload) => http.post('/session-requests', payload).then(unwrap)

/** Recipient only. action: accept | decline | suggest_time */
export const respond = (id, payload) =>
  http.post(`/session-requests/${id}/respond`, payload).then(unwrap)

/** status: completed | cancelled - only the requester may cancel. */
export const updateRequest = (id, payload) =>
  http.patch(`/session-requests/${id}`, payload).then(unwrap)
