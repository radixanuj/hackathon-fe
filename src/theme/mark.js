/**
 * The IRL mark: two figures whose paths cross.
 *
 * Each figure is a head plus one stroke - a shoulder arc tucked under the head,
 * carrying on as a leg that runs to the opposite bottom corner. The two legs
 * cross low and centre, which is the whole point of the thing.
 *
 * The geometry lives here rather than inside the component because the favicon
 * is redrawn from the same numbers every time the colour of the day changes,
 * and two hand-kept copies of a logo always drift apart.
 */

export const MARK_VIEW_BOX = '0 0 72 61'
export const MARK_WIDTH = 72
export const MARK_HEIGHT = 61
export const MARK_STROKE = 11

/** Heads, left then right. */
export const MARK_HEADS = [
  { cx: 14.2, cy: 9.2, r: 8.8 },
  { cx: 57.8, cy: 9.2, r: 8.8 },
]

/** Bodies. The second is the first mirrored about x = 36. */
export const MARK_BODIES = [
  'M6.5 31C6.5 26 16 22.5 23 29 30 35.5 45 49 64 55',
  'M65.5 31C65.5 26 56 22.5 49 29 42 35.5 27 49 8 55',
]

/**
 * One gradient paints both figures, running left to right: the accent lifted,
 * the accent, its deep tone, then ink. So the left figure wears the colour of
 * the day, the crossing burns through it, and the right figure falls to black
 * - exactly the orange-into-charcoal read of the original, whatever hue the
 * theme happens to be wearing.
 */
export const MARK_STOPS = [
  { key: 'lift', offset: 0 },
  { key: 'acc', offset: 0.36 },
  { key: 'deep', offset: 0.52 },
  { key: 'ink', offset: 0.64 },
]

const INK = '#14120f'

/** Straight sRGB blend - close enough for one gradient stop. */
function blend(from, to, amount) {
  const a = parseInt(from.slice(1), 16)
  const b = parseInt(to.slice(1), 16)
  const channel = (shift) => {
    const value = ((a >> shift) & 255) * (1 - amount) + ((b >> shift) & 255) * amount
    return Math.round(value).toString(16).padStart(2, '0')
  }
  return `#${channel(16)}${channel(8)}${channel(0)}`
}

/**
 * The mark on a tinted tile as a data: URI, for the browser tab. Takes a theme
 * straight out of THEMES, so the tab icon re-tints with everything else.
 */
export function faviconHref({ acc, ink, tint }) {
  const colour = { lift: blend(acc, tint, 0.14), acc, deep: ink, ink: INK }

  const stops = MARK_STOPS.map(
    (stop) => `<stop offset="${stop.offset}" stop-color="${colour[stop.key]}"/>`,
  ).join('')
  const heads = MARK_HEADS.map((head) => `<circle cx="${head.cx}" cy="${head.cy}" r="${head.r}"/>`).join('')
  const bodies = MARK_BODIES.map(
    (d) =>
      `<path d="${d}" fill="none" stroke="url(#m)" stroke-width="${MARK_STROKE}" stroke-linecap="round"/>`,
  ).join('')

  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
    `<defs><linearGradient id="m" x1="0" y1="0" x2="${MARK_WIDTH}" y2="0" gradientUnits="userSpaceOnUse">${stops}</linearGradient></defs>` +
    `<rect width="64" height="64" rx="15" fill="${tint}"/>` +
    `<g transform="translate(3.9 8.2) scale(.78)" fill="url(#m)">${heads}${bodies}</g>` +
    '</svg>'

  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}
