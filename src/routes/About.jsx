import { useNavigate } from 'react-router-dom'

/**
 * "What's IRL" — the manifesto page, ported straight from the design canvas
 * (Radix Connect.dc.html, isAbout section, lines 1033-1143). Kept literal to
 * the design's structure and dimensions so the layout matches piece for piece.
 */

// Chips in the hero panel.
const HERO_CHIPS = [
  'Big thinkers.',
  'Sharp leaders.',
  'Deep experts.',
  'Sports fanatics.',
  'Weekend hikers.',
  'Art lovers.',
  'Book hoarders.',
]

// The dark card's three bullet lines.
const PROBLEM_LINES = [
  'Too many of us are still names on project plans.',
  'Faces in Zoom boxes.',
  'People somewhere on the other side of a time zone.',
]

// The "already doing" cards, in the design's order.
const DOING = [
  { i: 'NS', name: 'Neha', bg: '#EFE6D8', line: 'Ask Neha for 30 minutes of mentoring.' },
  {
    i: 'PB',
    name: 'Parag',
    bg: '#E3E7DF',
    line: 'Get Parag to explain that data science model without making your brain hurt.',
  },
  { i: 'SM', name: 'Suman', bg: '#F3DFD8', line: 'Set up a quick coaching session with Suman.' },
  { i: 'NR', name: 'Namrata', bg: '#E7E4EE', line: 'Sign up for an art workshop with Namrata.' },
  {
    i: 'AN',
    name: 'Anu',
    bg: '#EFE6D8',
    line: 'Hear the inside story from Anu on how abuse mitigation actually works.',
  },
]

// "You could, today" chips — inv (filled) and outline alternate per the design.
const TODAY_CHIPS = [
  { label: 'Find the F1 crowd.', fill: true },
  { label: 'Plan a trek.', fill: false },
  { label: 'Recommend a movie.', fill: false },
  { label: 'Send out an impromptu "Anyone up for a drink after work?"', fill: true },
  { label: 'Start a book club.', fill: false },
  { label: 'Find a squash partner.', fill: true },
  { label: 'Join the cricket group.', fill: false },
  { label: 'Share a photo from your weekend.', fill: false },
]

export default function About() {
  const navigate = useNavigate()

  return (
    <section className="animate-rise pt-[52px]">
      {/* --- Hero panel ---------------------------------------------------- */}
      <div className="relative overflow-hidden rounded-[30px] border border-line bg-cream p-[clamp(28px,3.6vw,48px)]">
        <div
          className="absolute top-[-90px] right-[-90px] h-[300px] w-[300px] rounded-full bg-tint"
          style={{ animation: 'floatC 15s ease-in-out infinite' }}
        />
        <div className="relative max-w-[840px]">
          <p className="m-0 mb-4 text-[20px] font-bold tracking-[.16em] text-acc-ink uppercase leading-[1.2]">
            What's IRL
          </p>
          <h1 className="rx-display m-0 text-[clamp(34px,5vw,64px)] leading-none tracking-[-.038em] text-pretty">
            Radix has{' '}
            <span className="relative inline-block text-acc-ink">
              <span
                className="absolute right-0 left-0 bottom-[.06em] h-[.18em] origin-left bg-acc-soft"
                style={{ animation: 'drawUl .9s .3s cubic-bezier(.2,.9,.3,1) both' }}
              />
              <span className="relative">ridiculously interesting</span>
            </span>{' '}
            people.
          </h1>
          <div className="mt-7 flex flex-wrap gap-[9px]">
            {HERO_CHIPS.map((label) => (
              <span
                key={label}
                className="rounded-full border border-edge-soft bg-white px-[17px] py-[11px] text-[20px] font-semibold leading-[1.1]"
              >
                {label}
              </span>
            ))}
          </div>
          <p className="m-0 mt-6 max-w-[680px] text-[20px] leading-[1.5] text-muted text-pretty">
            People who know things you want to know, and care about things you never knew they cared
            about too.
          </p>
        </div>
      </div>

      {/* --- Problem / Not anymore split ---------------------------------- */}
      <div className="mt-5 grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(330px,1fr))]">
        <div className="min-w-0 rounded-[28px] bg-ink p-[clamp(26px,3vw,38px)] text-white">
          <p className="rx-display m-0 mb-[22px] text-[clamp(34px,5vw,64px)] leading-none tracking-[-.038em]">
            There's just one problem.
          </p>
          <div className="grid gap-3">
            {PROBLEM_LINES.map((line) => (
              <div
                key={line}
                className="rounded-[18px] bg-[#211E1A] px-[22px] py-5 text-[20px] leading-[1.5] text-[#CFC9C0]"
              >
                {line}
              </div>
            ))}
          </div>
        </div>
        <div
          className="relative flex min-w-0 flex-col justify-between gap-[26px] overflow-hidden rounded-[28px] bg-acc p-[clamp(26px,3vw,38px)] text-on-acc shadow-[0_20px_48px_rgb(20_18_15/0.15)]"
        >
          <div
            className="absolute bottom-[-70px] left-[-70px] h-[230px] w-[230px] rounded-full border-2 border-current opacity-30"
            style={{ animation: 'floatA 13s ease-in-out infinite' }}
          />
          <p className="relative m-0 text-[20px] font-bold tracking-[.16em] uppercase leading-[1.2] opacity-[.88]">
            Not anymore.
          </p>
          <p className="rx-display relative m-0 text-[clamp(34px,5vw,64px)] leading-none tracking-[-.038em]">
            Meet IRL.
            <br />
            In Real Life.
            <br />
            Into Radix Life.
          </p>
        </div>
      </div>

      {/* --- And that's just the start ------------------------------------ */}
      <p className="rx-display m-0 mt-16 mb-1.5 text-[clamp(34px,5vw,64px)] leading-none tracking-[-.038em]">
        And that's just the start.
      </p>
      <p className="m-0 mb-[26px] text-[20px] leading-[1.5] text-muted">
        A few things people are already doing.
      </p>
      <div className="grid gap-[14px] [grid-template-columns:repeat(auto-fill,minmax(340px,1fr))]">
        {DOING.map((row, index) => (
          <article
            key={row.name}
            className="rx-card rx-card-lift flex min-w-0 animate-rise items-start gap-4 rounded-[20px] p-[22px]"
            style={{ animationDelay: `${index * 0.06}s` }}
          >
            <span
              className="grid h-[52px] w-[52px] flex-none place-items-center rounded-[15px] font-display text-[18px] font-extrabold text-ink"
              style={{ background: row.bg }}
            >
              {row.i}
            </span>
            <div className="min-w-0">
              <p className="m-0 mb-[5px] text-[15px] font-bold tracking-[.1em] text-acc-ink uppercase">
                {row.name}
              </p>
              <p className="m-0 text-[19px] leading-[1.4] text-pretty">{row.line}</p>
            </div>
          </article>
        ))}
        <article
          className="flex min-w-0 animate-rise items-center gap-4 rounded-[20px] border-[1.5px] border-dashed border-edge-hover bg-cream p-[22px]"
          style={{ animationDelay: '0.3s' }}
        >
          <span className="grid h-[52px] w-[52px] flex-none place-items-center rounded-[15px] bg-white text-[26px]">
            ✨
          </span>
          <p className="m-0 text-[19px] leading-[1.4] text-muted text-pretty">
            …and a hundred other things we haven't thought of yet.
          </p>
        </article>
      </div>

      {/* --- You could, today --------------------------------------------- */}
      <div className="relative mt-[26px] overflow-hidden rounded-[28px] bg-acc p-[clamp(28px,3.4vw,44px)] text-on-acc">
        <div
          className="absolute right-[-90px] bottom-[-110px] h-[300px] w-[300px] rounded-full border-2 border-current opacity-[.26]"
          style={{ animation: 'floatC 16s ease-in-out infinite' }}
        />
        <p className="rx-display relative m-0 mb-[22px] max-w-[620px] text-[clamp(26px,3.2vw,38px)] leading-[1.05] tracking-[-.03em]">
          You could, today:
        </p>
        <div className="relative flex flex-wrap gap-3">
          {TODAY_CHIPS.map((chip, index) => (
            <span
              key={chip.label}
              className={
                chip.fill
                  ? 'animate-pop rounded-full border-[1.5px] border-transparent bg-inv px-[22px] py-[13px] text-[19px] font-semibold leading-[1.15] whitespace-nowrap text-on-inv'
                  : 'animate-pop rounded-full border-[1.5px] border-current bg-transparent px-[22px] py-[13px] text-[19px] font-semibold leading-[1.15] whitespace-nowrap text-on-acc'
              }
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {chip.label}
            </span>
          ))}
          <span
            className="animate-pop rounded-full border-[1.5px] border-dashed border-current px-[22px] py-[13px] text-[19px] font-semibold leading-[1.15] opacity-70"
            style={{ animationDelay: '0.45s' }}
          >
            or whatever else you feel like
          </span>
        </div>
      </div>

      {/* --- Closing two panels ------------------------------------------- */}
      <div className="mt-[26px] grid items-stretch gap-[14px] [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
        <div className="flex min-w-0 flex-col justify-center gap-[18px] rounded-[28px] bg-ink p-[clamp(28px,3.2vw,40px)] text-white">
          <p className="rx-display m-0 text-[clamp(24px,2.8vw,34px)] leading-[1.08] tracking-[-.03em] text-pretty">
            IRL takes what Radix already has — smart, curious, wonderfully different people — and
            makes it available to everyone.
          </p>
          <p className="m-0 text-[19px] leading-[1.5] text-[#B9B4AB] text-pretty">
            Real connection, made possible digitally. Built by us, for us — beyond roles, meetings
            and geos.
          </p>
        </div>
        <div className="flex min-w-0 flex-col justify-center gap-5 rounded-[28px] border border-line bg-cream p-[clamp(28px,3.2vw,40px)]">
          <p className="font-display m-0 text-[22px] font-bold leading-[1.35] text-pretty">
            Because when people know each other, they learn more. Create more. Care more.
          </p>
          <p className="font-display m-0 text-[22px] font-bold leading-[1.45] text-pretty">
            <span
              className="mx-[-5px] px-[5px] py-[3px]"
              style={{
                background: 'var(--acc-soft)',
                boxDecorationBreak: 'clone',
                WebkitBoxDecorationBreak: 'clone',
              }}
            >
              And teams that care about each other can achieve extraordinary things.
            </span>
          </p>
          <p className="m-0 text-[19px] leading-[1.5] text-muted text-pretty">
            People will come and go. The knowledge, relationships and culture we create can outlast
            us all.
          </p>
          <button
            onClick={() => navigate('/')}
            className="rx-btn rx-btn-acc mt-1 self-start min-h-[52px] rounded-[15px] px-7 py-4 text-[19px]"
          >
            Home
          </button>
        </div>
      </div>
    </section>
  )
}
