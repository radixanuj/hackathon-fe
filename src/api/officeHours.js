import { http, unwrap, unwrapList } from '../lib/http'

/** params: scope (upcoming | past | all), host_id, available_only, page */
export const listSlots = (params) => http.get('/office-hours', params).then(unwrapList)

export const getSlot = (id) => http.get(`/office-hours/${id}`).then(unwrap)

export const createSlot = (payload) => http.post('/office-hours', payload).then(unwrap)

export const updateSlot = (id, payload) => http.patch(`/office-hours/${id}`, payload).then(unwrap)

export const deleteSlot = (id) => http.delete(`/office-hours/${id}`)

/** No accept/decline step — booking a published slot is the whole flow. */
export const book = (id, topic) => http.post(`/office-hours/${id}/book`, { topic }).then(unwrap)

export const cancelBooking = (id) => http.delete(`/office-hours/${id}/book`)

export const myBookings = (params) => http.get('/me/office-hour-bookings', params).then(unwrapList)
