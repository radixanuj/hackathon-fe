import { useId } from 'react'
import {
  MARK_BODIES,
  MARK_HEADS,
  MARK_HEIGHT,
  MARK_STOPS,
  MARK_STROKE,
  MARK_VIEW_BOX,
  MARK_WIDTH,
} from '../theme/mark'

/**
 * The gradient stops resolve through the same custom properties as the rest of
 * the app, so shuffling the colour of the day re-tints the logo with no
 * re-render - the browser just re-resolves var(--acc) on <html>.
 */
const STOP_PAINT = {
  lift: 'var(--logo-lift)',
  acc: 'var(--acc)',
  deep: 'var(--acc-ink)',
  ink: 'var(--color-ink)',
}

/**
 * The mark on its own.
 *
 * `size` is its height in px. `tone="mono"` drops the gradient for
 * currentColor, which is what you want on an accent or dark ground where the
 * ink half of the mark would disappear.
 */
export function LogoMark({ size = 26, tone = 'brand', className = '' }) {
  // useId() hands back colons, which some browsers choke on inside url(#…).
  const gradientId = `logo-${useId().replace(/:/g, '')}`
  const paint = tone === 'mono' ? 'currentColor' : `url(#${gradientId})`

  return (
    <svg
      viewBox={MARK_VIEW_BOX}
      height={size}
      width={(size * MARK_WIDTH) / MARK_HEIGHT}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {tone !== 'mono' && (
        <defs>
          <linearGradient
            id={gradientId}
            x1="0"
            y1="0"
            x2={MARK_WIDTH}
            y2="0"
            gradientUnits="userSpaceOnUse"
          >
            {MARK_STOPS.map((stop) => (
              <stop key={stop.key} offset={stop.offset} style={{ stopColor: STOP_PAINT[stop.key] }} />
            ))}
          </linearGradient>
        </defs>
      )}

      {MARK_HEADS.map((head) => (
        <circle key={head.cx} cx={head.cx} cy={head.cy} r={head.r} fill={paint} />
      ))}
      {MARK_BODIES.map((d) => (
        <path
          key={d}
          d={d}
          fill="none"
          stroke={paint}
          strokeWidth={MARK_STROKE}
          strokeLinecap="round"
        />
      ))}
    </svg>
  )
}

/**
 * Mark plus wordmark. The lettering is real text in the display face and
 * inherits colour, so the caller sets the tone: text-ink on white, text-on-acc
 * with tone="mono" on the accent.
 */
export default function Logo({ size = 25, tone = 'brand', className = '' }) {
  return (
    <span className={`inline-flex items-center ${className}`} style={{ gap: size * 0.24 }}>
      <LogoMark size={size} tone={tone} />
      <span
        className="font-display font-extrabold tracking-[-.03em] leading-none"
        style={{ fontSize: size * 0.92 }}
      >
        IRL
      </span>
    </span>
  )
}
