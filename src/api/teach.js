import { http, unwrap, unwrapList } from '../lib/http'

/** params: q, status, level, format, user_id, page */
export const listOffers = (params) => http.get('/teach-offers', params).then(unwrapList)

/** Offers that hit `min_interested` and just need a date. */
export const readyOffers = (params) =>
  http.get('/teach-offers', { ready: true, ...params }).then(unwrapList)

export const getOffer = (id) => http.get(`/teach-offers/${id}`).then(unwrap)

export const createOffer = (payload) => http.post('/teach-offers', payload).then(unwrap)

export const updateOffer = (id, payload) => http.patch(`/teach-offers/${id}`, payload).then(unwrap)

export const deleteOffer = (id) => http.delete(`/teach-offers/${id}`)

export const addInterest = (id) => http.post(`/teach-offers/${id}/interest`).then(unwrap)

export const removeInterest = (id) => http.delete(`/teach-offers/${id}/interest`)

/**
 * Owner only. Creates an Event and RSVPs the teacher plus everyone interested.
 * Returns the Event, not the offer.
 */
export const schedule = (id, payload) => http.post(`/teach-offers/${id}/schedule`, payload).then(unwrap)
