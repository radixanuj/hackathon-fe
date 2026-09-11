import { http, unwrap, unwrapList } from '../lib/http'

/** params: q, status, format, host_id, page - drafts are hidden by default. */
export const listAmas = (params) => http.get('/amas', params).then(unwrapList)

/** Questions come back sorted by upvotes, each with answers and `is_upvoted`. */
export const getAma = (id) => http.get(`/amas/${id}`).then(unwrap)

export const createAma = (payload) => http.post('/amas', payload).then(unwrap)

export const updateAma = (id, payload) => http.patch(`/amas/${id}`, payload).then(unwrap)

export const deleteAma = (id) => http.delete(`/amas/${id}`)

export const askQuestion = (amaId, payload) =>
  http.post(`/amas/${amaId}/questions`, payload).then(unwrap)

export const deleteQuestion = (questionId) => http.delete(`/ama-questions/${questionId}`)

export const upvote = (questionId) => http.post(`/ama-questions/${questionId}/upvote`).then(unwrap)

export const removeUpvote = (questionId) => http.delete(`/ama-questions/${questionId}/upvote`)

/** Host only - it's *ask me* anything. */
export const answerQuestion = (questionId, payload) =>
  http.post(`/ama-questions/${questionId}/answers`, payload).then(unwrap)
