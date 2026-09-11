import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listUsers } from '../api/people'
import { currentRound, signUp } from '../api/meetups'
import { useAuth } from '../auth/AuthContext'
import Avatar from '../components/Avatar'
import { useOverlays } from '../components/Overlays'
import { ErrorNote } from '../components/States'
import { useToast } from '../components/Toast'
import { HERO_PHOTO_ORDER, periodLabel, personMeta, personPhoto, todayLabel } from '../lib/format'

/** Topics on the design's "Want to learn something?" card. */
const LEARN_TAGS = ['Leadership', 'Photography', 'Python', 'Personal Finance', 'Presentation Skills']

/** Faces on the design's Sunday Morning Run card. */
const RUN_AVATARS = ['KJ', 'SR', 'NN', 'AV']

// Positions and shapes for the five floating hero tiles - matches the design mosaic.
const HERO_LAYOUT = [
  { left: '2%', top: '8%', w: 132, h: 158, anim: 'floatA 8s ease-in-out infinite' },
  { left: '33%', top: 0, w: 126, h: 150, anim: 'floatB 10s ease-in-out infinite' },
  { right: '2%', top: '10%', w: 120, h: 144, anim: 'floatA 11s .6s ease-in-out infinite' },
  { left: '14%', bottom: 0, w: 118, h: 140, anim: 'floatB 9s .3s ease-in-out infinite' },
  { right: '8%', bottom: 0, w: 112, h: 134, anim: 'floatC 12s ease-in-out infinite' },
]

/** Design's mascot for the "Nudge-a-Radical" card. */
function Boop({ poking = false }) {
  return (
    <img
      src="/photos/boop.svg"
      alt="Boop"
      className="block h-auto w-full max-w-[260px]"
      style={{ animation: poking ? 'boopPoke .6s ease-in-out infinite' : undefined }}
    />
  )
}

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const say = useToast()
  const queryClient = useQueryClient()
  const { openProfile, openRequest } = useOverlays()

  // The mosaic needs a specific handful of people (the design ships their
  // photos), and Nudge shuffles from the whole pool, so this one fetch covers
  // both. 100 is enough to include everyone at Radix today.
  const { data: directory, error } = useQuery({
    queryKey: ['users', { per_page: 100 }],
    queryFn: () => listUsers({ per_page: 100 }),
  })

  const { data: round } = useQuery({ queryKey: ['meetup-round', 'current'], queryFn: currentRound })

  const [rolled, setRolled] = useState(null)
  const [rolling, setRolling] = useState(false)
  const [runJoined, setRunJoined] = useState(false)

  const people = useMemo(() => directory?.items ?? [], [directory])

  // First-name lookup so the design's hardcoded people (hero mosaic,
  // Parag, Tanisha) can resolve to real roster ids when they exist.
  const byFirstName = useMemo(() => {
    const map = new Map()
    for (const person of people) {
      const first = person.name?.trim().split(/\s+/)[0]?.toLowerCase()
      if (first && !map.has(first)) map.set(first, person)
    }
    return map
  }, [people])

  const heroFaces = useMemo(
    () => HERO_PHOTO_ORDER.map((key) => byFirstName.get(key)).filter(Boolean),
    [byFirstName],
  )
  const parag = byFirstName.get('parag')
  const tanisha = byFirstName.get('tanisha')

  const signedUp = Boolean(round?.my_signup) && round.my_signup.status !== 'withdrawn'

  const joinMeetup = useMutation({
    mutationFn: () => signUp(round.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['meetup-round'] })
      navigate('/connect')
    },
    onError: (caught) => say(caught.message),
  })

  function nudge() {
    if (!people.length) return
    setRolling(true)
    setTimeout(() => {
      const pool = people.filter((person) => person.id !== rolled?.id && person.id !== user?.id)
      setRolled(pool[Math.floor(Math.random() * pool.length)] ?? null)
      setRolling(false)
    }, 1150)
  }

  if (error) return <div className="pt-14"><ErrorNote error={error} /></div>

  return (
    <>
      {/* --- Hero ---------------------------------------------------------- */}
      <section className="relative pt-14 pb-2">
        <div className="absolute top-[-30px] right-[-60px] z-0 h-80 w-80 rounded-full bg-tint" style={{ animation: 'floatC 12s ease-in-out infinite' }} />
        <div className="absolute top-[180px] right-[300px] z-0 h-24 w-24 rounded-full border-2 border-acc-soft" style={{ animation: 'floatB 9s ease-in-out infinite' }} />
        <div className="relative z-[1] grid items-center gap-9 [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
          <div className="animate-rise">
            <p className="m-0 mb-[14px] text-[15px] font-semibold tracking-[.12em] text-acc-ink uppercase">
              {todayLabel()}
            </p>
            <h1 className="rx-display m-0 text-[clamp(40px,6.2vw,68px)] leading-[.98] text-pretty">
              Hey {user?.name?.split(' ')[0] ?? 'there'} 👋
              <br />
              <span className="text-[clamp(30px,4.4vw,48px)]">
                Meet the surprising people
                <br />
                behind the familiar names.
              </span>
            </h1>
          </div>

          {/* Five floating faces from the design mosaic. */}
          <div className="relative min-h-[400px] animate-rise">
            {heroFaces.map((person, index) => {
              const layout = HERO_LAYOUT[index]
              if (!layout) return null
              const photo = personPhoto(person)
              if (!photo) return null
              return (
                <button
                  key={person.id}
                  onClick={() => openProfile(person.id)}
                  title={person.name}
                  className="absolute overflow-hidden border-none bg-cream p-0 shadow-[0_16px_36px_rgb(20_18_15/0.10)]"
                  style={{
                    ...layout,
                    width: layout.w,
                    height: layout.h,
                    borderRadius: 22,
                    cursor: 'pointer',
                    animation: layout.anim,
                  }}
                >
                  <img src={photo} alt={person.name} className="block h-full w-full object-cover" loading="lazy" />
                  <span
                    className="absolute right-0 bottom-0 left-0 px-[10px] pt-4 pb-2 text-center text-[12.5px] font-bold text-white"
                    style={{ background: 'linear-gradient(transparent,rgb(20 18 15 / 0.72))' }}
                  >
                    {person.name.split(' ')[0]}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* --- Card grid (design order) ------------------------------------- */}
      <section className="mt-8 grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
        {/* 1. Blind Meetup (spans 2) */}
        {round && (
          <article className="relative col-span-2 min-w-0 animate-rise overflow-hidden rounded-card bg-acc p-[34px] text-on-acc transition-transform duration-[350ms] ease-[cubic-bezier(.2,.9,.3,1)] hover:-translate-y-1.5">
            <div className="absolute inset-0 opacity-[.14]" style={{ background: 'linear-gradient(100deg,transparent 20%,#fff 50%,transparent 80%)', animation: 'sweep 6s 1.4s ease-in-out infinite' }} />
            <div className="absolute right-[-40px] bottom-[-70px] h-60 w-60 rounded-full border-2 border-current opacity-[.28]" />
            {round.signups_count > 0 && (
              <span className="absolute top-[22px] right-6 rotate-[-6deg] rounded-[10px] bg-inv px-[14px] py-[9px] text-[13px] font-extrabold tracking-[.08em] text-on-inv uppercase">
                {round.signups_count} already in
              </span>
            )}
            <div className="relative flex flex-wrap items-end justify-between gap-7">
              <div className="max-w-[520px] min-w-[240px]">
                <p className="m-0 mb-3 text-[13.5px] font-bold tracking-[.14em] uppercase opacity-75">Blind Meetup</p>
                <h2 className="rx-display m-0 text-[clamp(28px,3.4vw,40px)] leading-[1.02] tracking-[-.03em]">
                  {round.is_accepting_signups
                    ? `${periodLabel(round.period)} Blind Meetup is open`
                    : `${periodLabel(round.period)} round is closed for sign-ups`}
                </h2>
                <p className="m-0 mt-[14px] text-[18px] leading-[1.45] opacity-[.86]">
                  Meet someone outside your usual team, location or experience level. No work
                  agenda. Just a conversation that might not otherwise happen.
                </p>
              </div>
              <button
                onClick={() => (signedUp ? navigate('/connect') : joinMeetup.mutate())}
                disabled={joinMeetup.isPending || (!signedUp && !round.is_accepting_signups)}
                className="rx-btn rx-btn-inv flex-none rounded-ctl px-7 py-[17px] text-[17px] whitespace-nowrap"
                style={{ minHeight: 54 }}
              >
                {signedUp ? "You're in" : joinMeetup.isPending ? 'Signing up…' : 'Count me in'}
              </button>
            </div>
          </article>
        )}

        {/* 2. Someone to know — Parag Barhate */}
        <article className="rx-card rx-card-lift animate-rise p-7 hover:rotate-[-.5deg]">
          <p className="rx-eyebrow m-0 mb-[18px]">Someone to know</p>
          <div className="flex items-center gap-4">
            <img
              src="/photos/parag.png"
              alt="Parag Barhate"
              className="block h-[72px] w-[72px] flex-none rounded-[20px] object-cover"
            />
            <div className="min-w-0">
              <h3 className="rx-title m-0 text-[25px] font-bold">Meet Parag Barhate</h3>
              <p className="m-0 mt-1 text-[15.5px] text-muted">Senior Director, Data Science</p>
            </div>
          </div>
          <p className="m-0 mt-5 mb-[22px] text-[17px] leading-[1.5]">
            There's more knowledge inside Radix than any org chart can show. Start a conversation
            with Parag and discover what he knows.
          </p>
          <button
            onClick={() => (parag ? openProfile(parag.id) : say('Parag isn’t on the roster yet.'))}
            className="rx-btn rx-btn-ghost"
          >
            View Parag's profile
          </button>
        </article>

        {/* 3. Nudge-a-Radical (Boop) */}
        <article className="relative flex min-h-[280px] min-w-0 animate-rise flex-col justify-between overflow-hidden rounded-card border-[1.5px] border-dashed border-acc-soft bg-cream p-7">
          <div className="relative grid min-h-[118px] place-items-center">
            {rolling ? (
              <Boop poking />
            ) : rolled ? (
              <span className="flex animate-tada items-center gap-[14px]">
                <Avatar person={rolled} size={70} radius={20} />
                <span className="min-w-0">
                  <span className="block font-display text-[22px] font-bold tracking-[-.02em]">{rolled.name}</span>
                  <span className="mt-[3px] block text-[15px] text-muted">{personMeta(rolled)}</span>
                </span>
              </span>
            ) : (
              <Boop />
            )}
          </div>
          <div>
            <h3 className="rx-title m-0 mb-1.5 text-[23px]">
              {rolling ? 'Finding a Radical…' : rolled ? 'Say hello?' : 'Nudge-a-Radical'}
            </h3>
            <p className="m-0 mb-[18px] text-base leading-[1.45] text-muted">
              {rolling
                ? 'Ninety-eight people, four continents.'
                : rolled
                  ? (rolled.intro?.split('.')[0] ?? personMeta(rolled)) + '.'
                  : 'A tiny gesture. A quick hello. A good old-fashioned poke. That’s the whole deal.'}
            </p>
            <div className="flex flex-wrap gap-[9px]">
              <button onClick={nudge} disabled={rolling} className="rx-btn rx-btn-acc hover:rotate-[-2deg]">
                {rolling ? 'Shuffling…' : rolled ? 'Nudge' : 'Nudge someone'}
              </button>
              {rolled && (
                <button onClick={() => setRolled(null)} className="rx-btn rx-btn-ghost">
                  Back
                </button>
              )}
            </div>
          </div>
        </article>

        {/* 4. Want to learn something? */}
        <article className="rx-card-soft animate-rise p-7 transition-transform duration-[350ms] ease-[cubic-bezier(.2,.9,.3,1)] hover:-translate-y-1.5">
          <h3 className="rx-title m-0 text-[25px]">Want to learn something?</h3>
          <p className="m-0 mt-2 mb-5 text-base text-muted">People here have offered to talk about:</p>
          <div className="flex flex-wrap gap-[9px]">
            {LEARN_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => navigate(`/connect?tab=mentoring&topic=${encodeURIComponent(tag)}`)}
                className="cursor-pointer rounded-full border-[1.5px] border-edge-soft bg-white px-[17px] py-[11px] text-[15px] font-semibold transition-all duration-200 ease-[cubic-bezier(.2,1.4,.3,1)] hover:-translate-y-[3px] hover:rotate-[-1.5deg] hover:border-acc hover:bg-acc hover:text-on-acc"
              >
                {tag}
              </button>
            ))}
          </div>
        </article>

        {/* 5. This weekend — Sunday Morning Run — Dubai */}
        <article className="rx-card rx-card-lift animate-rise p-7 hover:rotate-[.5deg]">
          <p className="rx-eyebrow m-0 mb-4">This weekend</p>
          <h3 className="rx-title m-0 text-[26px] leading-[1.1]">
            Sunday Morning Run
            <br />
            — Dubai
          </h3>
          <div className="my-5 flex items-center gap-3">
            <div className="flex">
              {RUN_AVATARS.map((label, index) => (
                <span
                  key={label}
                  className="grid h-[38px] w-[38px] place-items-center rounded-full border-[2.5px] border-white bg-[#EFE6D8] text-[13px] font-bold"
                  style={{ marginLeft: index === 0 ? 0 : -10 }}
                >
                  {label}
                </span>
              ))}
            </div>
            <span className="text-[15.5px] text-muted">{runJoined ? 6 : 5} joining</span>
          </div>
          {runJoined ? (
            <div className="flex animate-pop items-center gap-[10px] rounded-[14px] bg-tint px-[18px] py-[13px] text-[15.5px] font-bold text-acc-ink">
              <span className="grid h-[22px] w-[22px] place-items-center rounded-full bg-acc text-[13px] text-on-acc">
                ✓
              </span>
              You're in
            </div>
          ) : (
            <button
              onClick={() => {
                setRunJoined(true)
                say("You're in. See you at 7.")
              }}
              className="rx-btn rx-btn-acc"
            >
              I'm in
            </button>
          )}
        </article>

        {/* 6. Recommended by Karn Jajoo */}
        <article className="rx-card rx-card-lift animate-rise p-7">
          <p className="rx-eyebrow m-0 mb-4">Recommended by Karn Jajoo</p>
          <div className="flex items-start gap-4">
            <span className="h-[76px] w-[58px] flex-none rounded-[10px] bg-acc" />
            <div className="min-w-0">
              <h3 className="rx-title m-0 text-[22px] leading-[1.15]">
                The Lessons of History
                <br />
                <span className="text-[17px] font-semibold text-muted">Will &amp; Ariel Durant</span>
              </h3>
              <p className="m-0 mt-2 text-base leading-[1.5] text-muted">
                A brisk, big-picture look at what centuries of civilization can teach us about
                power, conflict, culture and human nature.
              </p>
            </div>
          </div>
          <button onClick={() => navigate('/community?tab=learn')} className="rx-link mt-[22px]">
            More recommendations →
          </button>
        </article>

        {/* 7. Story — Tanisha HYROX (spans 2) */}
        <article className="rx-card-dark col-span-2 animate-rise overflow-hidden p-0 transition-transform duration-[350ms] ease-[cubic-bezier(.2,.9,.3,1)] hover:-translate-y-1.5">
          <div className="grid [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
            <div className="relative grid min-h-[250px] place-items-center bg-[#1D1A16]">
              <img
                src="/photos/tanisha-hyrox.png"
                alt="Tanisha Singh at HYROX Bangkok"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="p-8">
              <p className="m-0 mb-[14px] text-[13px] font-bold tracking-[.14em] text-acc-soft uppercase">
                Story
              </p>
              <h3 className="rx-title m-0 text-[clamp(24px,2.6vw,32px)] leading-[1.06] font-bold tracking-[-.028em]">
                Tanisha just finished her first HYROX
              </h3>
              <p className="m-0 mt-[14px] mb-6 text-[16.5px] leading-[1.5] text-dim">
                8km of running broken up by 8 brutal workout stations, all back to back, all on a
                timer. That's not a small thing. That's extraordinary.
              </p>
              <div className="flex flex-wrap gap-[10px]">
                <button
                  onClick={() =>
                    tanisha
                      ? openRequest(tanisha, 'That HYROX story')
                      : say('Tanisha isn’t on the roster yet.')
                  }
                  className="rx-btn border-[1.5px] border-[#3B3833] bg-transparent text-white hover:border-white"
                >
                  Ask her anything
                </button>
              </div>
            </div>
          </div>
        </article>
      </section>
    </>
  )
}
