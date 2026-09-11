/** Two letters for an avatar tile. */
export function initials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase() || '?'
}

// The canvas uses four muted avatar tiles. Hashing the name keeps a person's
// colour stable across screens without the API needing to store one.
const AVATARS = ['#EFE6D8', '#E3E7DF', '#E7E4EE', '#F3DFD8']

export function avatarColor(seed) {
  const key = String(seed ?? '')
  let hash = 0
  for (let index = 0; index < key.length; index += 1) hash = (hash * 31 + key.charCodeAt(index)) | 0
  return AVATARS[Math.abs(hash) % AVATARS.length]
}

/** "Engineering · Mumbai" */
export function personMeta(person) {
  return [person?.team, person?.location].filter(Boolean).join(' · ')
}

export function tenureLabel(person) {
  const years = person?.tenure_years
  if (years === null || years === undefined) return ''
  if (years < 1) {
    const weeks = Math.max(1, Math.round(years * 52))
    return `${weeks} week${weeks === 1 ? '' : 's'} at Radix`
  }
  const rounded = Math.round(years)
  return `${rounded} year${rounded === 1 ? '' : 's'} at Radix`
}

const DATE = { weekday: 'long', day: 'numeric', month: 'long' }
const TIME = { hour: 'numeric', minute: '2-digit' }

export function eventWhen(event) {
  if (!event?.starts_at) return ''
  const date = new Date(event.starts_at)
  const when = `${date.toLocaleDateString(undefined, DATE)} · ${date.toLocaleTimeString(undefined, TIME)}`
  const where = event.is_virtual ? 'Virtual' : event.location
  return where ? `${when} · ${where}` : when
}

export function shortDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'long' })
}

export function todayLabel() {
  return new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })
}

/** `period` comes back as YYYY-MM. */
export function periodLabel(period) {
  if (!period) return ''
  const [year, month] = period.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString(undefined, { month: 'long' })
}

export const titleCase = (value) =>
  String(value ?? '').replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())

/** Category emoji, so an events grid reads at a glance like the design. */
const EVENT_EMOJI = {
  outdoors: '🥾', food: '🍝', film: '🎬', sports: '🏃',
  games: '🎮', culture: '🎭', work: '💡', other: '✨',
}
export const eventEmoji = (category) => EVENT_EMOJI[category] ?? '✨'

const STORY_EMOJI = {
  sport: '🏃', travel: '🧭', learning: '📚', making: '🛠', milestone: '🎉', other: '✨',
}
export const storyEmoji = (category) => STORY_EMOJI[category] ?? '✨'
