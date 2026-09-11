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
