import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { currentRound, signUp } from '../api/meetups'
import { listUsers, searchTags } from '../api/people'
import Avatar, { AvatarStack } from '../components/Avatar'
import { MatchRevealModal } from '../components/MatchReveal'
import { useOverlays } from '../components/Overlays'
import SessionsPanel from '../components/SessionsPanel'
import { ErrorNote, SkeletonCards } from '../components/States'
import { useToast } from '../components/Toast'
import { periodLabel, personMeta, shortDate } from '../lib/format'

/**
 * "Pick a Brain" — four ways in, one at a time.
 *
 * The canvas gives each way its own tab and a full-width panel: a promise up
 * top, three numbered steps explaining how it actually works, then the thing
 * you came to do. Mentoring, Coaching and Knowledge Session all end at the same
 * place — a person, a topic and a proposed time, sent as a session request.
 */

const TABS = [
  { key: 'meetup', label: 'Blind Meetup' },
  { key: 'knowledge', label: 'Knowledge Session' },
  { key: 'mentoring', label: 'Mentoring' },
  { key: 'coaching', label: 'Coaching' },
]

export default function Connect() {
  const [searchParams, setSearchParams] = useSearchParams()
  const topic = searchParams.get('topic')
  const requested = searchParams.get('tab')

  // A topic in the URL is always a knowledge-session question, so it wins over
  // whatever tab the link happened to ask for.
  const active = topic ? 'knowledge' : (TABS.find((tab) => tab.key === requested)?.key ?? 'meetup')

  const setTab = (key) =>
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      next.set('tab', key)
      // The topic belongs to the knowledge tab; carrying it elsewhere would
      // bounce you straight back here.
      if (key !== 'knowledge') next.delete('topic')
      return next
    })

  const setTopic = (slug) =>
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      next.set('tab', 'knowledge')
      if (slug) next.set('topic', slug)
      else next.delete('topic')
      return next
    })

  // `mentors` is the curated roster — a named handful who agreed to a standing
  // commitment — not the wide `open_to_mentoring` pool that Knowledge Sessions
  // and Coaching run on. The API rejects a mentoring request sent outside it.
  const { data: mentors } = useQuery({
    queryKey: ['users', { mentors: true, per_page: 100 }],
    queryFn: () => listUsers({ mentors: true, per_page: 100 }),
    enabled: active === 'mentoring' || active === 'coaching',
  })
  const { data: coaches } = useQuery({
    queryKey: ['users', { open_to_mentoring: true, tenure_band: 'senior', per_page: 100 }],
    queryFn: () => listUsers({ open_to_mentoring: true, tenure_band: 'senior', per_page: 100 }),
    enabled: active === 'coaching',
  })

  // The same person can do both, but one name on both lists reads as a bug, so
  // coaching draws from the seniors the mentoring list didn't use.
  const { mentorChips, coachChips } = useMemo(() => {
    const chips = (mentors?.items ?? []).slice(0, 8)
    const shown = new Set(chips.map((person) => person.id))
    return {
      mentorChips: chips,
      coachChips: (coaches?.items ?? []).filter((person) => !shown.has(person.id)).slice(0, 8),
    }
  }, [mentors, coaches])

  return (
    <section className="animate-rise pt-11">
      <h1 className="rx-display m-0 mb-3.5 text-[clamp(34px,5vw,64px)]">Pick a Brain</h1>
      <p className="m-0 mb-[30px] max-w-[640px] text-[20px] leading-[1.5] text-muted">
        Get matched with someone new or ask a colleague for mentoring, coaching, advice or a quick knowledge session.
      </p>

      <div className="mb-7 flex flex-wrap gap-7 border-b border-line">
        {TABS.map((tab) => {
          const on = tab.key === active
          return (
            <button
              key={tab.key}
              onClick={() => setTab(tab.key)}
              aria-current={on ? 'page' : undefined}
              className={
                on
                  ? 'relative cursor-pointer border-none bg-transparent p-0 pb-3.5 text-[20px] font-bold text-ink'
                  : 'cursor-pointer border-none bg-transparent p-0 pb-3.5 text-[20px] font-semibold text-faint transition-colors duration-200 hover:text-ink'
              }
            >
              {tab.label}
              {on && (
                <span className="absolute right-0 -bottom-px left-0 h-[3px] rounded-[3px] bg-acc" />
              )}
            </button>
          )
        })}
      </div>

      {active === 'meetup' && <MeetupPanel />}
      {active === 'knowledge' && <KnowledgePanel topic={topic} setTopic={setTopic} />}
      {active === 'mentoring' && <MentoringPanel people={mentorChips} />}
      {active === 'coaching' && <CoachingPanel people={coachChips} />}

      <SessionsPanel />
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*                              Shared panel parts                            */
/* -------------------------------------------------------------------------- */

/** The tinted full-width slab every tab sits in. */
function Panel({ children, className = '' }) {
  return (
    <div
      className={`animate-rise rounded-[28px] border border-acc-soft bg-tint p-[clamp(28px,3.4vw,44px)] ${className}`}
    >
      {children}
    </div>
  )
}

function PanelHead({ eyebrow, title, children }) {
  return (
    <div className="relative max-w-[680px]">
      <p className="m-0 mb-3.5 text-[14px] leading-[1.2] font-bold tracking-[.16em] text-acc-ink uppercase">
        {eyebrow}
      </p>
      <h2 className="rx-display m-0 text-[clamp(26px,3vw,38px)] leading-[1.04] tracking-[-.032em]">
        {title}
      </h2>
      <p className="m-0 mt-4 text-[20px] leading-[1.5] text-muted">{children}</p>
    </div>
  )
}

/** The three numbered "how this actually works" cards. */
function Steps({ items }) {
  return (
    <div className="relative mt-[30px] grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
      {items.map((step, index) => (
        <div
          key={step.title}
          className="min-w-0 rounded-[20px] border border-edge-soft bg-white p-6"
        >
          <span className="rx-display grid h-[38px] w-[38px] place-items-center rounded-full bg-tint text-[17px] text-ink">
            {index + 1}
          </span>
          <p className="rx-title m-0 mt-4 mb-1.5 text-[20px]">{step.title}</p>
          <p className="m-0 text-[17px] leading-[1.45] text-muted">{step.body}</p>
        </div>
      ))}
    </div>
  )
}

function SectionLabel({ children }) {
  return <p className="rx-title relative m-0 mt-[30px] mb-3.5 text-[20px]">{children}</p>
}

/** A row of people you can ask straight away. */
function NameChips({ people, onPick }) {
  return (
    <div className="relative flex flex-wrap gap-2.5">
      {people.map((person) => (
        <button
          key={person.id}
          onClick={() => onPick(person)}
          title={`Ask ${person.name.split(' ')[0]} for time`}
          className="min-h-[48px] cursor-pointer rounded-full border-[1.5px] border-edge-strong bg-white px-[18px] py-3 text-[18px] font-semibold text-ink transition-[transform,border-color] duration-200 ease-[cubic-bezier(.2,1.4,.3,1)] hover:-translate-y-0.5 hover:border-ink"
        >
          {person.name}
        </button>
      ))}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                Blind Meetup                                */
/* -------------------------------------------------------------------------- */

const MEETUP_STEPS = [
  {
    title: 'Say you are in',
    body: 'One click. Sign-ups for this round close before the pairing runs.',
  },
  {
    title: 'We pair you up',
    body: 'Across teams and geos, one person with 6+ years and one with fewer.',
  },
  { title: 'Find 20 minutes', body: 'A coffee, a walk, a call. Anything except a status update.' },
]

function MeetupPanel() {
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
  // Four faces, then the canvas's "+N" disc for everyone the row can't show.
  const faces = (round?.recent_signups ?? []).slice(0, 4)
  const overflow = (round?.signups_count ?? 0) - faces.length

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

  const steps = round?.signups_close_at
    ? [
        {
          ...MEETUP_STEPS[0],
          body: `One click. Sign-ups for this round close on ${shortDate(round.signups_close_at)}.`,
        },
        MEETUP_STEPS[1],
        MEETUP_STEPS[2],
      ]
    : MEETUP_STEPS

  return (
    <>
      {showReveal && <MatchRevealModal pair={pair} onClose={closeReveal} />}

      <Panel className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute top-[-80px] right-[-70px] h-[260px] w-[260px] rounded-full border-2 border-acc-soft opacity-70"
          style={{ animation: 'floatC 14s ease-in-out infinite' }}
        />

        <PanelHead eyebrow="Once a month" title="20 minutes. One colleague. No agenda.">
          Every month, you get paired with someone from across teams. Simply get to know each other,
          no pressure!
        </PanelHead>

        <Steps items={steps} />

        <div className="relative mt-[30px] flex flex-wrap items-center justify-between gap-[22px] border-t border-acc-soft pt-[26px]">
          <div className="flex flex-wrap items-center gap-3">
            {faces.length > 0 && (
              <div className="flex items-center">
                <AvatarStack people={faces} size={44} />
                {overflow > 0 && (
                  <span className="-ml-[9px] grid h-11 w-11 place-items-center rounded-full border-[2.5px] border-white bg-white text-[15px] font-bold text-ink">
                    +{overflow}
                  </span>
                )}
              </div>
            )}
            {round?.signups_count > 0 && (
              <span className="text-[18px] font-semibold text-muted">
                {round.signups_count} already in for {periodLabel(round.period)}
              </span>
            )}
          </div>

          <div>
            {error ? (
              <ErrorNote error={error} />
            ) : pair?.partner ? (
              <div className="flex animate-spring flex-wrap items-center gap-3.5 rounded-[18px] border border-acc-soft bg-white p-[16px_20px] text-ink">
                <Avatar person={pair.partner} size={46} radius={14} />
                <div className="min-w-0">
                  <p className="m-0 text-[14px] font-bold tracking-[.1em] text-muted uppercase">
                    You're in for {periodLabel(round.period)}
                  </p>
                  <p className="rx-title m-0 mt-0.5 text-[20px]">Matched with {pair.partner.name}</p>
                </div>
                <button
                  onClick={openReveal}
                  className="rx-btn rx-btn-acc min-h-[48px] rounded-[13px] px-[18px] text-[17px]"
                >
                  See match
                </button>
              </div>
            ) : signedUp ? (
              <div className="rounded-[18px] border border-acc-soft bg-white p-[16px_20px] text-[17px] font-bold">
                You're in for {periodLabel(round?.period)}. We'll pair you when sign-ups close.
              </div>
            ) : (
              <button
                onClick={() => round && join.mutate()}
                disabled={!round || join.isPending || !round.is_accepting_signups}
                className="rx-btn rx-btn-dark min-h-[54px] rounded-[15px] px-7 py-4 text-[19px]"
              >
                {join.isPending
                  ? 'Signing up…'
                  : round?.is_accepting_signups === false
                    ? 'Sign-ups closed'
                    : 'Count me in'}
              </button>
            )}
          </div>
        </div>
      </Panel>
    </>
  )
}

/* -------------------------------------------------------------------------- */
/*                             Knowledge Session                              */
/* -------------------------------------------------------------------------- */

const KNOWLEDGE_STEPS = [
  { title: 'Pick a topic', body: 'Everything below was offered up by someone who works here.' },
  {
    title: 'Send a request',
    body: 'They get a note with your question and pick a slot that works.',
  },
  {
    title: 'Show up curious',
    body: 'No prep needed. Bring the thing you have been meaning to ask.',
  },
]

function KnowledgePanel({ topic, setTopic }) {
  // The curated row, in the order it was curated — `featured` carries its own
  // running order, where the default tag list sorts by how often a skill turns up.
  const { data: topics } = useQuery({
    queryKey: ['tags', { type: 'skill', featured: true }],
    queryFn: () => searchTags({ type: 'skill', featured: true }),
  })

  const list = topics?.items ?? []

  return (
    <>
      <Panel>
        <PanelHead eyebrow="Thirty minutes" title="Slot a Knowledge Session">
          Pick a topic. We'll show you who offered to talk about it. Thirty minutes, that's all.
        </PanelHead>

        <Steps items={KNOWLEDGE_STEPS} />

        <SectionLabel>What would you like to learn?</SectionLabel>

        <div className="relative flex flex-wrap gap-2.5">
          {list.map((tag) => {
            const on = topic === tag.slug
            return (
              <button
                key={tag.id}
                onClick={() => setTopic(on ? null : tag.slug)}
                className={
                  on
                    ? 'rx-btn rx-btn-acc min-h-[50px] animate-pop rounded-[15px] px-5 py-[13px] text-[18px]'
                    : 'rx-btn min-h-[50px] rounded-[15px] border-[1.5px] border-edge-soft bg-white px-5 py-[13px] text-[18px] font-semibold text-ink hover:-translate-y-[3px] hover:border-acc'
                }
              >
                {tag.name}
              </button>
            )
          })}
          {list.length === 0 && <p className="m-0 text-[16px] text-faint">Topics are loading…</p>}
        </div>
      </Panel>

      {topic && <TopicPeople topic={topic} />}
    </>
  )
}

/* -------------------------------------------------------------------------- */
/*                            Mentoring / Coaching                            */
/* -------------------------------------------------------------------------- */

const MENTORING_STEPS = [
  {
    title: 'Tell us the craft',
    body: 'Product, data, design, marketing, engineering, people leadership.',
  },
  {
    title: 'Meet your mentor',
    body: 'Someone a few steps ahead of you, outside your reporting line.',
  },
  { title: 'Once a month', body: 'An hour a month for six months. You set the agenda each time.' },
]

const COACHING_STEPS = [
  { title: 'Name the goal', body: 'One thing you want to be better at by the end of the quarter.' },
  { title: 'Pick your coach', body: 'Someone who has done this work and is offering to help.' },
  {
    title: 'Do the reps',
    body: 'Short sessions, homework between them, an honest check at the end.',
  },
]

function MentoringPanel({ people }) {
  const { openRequest, openPeople } = useOverlays()

  const browse = () =>
    openPeople({
      kind: 'mentoring',
      title: 'Radix mentors',
      intent:
        'Everyone on the mentoring roster. Pick whoever fits, then propose a time that suits you.',
      topic: 'Career direction',
      filters: { mentors: true },
    })

  return (
    <Panel>
      <PanelHead eyebrow="Sixty Minutes" title="Learn from someone who's been there, done that">
        Monthly conversations about your work, your decisions and where you want to go next. Matched
        on discipline, not org chart.
      </PanelHead>

      <Steps items={MENTORING_STEPS} />

      <SectionLabel>People offering to mentor</SectionLabel>

      <NameChips
        people={people}
        onPick={(person) => openRequest(person, 'Career direction', { kind: 'mentoring' })}
      />

      <div className="relative mt-[26px]">
        <button
          onClick={browse}
          className="rx-btn rx-btn-dark min-h-[54px] rounded-[15px] px-7 py-4 text-[19px]"
        >
          Ask for a mentor
        </button>
      </div>
    </Panel>
  )
}

function CoachingPanel({ people }) {
  const { openRequest, openPeople } = useOverlays()

  const browse = () =>
    openPeople({
      kind: 'coaching',
      title: 'Coaches across Radix',
      intent:
        'People with a few years behind them who will work through one thing with you. Filter, pick someone, and propose a first session.',
      topic: 'Leading a team',
    })

  return (
    <Panel>
      <PanelHead eyebrow="Sixty Minutes" title="Work through something specific">
        A handful of focused sessions on one thing: leading a team, speaking up in rooms, managing
        your time. You set the goal.
      </PanelHead>

      <Steps items={COACHING_STEPS} />

      <SectionLabel>People offering to coach</SectionLabel>

      <NameChips
        people={people}
        onPick={(person) => openRequest(person, 'Leading a team', { kind: 'coaching' })}
      />

      <div className="relative mt-[26px]">
        <button
          onClick={browse}
          className="rx-btn rx-btn-dark min-h-[54px] rounded-[15px] px-7 py-4 text-[19px]"
        >
          Set up coaching
        </button>
      </div>
    </Panel>
  )
}

/* -------------------------------------------------------------------------- */
/*                     People offering the selected topic                     */
/* -------------------------------------------------------------------------- */

function TopicPeople({ topic }) {
  const { openProfile, openRequest, openPeople } = useOverlays()
  const anchor = useRef(null)

  // The panel fills the first screen, so a topic picked at the bottom of the
  // chip list would otherwise drop its results out of sight.
  useEffect(() => {
    anchor.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [topic])

  // Looked up by slug rather than paged out of the whole vocabulary: there are
  // a few hundred skill tags, and the one in the URL need not be near the top.
  const { data: topicMeta } = useQuery({
    queryKey: ['tags', { slug: topic }],
    queryFn: () => searchTags({ slug: topic, limit: 1 }),
    enabled: Boolean(topic),
  })

  // People list a skill under "can help with", "can talk about", or both — for
  // this question they mean the same thing.
  const params = {
    tag: topic,
    kind: 'can_help_with,can_talk_about',
    open_to_mentoring: true,
    per_page: 24,
  }

  const { data, isPending } = useQuery({
    queryKey: ['users', params],
    queryFn: () => listUsers(params),
    enabled: Boolean(topic),
  })

  const topicName = useMemo(() => topicMeta?.items?.[0]?.name ?? topic, [topicMeta, topic])

  const people = data?.items ?? []
  const total = data?.meta?.total ?? people.length
  const shown = people.slice(0, 6)

  return (
    <div ref={anchor} className="mt-[30px] animate-rise scroll-mt-[90px]">
      <div className="mb-[18px] flex flex-wrap items-center gap-3">
        <p className="m-0 text-[16.5px] text-muted">
          <strong className="font-bold text-ink">{total}</strong>{' '}
          {total === 1 ? 'person has' : 'people have'} offered to talk about {topicName}
        </p>
        {total > shown.length && (
          <button
            onClick={() =>
              openPeople({
                kind: 'knowledge',
                title: `Everyone who knows ${topicName}`,
                intent: 'Pick whoever fits, propose a time, and they can accept or move it.',
                topic: topicName,
                filters: { tag: topic, kind: 'can_help_with,can_talk_about' },
              })
            }
            className="rx-link"
          >
            See all {total} →
          </button>
        )}
      </div>

      {isPending ? (
        <SkeletonCards count={3} height={220} />
      ) : people.length === 0 ? (
        <p className="text-[16.5px] text-muted">
          Nobody has offered this one yet. Try another topic.
        </p>
      ) : (
        <div className="grid gap-[18px] [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
          {shown.map((person) => (
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
                  onClick={() => openRequest(person, topicName, { kind: 'knowledge' })}
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
