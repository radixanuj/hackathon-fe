import { http, unwrap, unwrapList } from '../lib/http'

/** params: q, category, user_id, tag, page */
export const listStories = (params) => http.get('/stories', params).then(unwrapList)

/** Other people's stories, ranked by how many tags match your own interests. */
export const discoverStories = (params) => http.get('/stories/discover', params).then(unwrapList)

export const getStory = (id) => http.get(`/stories/${id}`).then(unwrap)

export const createStory = (payload) => http.post('/stories', payload).then(unwrap)

export const updateStory = (id, payload) => http.patch(`/stories/${id}`, payload).then(unwrap)

export const deleteStory = (id) => http.delete(`/stories/${id}`)

/** reaction: clap | heart | mind_blown | inspired - one per person. */
export const react = (id, reaction) => http.post(`/stories/${id}/react`, { reaction }).then(unwrap)

export const removeReaction = (id) => http.delete(`/stories/${id}/react`)

export const convertToAma = (id, payload) =>
  http.post(`/stories/${id}/convert-to-ama`, payload).then(unwrap)
