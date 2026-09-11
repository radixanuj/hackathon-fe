import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { createChallenge, join, leave, listChallenges } from '../../api/challenges'
import { getMeta } from '../../api/meta'
import { useAuth } from '../../auth/AuthContext'
import ChallengeModal from '../../components/ChallengeModal'
import FormModal from '../../components/FormModal'
import { Empty, ErrorNote, SkeletonCards } from '../../components/States'
import { useToast } from '../../components/Toast'
import { titleCase } from '../../lib/format'

const SCOPES = [
  { key: 'active', label: 'Running now' },
  { key: 'upcoming', label: 'Starting soon' },
  { key: 'past', label: 'Finished' },
  { key: 'mine', label: 'Mine' },
  { key: 'all', label: 'Everything' },
]

// One emoji per category, so a wall of challenges reads before it's read.
const CATEGORY_EMOJI = {
  running: '🏃', reading: '📚', photography: '📷',
  sports: '🏅', learning: '🧠', other: '✨',
}
const challengeEmoji = (category) => CATEGORY_EMOJI[category] ?? '✨'

const DAY = 86400000

/** Whole days from today to a YYYY-MM-DD date. Negative once it's behind us. */
function daysUntil(date) {
  if (!date) return null
  const target = new Date(`${date}T00:00:00`)
  if (Number.isNaN(target.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((target - today) / DAY)
}

/**
 * The API clamps `days_left` at zero, so "ends today" and "ended three weeks
 * ago" arrive looking identical. The dates themselves still tell the truth.
 */
function windowLabel(challenge) {
  if (challenge.status === 'cancelled') return 'Called off'
  const toStart = daysUntil(challenge.starts_on)
  const toEnd = daysUntil(challenge.ends_on)
  if (toStart !== null && toStart > 0) {
    return toStart === 1 ? 'Starts tomorrow' : `Starts in ${toStart} days`
  }
  if (toEnd === null) return ''
  if (toEnd < 0) return 'Ended'
  if (toEnd === 0) return 'Ends today'
  if (toEnd === 1) return 'One day left'
  return `${toEnd} days left`
}

/** `YYYY-MM-DD` for a date input, in the reader's timezone rather than UTC. */
function isoDate(offsetDays = 0) {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 10)
}

/** A challenge counts one thing. `unit` says what, and the board sorts itself. */
export default function ChallengesTab() {
  const say = useToast()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [scope, setScope] = useState('active')
  const [category, setCategory] = useState('')
  const [term, setTerm] = useState('')
  const [creating, setCreating] = useState(false)
  const [openSlug, setOpenSlug] = useState(null)

  const { data: meta } = useQuery({ queryKey: ['meta'], queryFn: getMeta })
  const { data, isPending, error } = useQuery({
    queryKey: ['challenges', { scope, category, term }],
    queryFn: () =>
      listChallenges({
        scope,
        category: category || undefined,
        q: term || undefined,
        per_page: 50,
      }),
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['challenges'] })

  const membership = useMutation({
    mutationFn: ({ slug, joined }) => (joined ? leave(slug) : join(slug)),
    onSuccess: (_, variables) => {
      refresh()
      queryClient.invalidateQueries({ queryKey: ['challenge', variables.slug] })
      say(variables.joined ? 'Out. Your total goes with you.' : "You're on the board. Now log something.")
    },
    onError: (caught) => say(caught.message),
  })

  const challenges = data?.items ?? []
  const categories = meta?.challenge_categories ?? []

  return (
    <div className="mt-8 animate-rise">
      <div className="flex flex-wrap items-end justify-between gap-[18px]">
        <div>
          <h2 className="rx-display m-0 mb-1.5 max-w-[460px] text-[clamp(28px,3.6vw,42px)] leading-[1.02] tracking-[-.032em]">
            Count something together
          </h2>
          <p className="m-0 max-w-[520px] text-[18px] text-muted">
            Pick one number. Log it as you go. The leaderboard is just arithmetic.
          </p>
        </div>
        <button onClick={() => setCreating(true)} className="rx-btn rx-btn-dark rx-btn-lg">
          Start a challenge
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-[9px]">
        {SCOPES.map((option) => (
          <button
            key={option.key}
            onClick={() => setScope(option.key)}
            className={`rx-group ${scope === option.key ? 'rx-group-on' : ''}`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="mt-[14px] flex flex-wrap items-center gap-[9px]">
        <button
          onClick={() => setCategory('')}
          className={`rx-pill ${category === '' ? 'rx-pill-on' : ''}`}
        >
          Any category
        </button>
        {categories.map((option) => (
          <button
            key={option}
            onClick={() => setCategory(category === option ? '' : option)}
            className={`rx-pill ${category === option ? 'rx-pill-on' : ''}`}
          >
            {challengeEmoji(option)} {titleCase(option)}
          </button>
        ))}
        <div className="ml-auto w-full max-w-[270px]">
          <input
            className="rx-input py-[11px] text-[15.5px]"
            placeholder="Search challenges"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
          />
        </div>
      </div>

      <ErrorNote error={error} className="mt-6" />

      <div className="mt-[26px]">
        {isPending ? (
          <SkeletonCards count={6} height={300} />
        ) : challenges.length === 0 ? (
          term ? (
            <Empty title="Nothing matches that." hint="Try one word instead of three." />
          ) : scope === 'mine' ? (
            <Empty title="You haven't joined anything yet." hint="Pick one that's running. Logging takes ten seconds a day." />
          ) : scope === 'past' ? (
            <Empty title="Nothing has finished yet." hint="Give it a few weeks." />
          ) : (
            <Empty title="No challenges here." hint="Start the one you'd actually show up for." />
          )
        ) : (
          <div className="grid gap-[18px] [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
            {challenges.map((challenge) => {
              const mine = challenge.my_participation
              const joined = Boolean(mine)
              const total = mine?.total_value ?? 0
              const goal = challenge.goal_value
              const percent = goal ? Math.min(100, Math.round((total / goal) * 100)) : 0
              const isCreator = challenge.creator?.id === user?.id
              const closed = challenge.status === 'cancelled' || challenge.status === 'completed'
              const ended = (daysUntil(challenge.ends_on) ?? 0) < 0

              return (
                <article
                  key={challenge.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setOpenSlug(challenge.slug)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setOpenSlug(challenge.slug)
                    }
                  }}
                  className="rx-card rx-card-lift animate-rise flex min-h-[296px] cursor-pointer flex-col rounded-tile p-[26px]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[34px] leading-none">{challengeEmoji(challenge.category)}</span>
                    <span
                      className={`rx-chip px-[13px] py-1.5 text-[13.5px] font-bold ${
                        challenge.is_running ? 'rx-chip-tint' : 'rx-chip-sand'
                      }`}
                    >
                      {windowLabel(challenge)}
                    </span>
                  </div>

                  <h3 className="rx-title m-0 mt-4 text-2xl">{challenge.title}</h3>
                  <p className="m-0 mt-2 text-base text-muted">
                    {challenge.participants_count} {challenge.participants_count === 1 ? 'person' : 'people'}
                    {' counting '}
                    {challenge.unit}
                  </p>
                  {challenge.group?.name && (
                    <p className="m-0 mt-0.5 text-[15px] text-faint">From {challenge.group.name}</p>
                  )}

                  {goal ? (
                    <div className="mt-[18px]">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="m-0 text-[15px] font-bold">
                          {joined ? `${total} of ${goal} ${challenge.unit}` : `Target · ${goal} ${challenge.unit}`}
                        </p>
                        {joined && <p className="m-0 text-[14px] text-muted">{percent}%</p>}
                      </div>
                      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#EDE8E0]">
                        <div
                          className="h-full rounded-full bg-acc transition-[width] duration-700 ease-[cubic-bezier(.2,.9,.3,1)]"
                          style={{ width: `${joined ? percent : 0}%` }}
                        />
                      </div>
                    </div>
                  ) : joined ? (
                    <p className="m-0 mt-[18px] text-[16px] font-bold text-acc-ink">
                      {total} {challenge.unit} logged
                    </p>
                  ) : (
                    <p className="m-0 mt-[18px] text-[15.5px] text-muted">No target — just keep counting.</p>
                  )}

                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-[22px]">
                    {closed || (ended && !joined) ? (
                      <span className="rx-chip rx-chip-sand text-[14.5px]">
                        {challenge.status === 'cancelled' ? 'Called off' : 'Finished'}
                      </span>
                    ) : (
                      <button
                        onClick={(event) => {
                          event.stopPropagation()
                          membership.mutate({ slug: challenge.slug, joined })
                        }}
                        disabled={membership.isPending}
                        className={`rx-btn min-h-[42px] px-4 text-[15px] ${joined ? 'rx-btn-ghost' : 'rx-btn-acc'}`}
                      >
                        {joined ? 'Leave' : "Count me in"}
                      </button>
                    )}
                    {isCreator && <span className="rx-chip rx-chip-sand text-[14.5px]">You started this</span>}
                    <span className="ml-auto text-[15px] font-bold text-acc-ink">Leaderboard →</span>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

      {openSlug && <ChallengeModal slug={openSlug} onClose={() => setOpenSlug(null)} />}

      {creating && (
        <FormModal
          title="Start a challenge"
          intent="A challenge counts one thing. Say what it is and how long we've got."
          submitLabel="Start counting"
          onClose={() => setCreating(false)}
          onDone={(challenge) => {
            refresh()
            say("It's live — and you're already in it.")
            if (challenge?.slug) setOpenSlug(challenge.slug)
          }}
          fields={[
            { key: 'title', label: 'What are we doing?', placeholder: 'October Running Challenge' },
            {
              key: 'description',
              label: 'The rules, briefly',
              type: 'textarea',
              placeholder: 'Anything on two feet counts. Treadmills included, reluctantly.',
            },
            { key: 'category', label: 'Category', type: 'select', options: categories.length ? categories : ['other'] },
            { key: 'unit', label: 'What are we counting?', placeholder: 'km' },
            { key: 'goal_value', label: 'Target per person (optional)', type: 'number', min: 1, placeholder: '100' },
            { key: 'starts_on', label: 'Starts', type: 'date', initial: isoDate() },
            { key: 'ends_on', label: 'Ends', type: 'date', initial: isoDate(30) },
          ]}
          onSubmit={(values) =>
            createChallenge({
              title: values.title,
              description: values.description || undefined,
              category: values.category,
              unit: values.unit,
              goal_value: values.goal_value ? Number(values.goal_value) : undefined,
              starts_on: values.starts_on,
              ends_on: values.ends_on,
            })
          }
        />
      )}
    </div>
  )
}
