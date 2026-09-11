import { http, unwrap, unwrapList } from '../lib/http'

/** params: q, stream, type, user_id, sort (recent | popular), page */
export const listRecommendations = (params) =>
  http.get('/recommendations', params).then(unwrapList)

export const getRecommendation = (id) => http.get(`/recommendations/${id}`).then(unwrap)

export const createRecommendation = (payload) =>
  http.post('/recommendations', payload).then(unwrap)

export const updateRecommendation = (id, payload) =>
  http.patch(`/recommendations/${id}`, payload).then(unwrap)

export const deleteRecommendation = (id) => http.delete(`/recommendations/${id}`)

export const like = (id) => http.post(`/recommendations/${id}/like`).then(unwrap)

export const unlike = (id) => http.delete(`/recommendations/${id}/like`)
