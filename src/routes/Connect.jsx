import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { currentRound, signUp } from '../api/meetups'
import { listUsers, searchTags } from '../api/people'
import Avatar from '../components/Avatar'
import { MatchRevealModal } from '../components/MatchReveal'
import { useOverlays } from '../components/Overlays'
import { ErrorNote, SkeletonCards } from '../components/States'
import { useToast } from '../components/Toast'
import { periodLabel, personMeta, shortDate } from '../lib/format'

/**
 * "Pick a Brain" — one page, four ways in.
 *
 * The design collapses the old tab bar into a 4-card grid: Blind Meetup, Slot a
 * Knowledge Session, Mentoring, Coaching. Picking a topic on the Knowledge card
 * reveals the people offering it in a strip below.
 */
export default function Connect() {
  const [searchParams, setSearchParams] = useSearchParams()
  const topic = searchParams.get('topic')

  const setTopic = (slug) =>
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      if (slug) next.set('topic', slug)
      else next.delete('topic')
      return next
    })

  return (
    <section className="animate-rise pt-11">
      <h1 className="rx-display m-0 mb-1.5 text-[clamp(32px,4.4vw,50px)]">Pick a Brain</h1>
      <p className="m-0 mb-6 max-w-[620px] text-[18px] text-muted">
        Four ways to borrow someone else's time at Radix.
      </p>

      <div className="grid items-stretch gap-5 [grid-template-columns:repeat(auto-fit,minmax(320px,1fr))]">
        <BlindMeetupCard />
        <KnowledgeSessionCard topic={topic} setTopic={setTopic} />
        <MentoringCard />
        <CoachingCard />
      </div>

      {topic && <TopicPeople topic={topic} />}
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*                              Blind Meetup card                             */
/* -------------------------------------------------------------------------- */

function BlindMeetupCard() {
  const say = useToast()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const revealed = searchParams.get('meetup') === 'revealed'

  const { data: round, error } = useQuery({
    queryKey: ['meetup-round', 'current'],
    queryFn: currentRound,
  })

  const join = useMutation({
    mutationFn: () => signUp(round.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetup-round'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      say("You're in. We'll pair you when sign-ups close.")
    },
    onError: (caught) => say(caught.message),
  })

  const pair = round?.my_pair
  const signedUp = Boolean(round?.my_signup) && round.my_signup.status !== 'withdrawn'
  const showReveal = revealed && pair?.partner

  const closeReveal = () =>
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      next.delete('meetup')
      return next
    })

  const openReveal = () =>
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      next.set('meetup', 'revealed')
      return next
    })

  return (
    <>
      {showReveal && <MatchRevealModal pair={pair} onClose={closeReveal} />}

      <article className="relative flex min-w-0 flex-col overflow-hidden rounded-card bg-acc p-7 text-on-acc">
        <div
          className="absolute top-[-60px] right-[-60px] h-[200px] w-[200px] rounded-full border-2 border-current opacity-[.28]"
          style={{ animation: 'floatC 14s ease-in-out infinite' }}
        />

        <div className="relative flex-1">
          <h2 className="rx-title m-0 text-[clamp(24px,2.5vw,32px)] font-extrabold">Blind Meetup</h2>
          <p className="rx-title m-0 mt-2 text-[19px] font-bold tracking-[-.015em]">
            20 minutes. One colleague. No agenda.
          </p>
          <p className="m-0 mt-2.5 text-[16.5px] leading-[1.45] opacity-[.88]">
            Every month, you get paired with someone from across teams. Simply get to know each
            other, no pressure!
          </p>

          {round?.signups_close_at && round.is_accepting_signups && (
            <p className="m-0 mt-[18px] rounded-[14px] bg-white/[.16] p-[14px_16px] text-[15.5px] font-bold">
              Sign up for this month closes on {shortDate(round.signups_close_at)}
            </p>
          )}
        </div>

        <div className="relative mt-[22px]">
          {error ? (
            <ErrorNote error={error} />
          ) : pair?.partner ? (
            <div className="flex animate-spring flex-wrap items-center gap-3 rounded-[18px] bg-inv p-[16px_18px] text-ink">
              <Avatar person={pair.partner} size={44} radius={13} />
              <div className="min-w-0">
                <p className="rx-eyebrow m-0">You're in for {periodLabel(round.period)}</p>
                <p className="rx-title m-0 mt-0.5 text-[19px]">Matched with {pair.partner.name}</p>
              </div>
              <button
                onClick={openReveal}
                className="rx-btn rx-btn-acc ml-auto min-h-[46px] rounded-[12px] px-4 text-[15px]"
              >
                See match
              </button>
            </div>
          ) : signedUp ? (
            <div className="rounded-[18px] bg-white/[.16] p-[16px 18px] text-[15.5px] font-bold">
              You're in for {periodLabel(round?.period)}. We'll pair you when sign-ups close.
            </div>
          ) : (
            <button
              onClick={() => round && join.mutate()}
              disabled={!round || join.isPending || !round.is_accepting_signups}
              className="rx-btn rx-btn-inv min-h-[50px] rounded-[14px] px-[22px] py-[14px] text-[16px]"
            >
              {join.isPending
                ? 'Signing up…'
                : round?.is_accepting_signups === false
                  ? 'Sign-ups closed'
                  : 'Count me in'}
            </button>
          )}
        </div>
      </article>
    </>
  )
}

/* -------------------------------------------------------------------------- */
/*                       Slot a Knowledge Session card                        */
/* -------------------------------------------------------------------------- */

function KnowledgeSessionCard({ topic, setTopic }) {
  const { data: topics } = useQuery({
    queryKey: ['tags', { type: 'skill', limit: 8 }],
    queryFn: () => searchTags({ type: 'skill', limit: 8 }),
  })

  const list = topics?.items ?? []

  return (
    <article className="flex min-w-0 flex-col rounded-card border border-line bg-cream p-7">
      <h2 className="rx-title m-0 text-[clamp(24px,2.5vw,32px)] font-extrabold">
        Slot a Knowledge Session
      </h2>
      <p className="m-0 mt-2.5 text-[16.5px] leading-[1.45] text-muted">
        Pick a topic. We'll show you who offered to talk about it. Thirty minutes, that's all.
      </p>

      <div className="mt-[18px] flex flex-wrap gap-[9px]">
        {list.map((tag) => {
          const on = topic === tag.slug
          return (
            <button
              key={tag.id}
              onClick={() => setTopic(on ? null : tag.slug)}
              className={
                on
                  ? 'rx-btn rx-btn-acc min-h-[46px] animate-pop rounded-[15px] px-[18px] text-[15.5px]'
                  : 'rx-btn min-h-[46px] rounded-[15px] border-[1.5px] border-edge-soft bg-white px-[18px] text-[15.5px] font-semibold text-ink hover:-translate-y-[3px] hover:border-acc hover:bg-tint'
              }
            >
              {tag.name}
            </button>
          )
        })}
        {list.length === 0 && (
          <p className="m-0 text-[15px] text-faint">Topics are loading…</p>
        )}
      </div>
    </article>
  )
}

/* -------------------------------------------------------------------------- */
/*                             Mentoring / Coaching                           */
/* -------------------------------------------------------------------------- */

/**
 * Both bottom cards work the same way: fetch mentors (people who opted in), then
 * show a slice as name chips. Mentoring gets the first slice, Coaching the next.
 * A single fetch feeds both.
 */
function useMentors() {
  return useQuery({
    queryKey: ['users', { open_to_mentoring: true, per_page: 20 }],
    queryFn: () => listUsers({ open_to_mentoring: true, per_page: 20 }),
  })
}

function MentoringCard() {
  const say = useToast()
  const { openProfile } = useOverlays()
  const { data } = useMentors()
  const people = (data?.items ?? []).slice(0, 8)

  return (
    <article className="flex min-w-0 flex-col rounded-card border border-edge bg-white p-7">
      <p className="rx-eyebrow m-0 mb-2.5">Mentoring</p>
      <h2 className="rx-title m-0 text-[clamp(24px,2.5vw,32px)] font-extrabold">
        Learn from someone who's been there, done that
      </h2>
      <p className="m-0 mt-2.5 flex-1 text-[16.5px] leading-[1.45] text-muted">
        Monthly conversations about your work, your decisions and where you want to go next. Matched
        on discipline, not org chart.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {people.map((person) => (
          <button
            key={person.id}
            onClick={() => openProfile(person.id)}
            className="min-h-[40px] cursor-pointer rounded-full border-[1.5px] border-edge-soft bg-cream px-[15px] py-[9px] text-[14.5px] font-semibold text-ink transition-transform duration-200 ease-[cubic-bezier(.2,1.4,.3,1)] hover:-translate-y-0.5 hover:border-ink"
          >
            {person.name}
          </button>
        ))}
      </div>

      <div className="mt-[18px]">
        <button
          onClick={() => say('Request sent. You will hear back within a week.')}
          className="rx-btn rx-btn-acc min-h-[50px] rounded-[14px] px-[22px] py-[14px] text-[16px]"
        >
          Ask for a mentor
        </button>
      </div>
    </article>
  )
}

function CoachingCard() {
  const say = useToast()
  const { openProfile } = useOverlays()
  const { data } = useMentors()
  const people = (data?.items ?? []).slice(8, 16)

  return (
    <article className="flex min-w-0 flex-col rounded-card border border-acc-soft bg-tint p-7">
      <p className="rx-eyebrow m-0 mb-2.5" style={{ color: 'var(--acc-ink)' }}>
        Coaching
      </p>
      <h2 className="rx-title m-0 text-[clamp(24px,2.5vw,32px)] font-extrabold">
        Work through something specific
      </h2>
      <p className="m-0 mt-2.5 flex-1 text-[16.5px] leading-[1.45] text-muted">
        A handful of focused sessions on one thing: leading a team, speaking up in rooms, managing
        your time. You set the goal.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {people.map((person) => (
          <button
            key={person.id}
            onClick={() => openProfile(person.id)}
            className="min-h-[40px] cursor-pointer rounded-full border-[1.5px] border-edge-strong bg-white px-[15px] py-[9px] text-[14.5px] font-semibold text-ink transition-transform duration-200 ease-[cubic-bezier(.2,1.4,.3,1)] hover:-translate-y-0.5 hover:border-ink"
          >
            {person.name}
          </button>
        ))}
      </div>

      <div className="mt-[18px]">
        <button
          onClick={() => say('Request sent. A coach will reach out to pick a slot.')}
          className="rx-btn rx-btn-ghost min-h-[50px] rounded-[14px] px-[22px] py-[14px] text-[16px]"
        >
          Set up coaching
        </button>
      </div>
    </article>
  )
}

/* -------------------------------------------------------------------------- */
/*                     People offering the selected topic                     */
/* -------------------------------------------------------------------------- */

function TopicPeople({ topic }) {
  const { openProfile, openRequest } = useOverlays()

  const { data: topicMeta } = useQuery({
    queryKey: ['tags', { type: 'skill', limit: 40 }],
    queryFn: () => searchTags({ type: 'skill', limit: 40 }),
  })

  const { data, isPending } = useQuery({
    queryKey: ['users', { tag: topic, kind: 'can_help_with', open_to_mentoring: true, per_page: 12 }],
    queryFn: () =>
      listUsers({ tag: topic, kind: 'can_help_with', open_to_mentoring: true, per_page: 12 }),
    enabled: Boolean(topic),
  })

  const topicName = useMemo(
    () => topicMeta?.items?.find((tag) => tag.slug === topic)?.name ?? topic,
    [topicMeta, topic],
  )

  const people = data?.items ?? []

  return (
    <div className="mt-[30px] animate-rise">
      <p className="m-0 mb-[18px] text-[16.5px] text-muted">
        <strong className="font-bold text-ink">{people.length}</strong>{' '}
        {people.length === 1 ? 'person has' : 'people have'} offered to talk about {topicName}
      </p>

      {isPending ? (
        <SkeletonCards count={3} height={220} />
      ) : people.length === 0 ? (
        <p className="text-[16.5px] text-muted">Nobody has offered this one yet. Try another topic.</p>
      ) : (
        <div className="grid gap-[18px] [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
          {people.map((person) => (
            <article
              key={person.id}
              className="min-w-0 animate-rise rounded-tile bg-cream p-6 transition-transform duration-300 ease-[cubic-bezier(.2,.9,.3,1)] hover:-translate-y-[5px]"
            >
              <div className="flex items-center gap-[14px]">
                <Avatar person={person} size={58} radius={17} />
                <div className="min-w-0">
                  <h3 className="rx-title m-0 text-[20.5px]">{person.name}</h3>
                  <p className="m-0 mt-[3px] text-[14.5px] text-muted">{personMeta(person)}</p>
                </div>
              </div>
              <p className="m-0 mt-[18px] mb-5 text-base leading-[1.5]">
                {person.intro ?? `Happy to talk about ${topicName}.`}
              </p>
              <div className="flex flex-wrap gap-[9px]">
                <button
                  onClick={() => openRequest(person, topicName)}
                  className="rx-btn rx-btn-acc rounded-[13px]"
                >
                  Request 30 mins
                </button>
                <button
                  onClick={() => openProfile(person.id)}
                  className="rx-btn rx-btn-ghost rounded-[13px]"
                >
                  Profile
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

