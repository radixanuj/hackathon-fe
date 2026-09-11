import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDashboard, getMeta } from '../api/meta'
import { listEvents, rsvp } from '../api/events'
import { listUsers, searchTags } from '../api/people'
import { getQuest } from '../api/quest'
import { currentRound, signUp } from '../api/meetups'
import { useAuth } from '../auth/AuthContext'
import Avatar, { AvatarStack } from '../components/Avatar'
import { useOverlays } from '../components/Overlays'
import SuggestionsStrip from '../components/SuggestionsStrip'
import { ErrorNote } from '../components/States'
import { useToast } from '../components/Toast'
import { avatarColor, eventEmoji, eventWhen, initials, periodLabel, personMeta, titleCase, todayLabel } from '../lib/format'

/** One line per interesting thing happening at Radix right now. */
function buildTicker(dashboard, people) {
  const lines = []
  for (const story of dashboard?.latest_stories ?? []) {
    if (story.user?.name) lines.push(`${story.user.name.split(' ')[0]} — ${story.title}`)
  }
  for (const event of dashboard?.upcoming_events ?? []) {
    lines.push(`${event.going_count} ${event.going_count === 1 ? 'person is' : 'people are'} in for ${event.title}`)
  }
  for (const ama of dashboard?.open_amas ?? []) {
    if (ama.host?.name) lines.push(`${ama.host.name.split(' ')[0]} is open for questions — ${ama.title}`)
  }
  for (const person of people ?? []) {
    if (person.intro) lines.push(`${person.name.split(' ')[0]}: ${person.intro.split('.')[0]}`)
  }
  return lines.length ? lines.slice(0, 10) : ['Ninety-eight people, four continents.']
}

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const say = useToast()
  const queryClient = useQueryClient()
  const { openProfile, openRequest } = useOverlays()

  const { data: dashboard, isPending, error } = useQuery({ queryKey: ['dashboard'], queryFn: getDashboard })
  const { data: meta } = useQuery({ queryKey: ['meta'], queryFn: getMeta })
  const { data: quest } = useQuery({ queryKey: ['quest'], queryFn: getQuest })
  const { data: directory } = useQuery({
    queryKey: ['users', { per_page: 24 }],
    queryFn: () => listUsers({ per_page: 24 }),
  })
  const { data: skillTags } = useQuery({
    queryKey: ['tags', { type: 'skill', limit: 6 }],
    queryFn: () => searchTags({ type: 'skill', limit: 6 }),
  })

  // /dashboard reports the round and the upcoming events, but without the
  // viewer's own signup or RSVP on them — so those two come from the endpoints
  // that do attach viewer state, and the dashboard supplies the rest.
  const { data: round } = useQuery({ queryKey: ['meetup-round', 'current'], queryFn: currentRound })
  const { data: upcoming } = useQuery({
    queryKey: ['events', { scope: 'upcoming', per_page: 5 }],
    queryFn: () => listEvents({ scope: 'upcoming', per_page: 5 }),
  })

  const [rolled, setRolled] = useState(null)
  const [rolling, setRolling] = useState(false)

  const people = useMemo(() => directory?.items ?? [], [directory])
  const ticker = useMemo(() => buildTicker(dashboard, people), [dashboard, people])
  const heroFaces = people.slice(0, 4)

  const nextEvent = upcoming?.items?.[0]
  const signedUp = Boolean(round?.my_signup) && round.my_signup.status !== 'withdrawn'
  const recommendation = dashboard?.latest_recommendations?.[0]
  const story = dashboard?.latest_stories?.[0]
  const suggestion = quest?.targets?.find((target) => target.status === 'pending')

  const buddy = dashboard?.buddy
  const questions = dashboard?.questions_i_could_answer ?? []
  const coffees = dashboard?.open_coffee_invites ?? []
  const challenges = dashboard?.active_challenges ?? []
  const teachOffers = dashboard?.teach_offers_seeking_interest ?? []
  const openInvites = dashboard?.open_invites ?? []

  const joinMeetup = useMutation({
    mutationFn: () => signUp(round.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['meetup-round'] })
      navigate('/connect')
    },
    onError: (caught) => say(caught.message),
  })

  const joinEvent = useMutation({
    mutationFn: () => rsvp(nextEvent.id, 'going'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
      say("You're in. The host has been told.")
    },
    onError: (caught) => say(caught.message),
  })

  function roll() {
    if (!people.length) return
    setRolling(true)
    setTimeout(() => {
      const pool = people.filter((person) => person.id !== rolled?.id && person.id !== user?.id)
      setRolled(pool[Math.floor(Math.random() * pool.length)] ?? null)
      setRolling(false)
    }, 1150)
  }

  const totalPeople = directory?.meta?.total ?? people.length
  const locationCount = meta?.locations?.length ?? 0
  const metCount = quest?.met_count ?? 0

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
              Hey {user?.name?.split(' ')[0]} 👋
              <br />
              Who will you
              <br />
              discover today?
            </h1>
            <p className="m-0 mt-5 mb-[30px] max-w-[440px] text-[18.5px] leading-[1.5] text-muted">
              {totalPeople > 0
                ? `There are ${totalPeople} people at Radix across ${locationCount} locations.`
                : 'Radix is a big place.'}{' '}
              {metCount > 0 ? `You've properly met ${metCount} of them.` : 'Time to meet a few.'}
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => navigate('/connect')} className="rx-btn rx-btn-acc rx-btn-lg hover:-translate-y-[3px] hover:shadow-[0_14px_30px_rgb(20_18_15/0.18)]">
                Meet someone
              </button>
              <button onClick={() => navigate('/people')} className="rx-btn rx-btn-ghost rx-btn-lg">
                Explore Radix
              </button>
            </div>
          </div>

          {/* Floating faces — real colleagues, gently drifting. */}
          <div className="relative min-h-[330px] animate-rise">
            {heroFaces.map((person, index) => {
              const layout = [
                { left: '6%', top: '14%', w: 132, h: 158, anim: 'floatA 8s ease-in-out infinite' },
                { left: '36%', top: 0, w: 126, h: 150, anim: 'floatB 10s ease-in-out infinite' },
                { right: '4%', top: '20%', w: 120, h: 144, anim: 'floatA 11s .6s ease-in-out infinite' },
                { left: '22%', bottom: '2%', w: 118, h: 140, anim: 'floatB 9s .3s ease-in-out infinite' },
              ][index]
              return (
                <button
                  key={person.id}
                  onClick={() => openProfile(person.id)}
                  title={person.name}
                  className="absolute grid cursor-pointer place-items-center border-none font-display font-extrabold shadow-[0_16px_36px_rgb(20_18_15/0.10)]"
                  style={{
                    ...layout,
                    width: layout.w,
                    height: layout.h,
                    borderRadius: 22,
                    fontSize: 34,
                    background: index === 1 ? 'var(--acc)' : avatarColor(person.name),
                    color: index === 1 ? 'var(--on-acc)' : '#14120F',
                    animation: layout.anim,
                  }}
                >
                  {initials(person.name)}
                </button>
              )
            })}
            <div className="absolute right-[16%] bottom-[6%] h-16 w-16 rounded-full bg-acc-soft" style={{ animation: 'floatC 7s ease-in-out infinite' }} />
          </div>
        </div>
      </section>

      {/* --- Ticker -------------------------------------------------------- */}
      <div
        className="relative mt-[30px] overflow-hidden border-y border-line py-[14px]"
        style={{ maskImage: 'linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)' }}
      >
        <div className="flex w-max" style={{ animation: 'marquee 38s linear infinite' }}>
          {[...ticker, ...ticker].map((line, index) => (
            <span key={index} className="flex items-center gap-3 pr-[26px] text-[16.5px] font-semibold whitespace-nowrap text-muted">
              <span className="h-[7px] w-[7px] flex-none rounded-full bg-acc" />
              {line}
            </span>
          ))}
        </div>
      </div>

      <SuggestionsStrip limit={3} />

      {/* --- Card grid ----------------------------------------------------- */}
      <section className="mt-8 grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
        {/* Blind Meetup */}
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
                  Meet someone at Radix you probably wouldn't otherwise talk to. One hour, no agenda.
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

        {/* You two should probably meet */}
        {suggestion?.person && (
          <article className="rx-card rx-card-lift animate-rise p-7 hover:rotate-[-.5deg]">
            <p className="rx-eyebrow m-0 mb-[18px]">You two should probably meet</p>
            <div className="flex items-center gap-4">
              <Avatar person={suggestion.person} size={72} radius={20} />
              <div className="min-w-0">
                <h3 className="rx-title m-0 text-[25px] font-bold">{suggestion.person.name}</h3>
                <p className="m-0 mt-1 text-[15.5px] text-muted">{personMeta(suggestion.person)}</p>
              </div>
            </div>
            <p className="m-0 mt-5 mb-[22px] text-[17px] leading-[1.5]">{suggestion.reason}</p>
            <button onClick={() => openProfile(suggestion.person.id)} className="rx-btn rx-btn-ghost">
              View profile
            </button>
          </article>
        )}

        {/* Pot luck */}
        <article className="relative flex min-h-[280px] min-w-0 animate-rise flex-col justify-between overflow-hidden rounded-card border-[1.5px] border-dashed border-acc-soft bg-cream p-7">
          <span className="absolute top-[18px] right-[-6px] rotate-[7deg] rounded-lg bg-acc px-[13px] py-[7px] text-[12.5px] font-extrabold tracking-[.1em] text-on-acc uppercase">
            Pot luck
          </span>
          <div className="relative grid min-h-[118px] place-items-center">
            {rolling ? (
              <span className="relative block h-[110px] w-[120px]">
                <span className="absolute top-[6px] left-0 h-[78px] w-[62px] rounded-2xl bg-[#EFE6D8]" style={{ animation: 'shuffleA .5s ease-in-out infinite' }} />
                <span className="absolute top-0 left-7 h-[78px] w-[62px] rounded-2xl bg-acc" style={{ animation: 'shuffleB .55s ease-in-out infinite' }} />
                <span className="absolute top-[10px] left-14 h-[78px] w-[62px] rounded-2xl bg-[#E3E7DF]" style={{ animation: 'shuffleC .45s ease-in-out infinite' }} />
              </span>
            ) : rolled ? (
              <span className="flex animate-tada items-center gap-[14px]">
                <Avatar person={rolled} size={70} radius={20} />
                <span className="min-w-0">
                  <span className="block font-display text-[22px] font-bold tracking-[-.02em]">{rolled.name}</span>
                  <span className="mt-[3px] block text-[15px] text-muted">{personMeta(rolled)}</span>
                </span>
              </span>
            ) : (
              <span className="cursor-pointer text-[60px] leading-none">🎲</span>
            )}
          </div>
          <div>
            <h3 className="rx-title m-0 mb-1.5 text-[23px]">
              {rolling ? 'Shuffling Radix…' : rolled ? 'Say hello?' : 'Roll the dice'}
            </h3>
            <p className="m-0 mb-[18px] text-base leading-[1.45] text-muted">
              {rolling
                ? `${totalPeople} people, ${locationCount} locations.`
                : rolled
                  ? (rolled.intro?.split('.')[0] ?? personMeta(rolled)) + '.'
                  : "No algorithm, no reason. One random colleague you've never spoken to."}
            </p>
            <div className="flex flex-wrap gap-[9px]">
              <button onClick={roll} disabled={rolling} className="rx-btn rx-btn-acc hover:rotate-[-2deg]">
                {rolling ? 'Shuffling…' : rolled ? 'Roll again' : 'Surprise me'}
              </button>
              {rolled && (
                <button onClick={() => openProfile(rolled.id)} className="rx-btn rx-btn-ghost">
                  View profile
                </button>
              )}
            </div>
          </div>
        </article>

        {/* Want to learn something? */}
        <article className="rx-card-soft animate-rise p-7 transition-transform duration-[350ms] ease-[cubic-bezier(.2,.9,.3,1)] hover:-translate-y-1.5">
          <h3 className="rx-title m-0 text-[25px]">Want to learn something?</h3>
          <p className="m-0 mt-2 mb-5 text-base text-muted">People here have offered to talk about:</p>
          <div className="flex flex-wrap gap-[9px]">
            {(skillTags?.items ?? []).map((tag) => (
              <button
                key={tag.id}
                onClick={() => navigate(`/connect?tab=mentoring&topic=${encodeURIComponent(tag.slug)}`)}
                className="cursor-pointer rounded-full border-[1.5px] border-edge-soft bg-white px-[17px] py-[11px] text-[15px] font-semibold transition-all duration-200 ease-[cubic-bezier(.2,1.4,.3,1)] hover:-translate-y-[3px] hover:rotate-[-1.5deg] hover:border-acc hover:bg-acc hover:text-on-acc"
              >
                {tag.name}
              </button>
            ))}
          </div>
        </article>

        {/* Next event */}
        {nextEvent && (
          <article className="rx-card rx-card-lift animate-rise p-7">
            <p className="rx-eyebrow m-0 mb-4">Coming up</p>
            <h3 className="rx-title m-0 text-[26px]">{nextEvent.title}</h3>
            <p className="m-0 mt-2 text-[15.5px] text-muted">{eventWhen(nextEvent)}</p>
            <div className="my-5 flex items-center gap-3">
              <AvatarStack people={[nextEvent.host].filter(Boolean)} size={38} />
              <span className="text-[15.5px] text-muted">{nextEvent.going_count} joining</span>
            </div>
            {nextEvent.my_rsvp === 'going' ? (
              <div className="flex animate-pop items-center gap-[10px] rounded-[14px] bg-tint px-[18px] py-[13px] text-[15.5px] font-bold text-acc-ink">
                <span className="grid h-[22px] w-[22px] place-items-center rounded-full bg-acc text-[13px] text-on-acc">✓</span>
                You're in
              </div>
            ) : (
              <button onClick={() => joinEvent.mutate()} disabled={joinEvent.isPending} className="rx-btn rx-btn-acc">
                {joinEvent.isPending ? 'Joining…' : "I'm in"}
              </button>
            )}
          </article>
        )}

        {/* Recommendation */}
        {recommendation && (
          <article className="rx-card rx-card-lift animate-rise p-7">
            <p className="rx-eyebrow m-0 mb-4">
              Recommended by {recommendation.user?.name?.split(' ')[0] ?? 'someone here'}
            </p>
            <div className="flex items-start gap-4">
              <span className="h-[76px] w-[58px] flex-none rounded-[10px] bg-acc" />
              <div className="min-w-0">
                <h3 className="rx-title m-0 text-[22px] leading-[1.15]">{recommendation.title}</h3>
                <p className="m-0 mt-2 text-base leading-[1.5] text-muted">{recommendation.why}</p>
              </div>
            </div>
            <button onClick={() => navigate('/community?tab=learn')} className="rx-link mt-[22px]">
              More recommendations →
            </button>
          </article>
        )}

        {/* Story */}
        {story && (
          <article className="rx-card-dark col-span-2 animate-rise overflow-hidden p-0 transition-transform duration-[350ms] ease-[cubic-bezier(.2,.9,.3,1)] hover:-translate-y-1.5">
            <div className="grid [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
              <div className="relative grid min-h-[250px] place-items-center bg-[#1D1A16]">
                {story.media_url ? (
                  <img src={story.media_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Avatar person={story.user} size={110} radius={30} />
                )}
              </div>
              <div className="p-8">
                <p className="m-0 mb-[14px] text-[13px] font-bold tracking-[.14em] text-acc-soft uppercase">Story</p>
                <h3 className="rx-title m-0 text-[clamp(24px,2.6vw,32px)] leading-[1.06] font-bold tracking-[-.028em]">
                  {story.title}
                </h3>
                <p className="m-0 mt-[14px] mb-6 text-[16.5px] leading-[1.5] text-dim">{story.body}</p>
                <div className="flex flex-wrap gap-[10px]">
                  <button onClick={() => navigate('/community?tab=stories')} className="rx-btn rx-btn-acc">
                    Read story
                  </button>
                  {story.user && (
                    <button
                      onClick={() => openRequest(story.user, story.title)}
                      className="rx-btn border-[1.5px] border-[#3B3833] bg-transparent text-white hover:border-white"
                    >
                      Ask about it
                    </button>
                  )}
                </div>
              </div>
            </div>
          </article>
        )}
      </section>

      {/* --- Easier ways in (Phase 2) --------------------------------------- */}
      {(buddy || questions.length > 0 || coffees.length > 0 || challenges.length > 0 ||
        teachOffers.length > 0 || openInvites.length > 0) && (
        <section className="mt-16">
          <h2 className="rx-display m-0 mb-1.5 text-[clamp(28px,3.6vw,42px)] tracking-[-.032em]">
            Easier ways in
          </h2>
          <p className="m-0 mb-[26px] max-w-[560px] text-[18px] text-muted">
            Smaller doors than a meeting invite.
          </p>

          <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
            {/* Cross-location buddy */}
            <article className="rx-card rx-card-lift animate-rise p-7">
              <p className="rx-eyebrow m-0 mb-4">Cross-location buddy</p>
              {buddy?.buddy ? (
                <>
                  <div className="flex items-center gap-4">
                    <Avatar person={buddy.buddy} size={56} radius={16} />
                    <div className="min-w-0">
                      <h3 className="rx-title m-0 text-[22px]">{buddy.buddy.name}</h3>
                      <p className="m-0 mt-1 text-[15px] text-muted">{personMeta(buddy.buddy)}</p>
                    </div>
                  </div>
                  {buddy.match_reason && (
                    <p className="m-0 mt-4 text-[16px] leading-[1.5] text-muted">{buddy.match_reason}</p>
                  )}
                  <button onClick={() => openProfile(buddy.buddy.id)} className="rx-btn rx-btn-ghost mt-5">
                    View profile
                  </button>
                </>
              ) : (
                <>
                  <h3 className="rx-title m-0 text-[23px]">Someone in another office</h3>
                  <p className="m-0 mt-2 mb-5 text-base leading-[1.45] text-muted">
                    An ongoing pairing with a colleague you'd never otherwise cross. Different
                    location, guaranteed.
                  </p>
                  <button onClick={() => navigate('/connect?tab=buddy')} className="rx-btn rx-btn-acc">
                    Find me a buddy
                  </button>
                </>
              )}
            </article>

            {/* Ask Radix — routed to you by your own tags */}
            {questions.length > 0 && (
              <article className="rx-card-dark animate-rise p-7 transition-transform duration-[350ms] ease-[cubic-bezier(.2,.9,.3,1)] hover:-translate-y-1.5">
                <p className="m-0 mb-[14px] text-[12.5px] font-bold tracking-[.14em] text-acc-soft uppercase">
                  You could answer this
                </p>
                <h3 className="rx-title m-0 text-[24px] font-bold">{questions[0].title}</h3>
                <p className="m-0 mt-3 mb-5 text-[15.5px] text-dim">
                  Asked by {questions[0].user?.name ?? 'someone here'}
                  {questions.length > 1 && ` · ${questions.length - 1} more for you`}
                </p>
                <button onClick={() => navigate('/community?tab=ask-teach')} className="rx-btn rx-btn-acc">
                  Take a look
                </button>
              </article>
            )}

            {/* Coffee / lunch / walk */}
            {coffees.length > 0 && (
              <article className="rx-card rx-card-lift animate-rise p-7">
                <p className="rx-eyebrow m-0 mb-4">Free seat</p>
                <h3 className="rx-title m-0 text-[23px]">
                  {titleCase(coffees[0].kind)} with {coffees[0].host?.name?.split(' ')[0] ?? 'someone'}
                </h3>
                <p className="m-0 mt-2 text-[15.5px] text-muted">{eventWhen(coffees[0])}</p>
                {coffees[0].note && (
                  <p className="m-0 mt-3 text-base leading-[1.45] text-muted">{coffees[0].note}</p>
                )}
                <button onClick={() => navigate('/connect?tab=coffee')} className="rx-btn rx-btn-acc mt-5">
                  {coffees[0].seats_left} {coffees[0].seats_left === 1 ? 'seat' : 'seats'} left
                </button>
              </article>
            )}

            {/* Challenges */}
            {challenges.length > 0 && (
              <article className="rx-card-soft animate-rise p-7 transition-transform duration-[350ms] ease-[cubic-bezier(.2,.9,.3,1)] hover:-translate-y-1.5">
                <p className="rx-eyebrow m-0 mb-4">Running now</p>
                <h3 className="rx-title m-0 text-[23px]">{challenges[0].title}</h3>
                <p className="m-0 mt-2 mb-5 text-base text-muted">
                  {challenges[0].participants_count} counting {challenges[0].unit}
                  {challenges[0].days_left !== null && ` · ${challenges[0].days_left} days left`}
                </p>
                <button onClick={() => navigate('/community?tab=challenges')} className="rx-btn rx-btn-acc">
                  Join in
                </button>
              </article>
            )}

            {/* Teach Radix */}
            {teachOffers.length > 0 && (
              <article className="rx-card rx-card-lift animate-rise p-7">
                <p className="rx-eyebrow m-0 mb-4">Someone offered to teach</p>
                <h3 className="rx-title m-0 text-[23px]">{teachOffers[0].title}</h3>
                <p className="m-0 mt-2 mb-5 text-base text-muted">
                  {teachOffers[0].user?.name} · {teachOffers[0].interested_count} of{' '}
                  {teachOffers[0].min_interested} interested
                </p>
                <button onClick={() => navigate('/community?tab=ask-teach')} className="rx-btn rx-btn-acc">
                  I'd come to this
                </button>
              </article>
            )}

            {/* Open invites */}
            {openInvites.length > 0 && (
              <article className="rx-card rx-card-lift animate-rise p-7">
                <p className="rx-eyebrow m-0 mb-4">Anyone interested?</p>
                <span className="text-[34px] leading-none">{eventEmoji(openInvites[0].category)}</span>
                <h3 className="rx-title m-0 mt-3 text-[23px]">{openInvites[0].title}</h3>
                <p className="m-0 mt-2 mb-5 text-base text-muted">
                  {openInvites[0].interested_count} in so far
                  {openInvites[0].rough_timing && ` · ${openInvites[0].rough_timing}`}
                </p>
                <button onClick={() => navigate('/community?tab=events')} className="rx-btn rx-btn-acc">
                  Count me in too
                </button>
              </article>
            )}
          </div>
        </section>
      )}

      {isPending && <p className="pt-10 text-[16.5px] text-muted">Loading your Radix…</p>}
    </>
  )
}
