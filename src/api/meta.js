import { http, unwrap } from '../lib/http'

/** Every enum plus the live team and location lists. */
export const getMeta = () => http.get('/meta').then(unwrap)

/** The whole home screen in one call, across all six pillars. */
export const getDashboard = () => http.get('/dashboard').then(unwrap)
