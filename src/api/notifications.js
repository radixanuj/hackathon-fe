import { http, unwrap, unwrapList } from '../lib/http'

/**
 * params:
 *   scope    inbox (default) | archived | all
 *   status   unread | read | all
 *   category people | connect | communities | learn | do_together | celebrate
 *   type, page, per_page
 *
 * Comes back as `{ items, meta }` plus the counts the bell and tabs need.
 */
export const listNotifications = (params) =>
  http.get('/notifications', params).then((payload) => ({
    ...unwrapList(payload),
    summary: payload?.summary ?? null,
  }))

/** Just the counts — small enough to poll. */
export const getSummary = () => http.get('/notifications/summary').then(unwrap)

export const markRead = (id) => http.patch(`/notifications/${id}/read`).then(unwrap)

export const markUnread = (id) => http.delete(`/notifications/${id}/read`).then(unwrap)

/** Notifications are never deleted — archiving is as far as it goes. */
export const archive = (id) => http.post(`/notifications/${id}/archive`).then(unwrap)

/** Pull one back out of the archive and into the inbox. */
export const unarchive = (id) => http.delete(`/notifications/${id}/archive`).then(unwrap)

export const readAll = () => http.post('/notifications/read-all')

/** `only_read` leaves anything still unread sitting in the inbox. */
export const archiveAll = (onlyRead = false) =>
  http.post('/notifications/archive-all', undefined, {
    params: onlyRead ? { only_read: true } : undefined,
  })
