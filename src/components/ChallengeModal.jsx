import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { getChallenge, join, leave, logEntry } from '../api/challenges'
import { useAuth } from '../auth/AuthContext'
import Avatar from './Avatar'
import Modal from './Modal'
import { useOverlays } from './Overlays'
import { ErrorNote } from './States'
import { useToast } from './Toast'
import { personMeta, shortDate, titleCase } from '../lib/format'

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

/** `days_left` comes back clamped at zero, so the dates do the talking. */
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

const ordinal = (n) => {
  const tens = n % 100
  if (tens >= 11 && tens <= 13) return `${n}th`
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`
}

/** Today in the reader's timezone, not UTC's. */
function todayIso() {
  const date = new Date()
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 10)
}

/** One challenge in full: the board, and — if you're in it — the log form. */
export default function ChallengeModal({ slug, onClose }) {
  const { user } = useAuth()
  const say = useToast()
  const queryClient = useQueryClient()
  const { openProfile } = useOverlays()
  const [value, setValue] = useState('')
  const [note, setNote] = useState('')
  const [loggedOn, setLoggedOn] = useState(todayIso)

  const { data: challenge, isPending, error } = useQuery({
    queryKey: ['challenge', slug],
    queryFn: () => getChallenge(slug),
  })

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['challenge', slug] })
    queryClient.invalidateQueries({ queryKey: ['challenges'] })
  }

  const membership = useMutation({
    mutationFn: (joined) => (joined ? leave(slug) : join(slug)),
    onSuccess: (_, joined) => {
      refresh()
      say(joined ? 'Out. Your total goes with you.' : "You're on the board. Now log something.")
    },
    onError: (caught) => say(caught.message),
  })

  const log = useMutation({
    mutationFn: () =>
      logEntry(slug, {
        value: Number(value),
        note: note.trim() || undefined,
        logged_on: loggedOn || undefined,
      }),
    onSuccess: () => {
      setValue('')
      setNote('')
      setLoggedOn(todayIso())
      refresh()
      say('Logged. The board will sort itself out.')
    },
  })

  const board = challenge?.leaderboard ?? []
  const mine = challenge?.my_participation
  const joined = Boolean(mine)
  // The detail payload doesn't rank your own row, so borrow it from the board.
  const myRank = mine?.rank ?? board.find((row) => row.user?.id === user?.id)?.rank ?? null
  const myLogs = mine?.logs ?? []
  const isCreator = challenge?.creator?.id === user?.id
  const closed = challenge?.status === 'cancelled' || challenge?.status === 'completed'
  const notStarted = (daysUntil(challenge?.starts_on) ?? 0) > 0
  const total = mine?.total_value ?? 0
  const goal = challenge?.goal_value
  const percent = goal ? Math.min(100, Math.round((total / goal) * 100)) : 0
  const amount = Number(value)
  const canPost = Number.isInteger(amount) && amount >= 1 && amount <= 100000

  return (
    <Modal onClose={onClose} maxWidth={720} zIndex={135}>
      {isPending && <p className="py-8 text-[16.5px] text-muted">Loading…</p>}
      <ErrorNote error={error} />

      {challenge && (
        <>
          <p className="m-0 text-[12.5px] font-bold tracking-[.14em] text-acc-ink uppercase">
            {challengeEmoji(challenge.category)} {titleCase(challenge.category)} · {windowLabel(challenge)}
          </p>
          <h2 className="rx-display m-0 mt-2 text-[clamp(26px,3.4vw,38px)]">{challenge.title}</h2>
          <p className="m-0 mt-3 text-[16.5px] text-muted">
            {shortDate(challenge.starts_on)} – {shortDate(challenge.ends_on)} · counting {challenge.unit}
            {goal ? ` · ${goal} ${challenge.unit} to aim at` : ''}
          </p>

          {challenge.creator && (
            <div className="mt-4 flex items-center gap-3">
              <Avatar person={challenge.creator} size={44} radius={13} />
              <p className="m-0 text-[16px] text-muted">
                {isCreator ? 'You started this one' : `Started by ${challenge.creator.name}`}
                {challenge.group?.name ? ` · ${challenge.group.name}` : ''}
              </p>
            </div>
          )}

          {challenge.description && (
            <p className="m-0 mt-5 text-[17px] leading-[1.5]">{challenge.description}</p>
          )}

          {/* --- Where you stand ------------------------------------------ */}
          {joined && (
            <div className="mt-7 animate-pop rounded-tile bg-tint p-[22px]">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="m-0 text-[13px] font-bold tracking-[.14em] text-acc-ink uppercase">Your total</p>
                  <p className="rx-display m-0 mt-1.5 text-[clamp(30px,4.4vw,44px)] text-acc-ink">
                    {total} <span className="text-[0.5em] font-bold">{challenge.unit}</span>
                  </p>
                </div>
                <p className="m-0 text-[16.5px] font-bold text-acc-ink">
                  {myRank ? `${ordinal(myRank)} of ${challenge.participants_count}` : 'On the board'}
                </p>
              </div>
              {goal ? (
                <>
                  <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-acc transition-[width] duration-700 ease-[cubic-bezier(.2,.9,.3,1)]"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <p className="m-0 mt-2.5 text-[15px] font-semibold text-acc-ink">
                    {percent >= 100
                      ? `Target cleared. Keep going if you like.`
                      : `${goal - total} ${challenge.unit} to go.`}
                  </p>
                </>
              ) : null}
            </div>
          )}

          {/* --- Log an entry --------------------------------------------- */}
          {joined && challenge.is_running && (
            <div className="mt-5 rounded-tile bg-cream p-[22px]">
              <p className="rx-label">Log an entry</p>
              <div className="flex flex-wrap gap-3">
                <div className="min-w-[120px] flex-[1_1_120px]">
                  <input
                    className="rx-input"
                    type="number"
                    min="1"
                    max="100000"
                    step="1"
                    inputMode="numeric"
                    placeholder={`How many ${challenge.unit}?`}
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                  />
                </div>
                <div className="min-w-[150px] flex-[1_1_150px]">
                  <input
                    className="rx-input"
                    type="date"
                    value={loggedOn}
                    onChange={(event) => setLoggedOn(event.target.value)}
                  />
                </div>
              </div>
              <input
                className="rx-input mt-3"
                maxLength={180}
                placeholder="A note, if there's a story in it"
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
              {log.error && (
                <p className="m-0 mt-2 text-[14.5px] font-semibold text-[#B90F33]">
                  {log.error.fieldError?.('value') ?? log.error.message}
                </p>
              )}
              <button
                onClick={() => log.mutate()}
                disabled={!canPost || log.isPending}
                className="rx-btn rx-btn-acc mt-3"
              >
                {log.isPending ? 'Adding…' : `Add ${challenge.unit}`}
              </button>
            </div>
          )}

          {joined && !challenge.is_running && (
            <p className="m-0 mt-5 rounded-tile bg-cream p-[18px] text-[16px] text-muted">
              {challenge.status === 'cancelled'
                ? 'This one was called off. Nothing more to log.'
                : notStarted
                  ? `Logging opens on ${shortDate(challenge.starts_on)}. Nothing to do until then.`
                  : "It's over. The numbers below are final."}
            </p>
          )}

          {!joined && (
            <div className="mt-6 flex flex-wrap items-center gap-4 rounded-tile bg-cream p-[22px]">
              <p className="m-0 flex-1 text-[16.5px] text-muted">
                {closed
                  ? 'This challenge is closed — you can still see how it went.'
                  : notStarted
                    ? "Join now and you'll be ready on day one."
                    : 'Join and your first entry puts you on the board.'}
              </p>
              {!closed && (
                <button
                  onClick={() => membership.mutate(false)}
                  disabled={membership.isPending}
                  className="rx-btn rx-btn-acc"
                >
                  {membership.isPending ? 'Joining…' : "Count me in"}
                </button>
              )}
            </div>
          )}

          {/* --- The board ------------------------------------------------ */}
          <p className="rx-eyebrow m-0 mt-8 mb-4">
            Leaderboard · {challenge.participants_count}{' '}
            {challenge.participants_count === 1 ? 'person' : 'people'}
          </p>

          {board.length === 0 ? (
            <p className="m-0 text-[16.5px] text-muted">
              Nobody on the board yet. First name up sets the pace.
            </p>
          ) : (
            <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
              {board.map((row) => {
                const isMe = row.user?.id === user?.id
                const isFirst = row.rank === 1
                return (
                  <li
                    key={row.id}
                    className={`flex items-center gap-4 rounded-tile border-[1.5px] p-[14px] transition-colors ${
                      isMe ? 'border-acc bg-tint' : isFirst ? 'border-edge-strong bg-cream' : 'border-edge bg-white'
                    }`}
                  >
                    <span
                      className={`grid h-9 w-9 flex-none place-items-center rounded-full text-[15px] font-extrabold ${
                        isFirst ? 'bg-ink text-white' : isMe ? 'bg-acc text-on-acc' : 'bg-sand text-muted'
                      }`}
                    >
                      {row.rank ?? '–'}
                    </span>
                    <Avatar person={row.user} size={42} radius={13} />
                    <div className="min-w-0 flex-1">
                      <button
                        onClick={() => row.user?.id && openProfile(row.user.id)}
                        className="cursor-pointer border-none bg-transparent p-0 text-left text-[16.5px] font-bold text-ink"
                      >
                        {row.user?.name ?? 'Someone here'}
                        {isMe ? ' · you' : ''}
                      </button>
                      <p className="m-0 mt-0.5 text-[14.5px] text-faint">
                        {personMeta(row.user) || (isFirst ? 'Setting the pace' : '')}
                      </p>
                    </div>
                    <p
                      className={`m-0 flex-none text-right text-[17px] font-extrabold ${
                        isMe || isFirst ? 'text-acc-ink' : 'text-ink'
                      }`}
                    >
                      {row.total_value ?? 0}
                      <span className="ml-1 text-[14px] font-bold text-muted">{challenge.unit}</span>
                    </p>
                  </li>
                )
              })}
            </ol>
          )}

          {board.length === 1 && (
            <p className="m-0 mt-3 text-[15.5px] text-muted">
              A leaderboard of one is still a leaderboard. It gets more interesting with company.
            </p>
          )}

          {/* --- Your own entries ----------------------------------------- */}
          {myLogs.length > 0 && (
            <>
              <p className="rx-eyebrow m-0 mt-8 mb-4">
                Your entries · {myLogs.length}
              </p>
              <div className="flex flex-col gap-2">
                {myLogs
                  .slice()
                  .sort((a, b) => String(b.logged_on).localeCompare(String(a.logged_on)))
                  .map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-4 rounded-[14px] bg-cream px-[18px] py-3"
                    >
                      <span className="text-[16px] font-extrabold text-acc-ink">
                        +{entry.value} {challenge.unit}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[15.5px] text-muted">{entry.note}</span>
                      <span className="flex-none text-[14.5px] text-faint">{shortDate(entry.logged_on)}</span>
                    </div>
                  ))}
              </div>
            </>
          )}

          {joined && (
            <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-line pt-6">
              <p className="m-0 flex-1 text-[15.5px] text-muted">
                Leaving clears your total. Nobody gets a notification about it.
              </p>
              <button
                onClick={() => membership.mutate(true)}
                disabled={membership.isPending}
                className="rx-btn rx-btn-ghost min-h-[44px] px-4 text-[15px]"
              >
                Leave the challenge
              </button>
            </div>
          )}
        </>
      )}
    </Modal>
  )
}
