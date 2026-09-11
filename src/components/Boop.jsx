import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Boop - the mascot for a poke.
 *
 * Drawn inline rather than loaded from /photos/boop.svg so every stroke paints
 * in currentColor: sit it on anything that resolves `color` (text-acc, or the
 * inside of an accent button) and it re-tints with the colour of the day for
 * free, same trick the logo plays with var(--acc).
 *
 * A poke is three movements layered together - the hand winds back and jabs,
 * the sparks fire off the fingertip, the word takes the hit and bounces.
 */

/* --- Geometry, in the SVG's own units ---------------------------------- */

// The hand alone (cuff, fist, pointing finger, sparks). Ends where the
// wordmark would start, so it crops tight enough to sit inside a button.
const MARK_BOX = '0 0 512 245'
const MARK_RATIO = 512 / 245

// Hand plus the "boop" wordmark.
const FULL_BOX = '0 0 934 250'
const FULL_RATIO = 934 / 250

const HAND =
  'M83 106 L225 90 C285 82 342 70 388 67 C421 65 429 97 400 106 ' +
  'C368 117 310 124 268 128 C330 131 330 164 268 167 ' +
  'C322 170 322 200 268 203 C312 206 312 230 262 232 L83 232 Z'

// Three strokes radiating off the fingertip at roughly -50deg, 0, +50deg.
const SPARKS = ['M447 58 L475 26', 'M460 86 L492 86', 'M447 114 L475 146']

// The wordmark is geometric enough to be circles and rounded bars, which keeps
// it a shape rather than a webfont the card has to wait for. Each bowl is a
// stroked circle - the counter is the hole the stroke leaves behind.
const BOWLS = [589, 685, 781, 877]
const BOWL_R = 29
const BOWL_STROKE = 32

/* --- Component ---------------------------------------------------------- */

const EASE = 'cubic-bezier(.4, 0, .2, 1)'
const DURATION = 640

function animation(name, on, loop) {
  if (!on) return undefined
  return `${name} ${DURATION}ms ${EASE} ${loop ? 'infinite' : '1'}`
}

// SVG transforms resolve against the viewport origin unless we say otherwise,
// which would swing a 2deg rotate halfway across the canvas. fill-box pins each
// group to its own bounds so the hand pivots at the wrist and the sparks grow
// out of the fingertip.
const PIVOT = { transformBox: 'fill-box', transformOrigin: 'left center' }

function Art({ poking, loop, word }) {
  return (
    <>
      <g style={{ ...PIVOT, animation: animation('boopJab', poking, loop) }}>
        <rect x="3" y="107" width="71" height="123" rx="23" fill="currentColor" />
        <path d={HAND} fill="currentColor" />
      </g>

      <g
        style={{ ...PIVOT, animation: animation('boopSpark', poking, loop) }}
        stroke="currentColor"
        strokeWidth="26"
        strokeLinecap="round"
      >
        {SPARKS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>

      {word && (
        <g style={{ ...PIVOT, animation: animation('boopTakeHit', poking, loop) }}>
          <rect x="544" y="52" width="32" height="93" rx="16" fill="currentColor" />
          <rect x="832" y="145" width="32" height="93" rx="16" fill="currentColor" />
          {BOWLS.map((cx) => (
            <circle
              key={cx}
              cx={cx}
              cy="145"
              r={BOWL_R}
              fill="none"
              stroke="currentColor"
              strokeWidth={BOWL_STROKE}
            />
          ))}
        </g>
      )}
    </>
  )
}

/**
 * The hand on its own, for buttons and anywhere the word would be too much.
 * `size` is its height in px; leave it off and size it with `className`.
 */
export function BoopMark({ size, poking = false, loop = false, className = '' }) {
  return (
    <svg
      viewBox={MARK_BOX}
      height={size}
      width={size ? size * MARK_RATIO : undefined}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <Art poking={poking} loop={loop} word={false} />
    </svg>
  )
}

/**
 * Hand plus wordmark. `poking` plays the jab once; add `loop` to keep it going
 * while something is thinking.
 */
export default function Boop({ size, poking = false, loop = false, className = '' }) {
  return (
    <svg
      viewBox={FULL_BOX}
      height={size}
      width={size ? size * FULL_RATIO : undefined}
      className={className}
      role="img"
      aria-label="Boop"
    >
      <Art poking={poking} loop={loop} word />
    </svg>
  )
}

/**
 * One-shot poke trigger: `[poking, poke]`. Poking again mid-animation drops the
 * flag for a frame so the keyframes restart instead of ignoring the second tap.
 */
export function useBoop() {
  const [poking, setPoking] = useState(false)
  const timer = useRef(null)
  const frame = useRef(null)

  const poke = useCallback(() => {
    clearTimeout(timer.current)
    cancelAnimationFrame(frame.current)
    setPoking(false)
    frame.current = requestAnimationFrame(() => {
      setPoking(true)
      timer.current = setTimeout(() => setPoking(false), DURATION)
    })
  }, [])

  useEffect(
    () => () => {
      clearTimeout(timer.current)
      cancelAnimationFrame(frame.current)
    },
    [],
  )

  return [poking, poke]
}
