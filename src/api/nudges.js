import { http, unwrap, unwrapList } from '../lib/http'

/**
 * Nudge someone — or nudge them back, which is the same call. Which one it was
 * depends only on who nudged last, so the caller never has to say.
 *
 * Returns the whole `{ message, data }` rather than unwrapping: the server
 * writes the confirmation because it is the side that knows the streak, and the
 * toast should say exactly that.
 */
export const sendNudge = (userId) => http.post(`/users/${userId}/nudge`)

/** Where you and one other person stand: can_nudge, whose turn, how deep. */
export const nudgeState = (userId) => http.get(`/users/${userId}/nudge`).then(unwrap)

/**
 * params:
 *   scope   all (default) | sent | received
 *   status  all (default) | outstanding | returned
 *   page, per_page
 *
 * Every row is told from your side: `person` is the other one and `direction`
 * says which way it went.
 */
export const listNudges = (params) =>
  http.get('/me/nudges', params).then((payload) => ({
    ...unwrapList(payload),
    summary: payload?.summary ?? null,
  }))

/** Just the counts, for a badge. */
export const getNudgeSummary = () => http.get('/me/nudges/summary').then(unwrap)
