import { http, unwrap, unwrapList } from '../lib/http'

/** params: scope (active | upcoming | past | mine | all), category, group_id, q, page */
export const listChallenges = (params) => http.get('/challenges', params).then(unwrapList)

/** Routed by slug. Includes the ranked leaderboard and `my_participation`. */
export const getChallenge = (slug) => http.get(`/challenges/${slug}`).then(unwrap)

export const createChallenge = (payload) => http.post('/challenges', payload).then(unwrap)

export const updateChallenge = (slug, payload) => http.patch(`/challenges/${slug}`, payload).then(unwrap)

export const deleteChallenge = (slug) => http.delete(`/challenges/${slug}`)

export const join = (slug) => http.post(`/challenges/${slug}/join`).then(unwrap)

export const leave = (slug) => http.delete(`/challenges/${slug}/join`)

/** `{ value, note?, logged_on? }` — 422 if you haven't joined or it isn't running. */
export const logEntry = (slug, payload) => http.post(`/challenges/${slug}/logs`, payload).then(unwrap)

export const leaderboard = (slug, params) =>
  http.get(`/challenges/${slug}/leaderboard`, params).then(unwrapList)
