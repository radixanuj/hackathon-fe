import { http, unwrap, unwrapList } from '../lib/http'

/** params: scope (upcoming | past | all), category, host_id, group_id, attending, q, page */
export const listEvents = (params) => http.get('/events', params).then(unwrapList)

export const getEvent = (id) => http.get(`/events/${id}`).then(unwrap)

export const createEvent = (payload) => http.post('/events', payload).then(unwrap)

export const updateEvent = (id, payload) => http.patch(`/events/${id}`, payload).then(unwrap)

export const deleteEvent = (id) => http.delete(`/events/${id}`)

/** status: going | maybe | not_going */
export const rsvp = (id, status) => http.post(`/events/${id}/rsvp`, { status }).then(unwrap)

export const listAttendees = (id, params) =>
  http.get(`/events/${id}/attendees`, params).then(unwrapList)
