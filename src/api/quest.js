import { http, unwrap } from '../lib/http'

/** Built on first request if the user doesn't have one yet. */
export const getQuest = () => http.get('/me/quest').then(unwrap)

export const regenerateQuest = () => http.post('/me/quest/regenerate').then(unwrap)

/** status: met | skipped | pending */
export const updateTarget = (id, payload) =>
  http.patch(`/quest-targets/${id}`, payload).then(unwrap)
