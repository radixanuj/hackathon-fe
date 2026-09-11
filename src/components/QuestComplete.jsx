import { createPortal } from 'react-dom'

const CONFETTI = [
  { size: 10, dx: '-160px', dy: '-70px', delay: '.25s', color: 'var(--acc)' },
  { size: 8, dx: '150px', dy: '-90px', delay: '.3s', color: '#14120F' },
  { size: 12, dx: '-120px', dy: '80px', delay: '.2s', color: 'var(--acc-soft)' },
  { size: 9, dx: '130px', dy: '100px', delay: '.35s', color: 'var(--acc)' },
  { size: 7, dx: '0px', dy: '-140px', delay: '.28s', color: '#14120F' },
]

/** The moment all five introductions are done. */
export default function QuestComplete({ onClose, teams, locations }) {
  return createPortal(
    <div className="fixed inset-0 z-[150] grid animate-fade place-items-center bg-[rgb(20_18_15/0.45)] p-[22px] backdrop-blur-lg" onClick={onClose}>
      <div
        onClick={(event) => event.stopPropagation()}
        className="rx-sheet relative max-w-[520px] overflow-hidden px-[34px] py-11 text-center"
      >
        {CONFETTI.map((bit, index) => (
          <div
            key={index}
            className="absolute top-24 left-1/2 rounded-full"
            style={{
              width: bit.size,
              height: bit.size,
              background: bit.color,
              '--dx': bit.dx,
              '--dy': bit.dy,
              animation: `burst 1.2s ${bit.delay} ease-out both`,
            }}
          />
        ))}
        <span
          className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-acc text-[40px] text-on-acc"
          style={{ animation: 'pop .6s .1s cubic-bezier(.2,1.6,.3,1) both' }}
        >
          ✓
        </span>
        <h2 className="rx-display m-0 mt-[26px] text-[clamp(30px,4.4vw,42px)] leading-[1.02]">Mission complete</h2>
        <p className="m-0 mt-[14px] mb-7 text-[18.5px] leading-[1.5] text-muted">
          Five people, {teams} teams, {locations} locations — in one month. Radix is a bit smaller now.
        </p>
        <button onClick={onClose} className="rx-btn rx-btn-acc rounded-ctl px-[30px] py-[17px] text-[17px]" style={{ minHeight: 54 }}>
          Nice
        </button>
      </div>
    </div>,
    document.body,
  )
}
