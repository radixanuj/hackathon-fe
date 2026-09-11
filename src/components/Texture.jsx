/**
 * The drifting Radix marks the canvas fixes behind every screen
 * (Radix Connect.dc.html lines 79-118, identical in the signed-out and
 * signed-in trees). Stroked in the colour of the day at 15%, so it re-tints
 * with the theme the way the rest of the app does.
 */

// [rxFloat variant, duration in seconds, placement transform, path data]
const SHAPES = [
  ['A', 34, "translate(84 62) scale(1.1) rotate(12)", ["M0 -34 L29 -17 L29 17 L0 34 L-29 17 L-29 -17 Z", "M0 -20 L17 -10 L17 10 L0 20 L-17 10 L-17 -10 Z"]],
  ['C', 33, "translate(318 36) scale(0.62) rotate(52)", ["M-30 -18 L0 0 L30 -18 M-30 4 L0 22 L30 4"]],
  ['B', 46, "translate(546 104) scale(0.78) rotate(-22)", ["M0 -30 L18 -25 L29 -9 L29 9 L18 25 L0 30 L-18 25 L-29 9 L-29 -9 L-18 -25 Z"]],
  ['A', 29, "translate(772 48) scale(0.7) rotate(18)", ["M-32 10 L-16 -10 L0 10 L16 -10 L32 10"]],
  ['B', 41, "translate(964 92) scale(0.92) rotate(-18)", ["M0 -38 L9 -12 L37 -12 L14 5 L23 32 L0 15 L-23 32 L-14 5 L-37 -12 L-9 -12 Z"]],
  ['C', 37, "translate(1166 46) scale(0.66) rotate(36)", ["M0 -26 A13 13 0 0 1 0 0 A13 13 0 0 1 0 26 A13 13 0 0 1 0 0 A13 13 0 0 1 0 -26 Z M-26 0 A13 13 0 0 0 0 0 A13 13 0 0 0 26 0"]],
  ['B', 30, "translate(32 206) scale(0.58) rotate(-14)", ["M0 -28 A28 28 0 0 1 24 14 A28 28 0 0 1 -24 14 A28 28 0 0 1 0 -28 Z"]],
  ['C', 42, "translate(226 178) scale(0.74) rotate(28)", ["M0 -34 L20 0 L0 34 L-20 0 Z", "M0 -18 L11 0 L0 18 L-11 0 Z"]],
  ['A', 27, "translate(438 244) scale(0.68) rotate(-34)", ["M-28 0 A28 28 0 0 1 28 0 M-18 0 A18 18 0 0 1 18 0 M-8 0 A8 8 0 0 1 8 0"]],
  ['C', 29, "translate(648 196) scale(0.8) rotate(34)", ["M-13 -31 H13 L31 -13 V13 L13 31 H-13 L-31 13 V-13 Z", "M-7 -17 H7 L17 -7 V7 L7 17 H-7 L-17 7 V-7 Z"]],
  ['B', 35, "translate(888 238) scale(0.64) rotate(-42)", ["M0 0 V-30 M0 0 L26 15 M0 0 L-26 15"]],
  ['B', 47, "translate(1112 218) scale(1.18) rotate(8)", ["M0 -34 L29 -17 L29 17 L0 34 L-29 17 L-29 -17 Z", "M0 -20 L17 -10 L17 10 L0 20 L-17 10 L-17 -10 Z"]],
  ['A', 40, "translate(128 352) scale(0.86) rotate(22)", ["M0 -30 L23 -19 L29 6 L13 27 L-13 27 L-29 6 L-23 -19 Z"]],
  ['A', 26, "translate(344 328) scale(0.66) rotate(-26)", ["M0 -32 L28 16 L-28 16 Z", "M0 -16 L14 8 L-14 8 Z"]],
  ['C', 51, "translate(556 402) scale(0.72) rotate(44)", ["M0 0 L0 -30 A30 30 0 0 1 21 -21 Z M0 0 L30 0 A30 30 0 0 1 21 21 Z M0 0 L0 30 A30 30 0 0 1 -21 21 Z M0 0 L-30 0 A30 30 0 0 1 -21 -21 Z"]],
  ['C', 38, "translate(802 366) scale(1) rotate(22)", ["M0 -28 A28 28 0 0 1 24 14 A28 28 0 0 1 -24 14 A28 28 0 0 1 0 -28 Z"]],
  ['A', 32, "translate(1024 414) scale(0.6) rotate(-30)", ["M-14 0 A24 24 0 0 1 14 0 A24 24 0 0 1 -14 0 Z"]],
  ['A', 39, "translate(1204 344) scale(0.76) rotate(-44)", ["M0 -32 L28 16 L-28 16 Z", "M0 -16 L14 8 L-14 8 Z"]],
  ['B', 44, "translate(46 486) scale(0.84) rotate(46)", ["M0 -30 L29 -9 L18 26 L-18 26 L-29 -9 Z", "M0 -16 L15 -5 L9 14 L-9 14 L-15 -5 Z"]],
  ['C', 28, "translate(262 512) scale(0.7) rotate(-16)", ["M0 -28 V28 M-24 -14 L24 14 M-24 14 L24 -14"]],
  ['A', 31, "translate(466 556) scale(1.04) rotate(-12)", ["M-8 -30 H8 V-8 H30 V8 H8 V30 H-8 V8 H-30 V-8 H-8 Z"]],
  ['B', 36, "translate(686 508) scale(0.68) rotate(26)", ["M-28 -20 L28 20 L28 -20 L-28 20 Z"]],
  ['C', 36, "translate(902 574) scale(0.8) rotate(30)", ["M-26 -26 H26 V26 H-26 Z", "M-13 -13 H13 V13 H-13 Z"]],
  ['B', 48, "translate(1138 546) scale(0.72) rotate(-20)", ["M-30 0 A30 30 0 1 1 30 0 A30 30 0 1 1 -30 0 Z M-19 0 A19 19 0 1 1 19 0 A19 19 0 1 1 -19 0 Z M-8 0 A8 8 0 1 1 8 0 A8 8 0 1 1 -8 0 Z"]],
  ['A', 30, "translate(158 648) scale(0.64) rotate(38)", ["M0 -28 A32 32 0 0 1 0 28 A32 32 0 0 1 0 -28 Z"]],
  ['A', 28, "translate(372 694) scale(0.72) rotate(16)", ["M0 -32 L11 -13 L32 -13 L18 4 L23 26 L0 15 L-23 26 L-18 4 L-32 -13 L-11 -13 Z"]],
  ['B', 49, "translate(604 656) scale(0.94) rotate(-38)", ["M0 -34 L29 -17 L29 17 L0 34 L-29 17 L-29 -17 Z", "M0 -20 L17 -10 L17 10 L0 20 L-17 10 L-17 -10 Z"]],
  ['C', 25, "translate(826 712) scale(0.66) rotate(24)", ["M-32 0 q8 -14 16 0 t16 0 t16 0 t16 0"]],
  ['C', 43, "translate(1042 684) scale(0.88) rotate(-24)", ["M-13 -31 H13 L31 -13 V13 L13 31 H-13 L-31 13 V-13 Z"]],
  ['B', 45, "translate(62 792) scale(0.7) rotate(14)", ["M-27 -27 H27 V27 H-27 Z M-9 -27 V27 M9 -27 V27 M-27 -9 H27 M-27 9 H27"]],
  ['A', 33, "translate(288 836) scale(0.62) rotate(-36)", ["M0 -28 L24 14 L-24 14 Z M0 28 L-24 -14 L24 -14 Z"]],
  ['B', 45, "translate(518 792) scale(1.06) rotate(26)", ["M0 -30 L29 -9 L18 26 L-18 26 L-29 -9 Z", "M0 -16 L15 -5 L9 14 L-9 14 L-15 -5 Z"]],
  ['C', 41, "translate(744 852) scale(0.68) rotate(-18)", ["M0 -30 L22 0 L0 30 L-22 0 Z M0 -15 L11 0 L0 15 L-11 0 Z M-22 0 H22 M0 -30 V30"]],
  ['A', 34, "translate(976 826) scale(0.6) rotate(30)", ["M0 -34 L20 0 L0 34 L-20 0 Z", "M0 -18 L11 0 L0 18 L-11 0 Z"]],
  ['B', 39, "translate(1188 776) scale(0.74) rotate(-12)", ["M0 -30 L23 -19 L29 6 L13 27 L-13 27 L-29 6 L-23 -19 Z"]],
]

export default function Texture() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1240 880"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none fixed inset-0 z-0 h-screen w-screen"
    >
      <g
        fill="none"
        stroke="var(--acc)"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.15"
      >
        {SHAPES.map(([variant, seconds, transform, paths], index) => (
          <g key={index} style={{ animation: `rxFloat${variant} ${seconds}s ease-in-out infinite` }}>
            <g transform={transform}>
              {paths.map((d, sub) => (
                <path key={sub} d={d} />
              ))}
            </g>
          </g>
        ))}
      </g>
    </svg>
  )
}
