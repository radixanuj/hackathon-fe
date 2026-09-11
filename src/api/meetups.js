import { http, unwrap, unwrapList } from '../lib/http'

export const listRounds = (params) => http.get('/meetups/rounds', params).then(unwrapList)

/** Carries `my_signup` and `my_pair` for the viewer. */
export const currentRound = () => http.get('/meetups/rounds/current').then(unwrap)

export const getRound = (id) => http.get(`/meetups/rounds/${id}`).then(unwrap)

export const signUp = (id, note) => http.post(`/meetups/rounds/${id}/signup`, { note }).then(unwrap)

export const withdraw = (id) => http.delete(`/meetups/rounds/${id}/signup`)

export const myPairs = (params) => http.get('/me/meetup-pairs', params).then(unwrapList)

export const updatePair = (id, payload) => http.patch(`/meetups/pairs/${id}`, payload).then(unwrap)

// Admin only.
export const createRound = (payload) => http.post('/meetups/rounds', payload).then(unwrap)
export const runMatching = (id) => http.post(`/meetups/rounds/${id}/match`).then(unwrap)
