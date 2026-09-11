/**
 * Three plausible slots over the next few working days.
 *
 * `scheduled_at` is required whenever a session is accepted or a new time is
 * suggested, so every one of those actions needs a time in hand first.
 */
export function buildSlots() {
  const slots = []
  const cursor = new Date()
  const hours = [15, 11, 16]
  const minutes = [0, 0, 30]
  let index = 0
  while (slots.length < 3) {
    cursor.setDate(cursor.getDate() + 1)
    const day = cursor.getDay()
    if (day === 0 || day === 6) continue
    const at = new Date(cursor)
    at.setHours(hours[index % 3], minutes[index % 3], 0, 0)
    slots.push({
      value: at.toISOString(),
      label:
        at.toLocaleDateString(undefined, { weekday: 'short' }) +
        ' ' +
        at.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
    })
    index += 1
  }
  return slots
}

/**
 * The scheduling grid: a working day, then an hour within it.
 *
 * `buildSlots` above hands back three fixed suggestions, which is all a reply
 * in the sessions list needs. Asking for a session is the other way round —
 * you have a week in your head — so the request sheet picks a day first and
 * then a time on it.
 */
const HOURS = [
  [9, 30],
  [11, 0],
  [12, 30],
  [14, 0],
  [15, 30],
  [17, 0],
]

/** The next `count` working days, starting tomorrow. */
export function buildDays(count = 6) {
  const days = []
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)

  while (days.length < count) {
    cursor.setDate(cursor.getDate() + 1)
    const weekday = cursor.getDay()
    if (weekday === 0 || weekday === 6) continue
    const date = new Date(cursor)
    days.push({
      key: dayKey(date),
      date,
      label: date.toLocaleDateString(undefined, { weekday: 'short' }),
      sub: date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
    })
  }

  return days
}

/** Every hour on offer for one day, as ISO values ready for `proposed_at`. */
export function buildTimes(day) {
  if (!day) return []

  return HOURS.map(([hour, minute]) => {
    const at = new Date(day.date)
    at.setHours(hour, minute, 0, 0)
    return {
      value: at.toISOString(),
      label: at.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
      // Defensive: `buildDays` starts tomorrow, so nothing here is in the past
      // — unless a sheet is left open across midnight.
      past: at.getTime() < Date.now(),
    }
  })
}

const dayKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

/** "Tue 16 Sep · 11:00 am" — how a chosen slot reads back. */
export function slotLabel(value) {
  if (!value) return ''
  const at = new Date(value)
  return `${at.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })} · ${at.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`
}
