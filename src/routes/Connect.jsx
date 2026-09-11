import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { createRound, currentRound, runMatching, signUp, withdraw } from '../api/meetups'
import { listUsers, searchTags } from '../api/people'
import { useAuth } from '../auth/AuthContext'
import Avatar from '../components/Avatar'
import { MatchingOverlay, MatchRevealModal } from '../components/MatchReveal'
import { useOverlays } from '../components/Overlays'
import SessionsPanel from '../components/SessionsPanel'
import { ErrorNote, SkeletonCards } from '../components/States'
import { useToast } from '../components/Toast'
import { periodLabel, personMeta, shortDate } from '../lib/format'

const RULES = [
  'A different team',
  'A different location where possible',
  "Someone you don't work with",
]

export default function Connect() {
  const { isAdmin } = useAuth()
  const say = useToast()
  const queryClient = useQueryClient()
  const { openProfile, openRequest } = useOverlays()
  const [searchParams, setSearchParams] = useSearchParams()

  const topic = searchParams.get('topic')
  const [matching, setMatching] = useState(false)
  const [revealed, setRevealed] = useState(false)

  const { data: round, isPending, error } = useQuery({
    queryKey: ['meetup-round', 'current'],
    queryFn: currentRound,
  })

  const { data: topics } = useQuery({
    queryKey: ['tags', { type: 'skill', limit: 10 }],
    queryFn: () => searchTags({ type: 'skill', limit: 10 }),
  })

  const { data: mentors, isPending: mentorsPending } = useQuery({
    queryKey: ['users', { tag: topic, kind: 'can_help_with', open_to_mentoring: true }],
    queryFn: () => listUsers({ tag: topic, kind: 'can_help_with', open_to_mentoring: true, per_page: 12 }),
    enabled: Boolean(topic),
  })

  const invalidateRound = () => queryClient.invalidateQueries({ queryKey: ['meetup-round'] })

  const join = useMutation({
    mutationFn: () => signUp(round.id),
    onSuccess: () => {
      invalidateRound()
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      say("You're in. We'll pair you when sign-ups close.")
    },
    onError: (caught) => say(caught.message),
  })

  const leave = useMutation({
    mutationFn: () => withdraw(round.id),
    onSuccess: () => {
      invalidateRound()
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      say('Withdrawn. Maybe next month.')
    },
    onError: (caught) => say(caught.message),
  })

  // Admin: the matching run is the demo moment, so it gets the full animation.
  const match = useMutation({
    mutationFn: () => runMatching(round.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['meetup-round'] })
      setTimeout(() => {
        setMatching(false)
        setRevealed(true)
      }, 1600)
    },
    onError: (caught) => {
      setMatching(false)
      say(caught.message)
    },
  })

  const openRound = useMutation({
    mutationFn: () => {
      const now = new Date()
      const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      // Sign-ups run from now until a week before the month is out; the API
      // fills in meetup_date as the last Friday of the period.
      const closes = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      closes.setDate(closes.getDate() - 7)
      return createRound({
        period,
        title: `${periodLabel(period)} Blind Meetup`,
        signups_open_at: now.toISOString(),
        signups_close_at: (closes > now ? closes : new Date(now.getTime() + 6048e5)).toISOString(),
        status: 'open',
      })
    },
    onSuccess: () => {
      invalidateRound()
      say('Round opened.')
    },
    onError: (caught) => say(caught.message),
  })

  const pair = round?.my_pair
  const signedUp = Boolean(round?.my_signup) && round.my_signup.status !== 'withdrawn'

  const mentorList = useMemo(() => mentors?.items ?? [], [mentors])
  const topicName = topics?.items?.find((tag) => tag.slug === topic)?.name ?? topic

  if (error) return <div className="pt-14"><ErrorNote error={error} /></div>

  return (
    <>
      {matching && <MatchingOverlay />}
      {revealed && pair && <MatchRevealModal pair={pair} onClose={() => setRevealed(false)} />}

      <section className="animate-rise pt-[52px]">
        {/* --- Blind Meetup ------------------------------------------------ */}
        <div className="relative overflow-hidden rounded-panel bg-acc p-[clamp(28px,4vw,52px)] text-on-acc">
          <div className="absolute top-[-70px] right-[-70px] h-[280px] w-[280px] rounded-full border-2 border-current opacity-30" style={{ animation: 'floatC 14s ease-in-out infinite' }} />
          <div className="absolute right-[120px] bottom-[-90px] h-[180px] w-[180px] rounded-full bg-white/[.14]" />

          <div className="relative max-w-[620px]">
            <p className="m-0 mb-[14px] text-[13.5px] font-bold tracking-[.14em] uppercase opacity-[.78]">Blind Meetup</p>
            <h1 className="rx-display m-0 text-[clamp(36px,5.4vw,62px)] leading-[.99]">
              One hour. One colleague you don't know. No agenda.
            </h1>
            <p className="m-0 mt-[18px] text-[19px] leading-[1.45] opacity-[.88]">
              Every month we pair people across teams and continents. You get a name, a coffee slot and an
              hour without a to-do list.
            </p>
          </div>

          {isPending && <p className="relative mt-8 text-[18px] opacity-80">Loading this month's round…</p>}

          {!isPending && !round && (
            <div className="relative mt-9 rounded-[20px] bg-white/[.16] p-[22px]">
              <p className="m-0 text-[18px] font-semibold">No round is open right now.</p>
              {isAdmin && (
                <button
                  onClick={() => openRound.mutate()}
                  disabled={openRound.isPending}
                  className="rx-btn rx-btn-inv mt-4"
                >
                  {openRound.isPending ? 'Opening…' : 'Open this month'}
                </button>
              )}
            </div>
          )}

          {round && (
            <>
              <div className="relative mt-[38px] grid max-w-[820px] gap-5 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
                <div className="rounded-[20px] bg-white/[.16] p-[22px]">
                  <p className="m-0 mb-1.5 text-[13px] font-bold tracking-[.12em] uppercase opacity-80">
                    {periodLabel(round.period)} round
                  </p>
                  <p className="rx-title m-0 text-[26px]">
                    {round.is_accepting_signups ? 'Signup closes' : 'Signups closed'}
                    <br />
                    {shortDate(round.signups_close_at)}
                  </p>
                </div>
                <div className="rounded-[20px] bg-white/[.16] p-[22px]">
                  <p className="m-0 mb-1.5 text-[13px] font-bold tracking-[.12em] uppercase opacity-80">The meetup</p>
                  <p className="rx-title m-0 text-[26px]">{shortDate(round.meetup_date)}</p>
                </div>
                <div className="rounded-[20px] bg-white/[.16] p-[22px]">
                  <p className="m-0 mb-1.5 text-[13px] font-bold tracking-[.12em] uppercase opacity-80">Pairing</p>
                  <p className="rx-title m-0 text-[26px]">
                    6+ years ↔<br />Under 6 years
                  </p>
                </div>
              </div>

              <div className="relative mt-[30px] flex flex-wrap gap-x-[26px] gap-y-[10px]">
                {RULES.map((rule) => (
                  <span key={rule} className="flex items-center gap-[9px] text-[16.5px] font-semibold">
                    <span className="grid h-6 w-6 flex-none place-items-center rounded-full bg-inv text-[13px] text-on-inv">✓</span>
                    {rule}
                  </span>
                ))}
              </div>

              <div className="relative mt-9">
                {pair?.partner ? (
                  <div className="flex animate-spring flex-wrap items-center gap-4 rounded-[20px] bg-inv p-[20px_24px] text-ink">
                    <Avatar person={pair.partner} size={52} radius={15} />
                    <div className="min-w-0">
                      <p className="rx-eyebrow m-0">You're in for {periodLabel(round.period)}</p>
                      <p className="rx-title m-0 mt-[3px] text-[23px]">Matched with {pair.partner.name}</p>
                    </div>
                    <button onClick={() => setRevealed(true)} className="rx-btn rx-btn-acc ml-auto rounded-[13px] px-5">
                      See match
                    </button>
                  </div>
                ) : signedUp ? (
                  <div className="flex flex-wrap items-center gap-4 rounded-[20px] bg-inv p-[20px_24px] text-ink">
                    <div className="min-w-0">
                      <p className="rx-eyebrow m-0">You're in for {periodLabel(round.period)}</p>
                      <p className="rx-title m-0 mt-[3px] text-[23px]">
                        {round.signups_count} people signed up so far
                      </p>
                    </div>
                    <button
                      onClick={() => leave.mutate()}
                      disabled={leave.isPending}
                      className="rx-btn rx-btn-ghost ml-auto rounded-[13px] px-5"
                    >
                      {leave.isPending ? 'Withdrawing…' : 'Withdraw'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => join.mutate()}
                    disabled={join.isPending || !round.is_accepting_signups}
                    className="rx-btn rx-btn-inv rounded-2xl px-8 py-[19px] text-[18px] shadow-[0_10px_28px_rgb(20_18_15/0.18)] hover:-translate-y-[3px] hover:scale-[1.02]"
                    style={{ minHeight: 58 }}
                  >
                    {join.isPending
                      ? 'Signing up…'
                      : round.is_accepting_signups
                        ? "Join this month's meetup"
                        : 'Sign-ups are closed'}
                  </button>
                )}

                {isAdmin && (
                  <div className="mt-5 flex flex-wrap items-center gap-3 rounded-[16px] border border-white/30 p-4">
                    <span className="text-[13px] font-bold tracking-[.12em] uppercase opacity-80">Admin</span>
                    <button
                      onClick={() => {
                        setMatching(true)
                        match.mutate()
                      }}
                      disabled={match.isPending}
                      className="rx-btn rx-btn-inv min-h-[44px] px-4 text-[15px]"
                    >
                      {match.isPending ? 'Matching…' : 'Run matching'}
                    </button>
                    <span className="text-[14.5px] opacity-80">
                      {round.signups_count ?? 0} signed up · {round.pairs_count ?? 0} pairs
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* --- Mentoring --------------------------------------------------- */}
        <div className="mt-16">
          <h2 className="rx-display m-0 text-[clamp(30px,4vw,46px)] tracking-[-.032em] leading-[1.02]">
            Learn from someone at Radix
          </h2>
          <p className="m-0 mt-3 mb-[26px] max-w-[560px] text-[18.5px] text-muted">
            Pick a topic. We'll show you who offered to talk about it. Thirty minutes, that's all.
          </p>

          <div className="flex flex-wrap gap-[11px]">
            {(topics?.items ?? []).map((tag) => {
              const on = topic === tag.slug
              return (
                <button
                  key={tag.id}
                  onClick={() => setSearchParams(on ? {} : { topic: tag.slug })}
                  className={
                    on
                      ? 'rx-btn rx-btn-acc min-h-[54px] animate-pop rounded-[18px] px-6 text-[17px]'
                      : 'rx-btn rounded-[18px] border-[1.5px] border-edge-soft bg-white px-6 text-[17px] font-semibold text-ink hover:-translate-y-1 hover:border-acc hover:bg-tint'
                  }
                  style={{ minHeight: 54 }}
                >
                  {tag.name}
                </button>
              )
            })}
          </div>

          {topic && (
            <div className="mt-[30px] animate-rise">
              <p className="m-0 mb-[18px] text-[16.5px] text-muted">
                <strong className="font-bold text-ink">{mentorList.length}</strong>{' '}
                {mentorList.length === 1 ? 'person has' : 'people have'} offered to talk about {topicName}
              </p>

              {mentorsPending ? (
                <SkeletonCards count={3} height={220} />
              ) : mentorList.length === 0 ? (
                <p className="text-[16.5px] text-muted">Nobody has offered this one yet. Try another topic.</p>
              ) : (
                <div className="grid gap-[18px] [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
                  {mentorList.map((person) => (
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
                        <button onClick={() => openProfile(person.id)} className="rx-btn rx-btn-ghost rounded-[13px]">
                          Profile
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <SessionsPanel />
      </section>
    </>
  )
}
