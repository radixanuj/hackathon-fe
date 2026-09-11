import { http, unwrap, unwrapList } from '../lib/http'

/** params: q, category, mine, include_archived, page */
export const listGroups = (params) => http.get('/groups', params).then(unwrapList)

/** Routed by slug, not id. */
export const getGroup = (slug) => http.get(`/groups/${slug}`).then(unwrap)

export const createGroup = (payload) => http.post('/groups', payload).then(unwrap)

export const updateGroup = (slug, payload) => http.patch(`/groups/${slug}`, payload).then(unwrap)

export const deleteGroup = (slug) => http.delete(`/groups/${slug}`)

export const joinGroup = (slug) => http.post(`/groups/${slug}/join`).then(unwrap)

export const leaveGroup = (slug) => http.delete(`/groups/${slug}/join`)

export const listMembers = (slug, params) =>
  http.get(`/groups/${slug}/members`, params).then(unwrapList)
