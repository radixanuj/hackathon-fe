import { http, unwrap } from '../lib/http'

/**
 * Who should I meet? Ranked on shared interests, complementary knowledge and
 * a lack of previous interaction. Returns a bare list, not a paginator.
 */
export const listSuggestions = (limit) => http.get('/me/suggestions', { limit }).then(unwrap)

/** "Not right now" — keeps someone out of future suggestions. */
export const dismiss = (userId) => http.post(`/users/${userId}/dismiss-suggestion`)

export const undismiss = (userId) => http.delete(`/users/${userId}/dismiss-suggestion`)
