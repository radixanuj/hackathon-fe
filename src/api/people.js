import { http, unwrap, unwrapList } from '../lib/http'

/**
 * Filters: q, team, location, skill, interest, tag + kind, tenure_band
 * ('senior' | 'junior'), new_joiners, open_to_mentoring, page, per_page.
 */
export const listUsers = (params) => http.get('/users', params).then(unwrapList)

export const getUser = (id) => http.get(`/users/${id}`).then(unwrap)

export const updateMe = (payload) => http.patch('/me', payload).then(unwrap)

/** Replaces one whole tag section. kind: can_talk_about | can_help_with | want_to_learn | interest */
export const syncTags = (kind, tags) => http.put('/me/tags', { kind, tags }).then(unwrap)

export const searchTags = (params) => http.get('/tags', params).then(unwrapList)

export const createTag = (payload) => http.post('/tags', payload).then(unwrap)
