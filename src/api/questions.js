import { http, unwrap, unwrapList } from '../lib/http'

/** params: q, status, tag, user_id, page */
export const listQuestions = (params) => http.get('/questions', params).then(unwrapList)

/**
 * The routing feature: open questions, not your own, tagged with something you
 * listed under "can talk about" or "can help with".
 */
export const questionsForMe = (params) =>
  http.get('/questions', { for_me: true, ...params }).then(unwrapList)

export const getQuestion = (id) => http.get(`/questions/${id}`).then(unwrap)

/** `{ title, body?, tags[] }` — tags are created on the fly. */
export const askQuestion = (payload) => http.post('/questions', payload).then(unwrap)

export const updateQuestion = (id, payload) => http.patch(`/questions/${id}`, payload).then(unwrap)

export const deleteQuestion = (id) => http.delete(`/questions/${id}`)

export const answer = (id, body) => http.post(`/questions/${id}/answers`, { body }).then(unwrap)

/** "I have done this — come talk to me." Often more useful than a written answer. */
export const volunteer = (id, note) => http.post(`/questions/${id}/volunteer`, { note }).then(unwrap)

export const unvolunteer = (id) => http.delete(`/questions/${id}/volunteer`)

/** Asker only, no admin bypass. Accepting a second answer unsets the first. */
export const acceptAnswer = (answerId) => http.post(`/question-answers/${answerId}/accept`).then(unwrap)

export const deleteAnswer = (answerId) => http.delete(`/question-answers/${answerId}`)
