import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { endPairing, getBuddy, history, joinPool, leavePool } from '../../api/buddy'
import Avatar from '../../components/Avatar'
import { useOverlays } from '../../components/Overlays'
import { ErrorNote, SkeletonCards } from '../../components/States'
import { useToast } from '../../components/Toast'
import { personMeta, shortDate } from '../../lib/format'

const firstName = (name) => String(name ?? '').split(' ')[0]

/**
 * Cross-location Buddy. No monthly round to wait for: you opt in and get paired
 * the moment somebody in another office is waiting. A different office is the
 * hard rule — a different team is a preference on top of it.
 */
export default function BuddyPanel() {
  const say = useToast()
  const queryClient = useQueryClient()
  const { openProfile } = useOverlays()

  const { data, isPending, error } = useQuery({ queryKey: ['buddy'], queryFn: getBuddy })
  const { data: past } = useQuery({ queryKey: ['buddy', 'history'], queryFn: () => history() })

  const signup = data?.signup
  const pairing = data?.pairing
  const waiting = Boolean(signup) && signup.status === 'waiting'

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['buddy'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  // A 422 from opting in is almost always "no location on your profile", which
  // is the person's to fix — so it stays on the page instead of flashing past
  // in a toast, with the link to go and fix it.
  const join = useMutation({
    mutationFn: () => joinPool(),
    onSuccess: (result) => {
      refresh()
      say(
        result?.pairing
          ? `Matched with ${firstName(result.pairing.buddy?.name)}. Say hello.`
          : "You're in the pool. We'll pair you the moment someone else's office joins.",
      )
    },
  })

  const leave = useMutation({
    mutationFn: leavePool,
    onSuccess: () => {
      refresh()
      say('Left the pool. Come back whenever.')
    },
    onError: (caught) => say(caught.message),
  })

  const wrapUp = useMutation({
    mutationFn: (id) => endPairing(id),
    onSuccess: () => {
      refresh()
      queryClient.invalidateQueries({ queryKey: ['buddy', 'history'] })
      say('Wound up. Neither of you goes back in the pool automatically.')
    },
    onError: (caught) => say(caught.message),
  })

  const previous = (past?.items ?? []).filter(
    (item) => item.status !== 'active' && item.id !== pairing?.id,
  )

  return (
    <section className="mt-16 animate-rise">
      <p className="rx-eyebrow m-0">Cross-location buddy</p>
      <h2 className="rx-display m-0 mt-2 max-w-[560px] text-[clamp(28px,3.6vw,42px)] leading-[1.02] tracking-[-.032em]">
        One person, another office
      </h2>

      <ErrorNote error={error} className="mt-6" />

      <div className="mt-[26px]">
        {isPending ? (
          <SkeletonCards count={1} height={220} />
        ) : pairing ? (
          <article className="rx-card animate-spring rounded-tile p-[clamp(24px,3vw,34px)]">
            <div className="flex flex-wrap items-center gap-[18px]">
              <Avatar person={pairing.buddy} size={72} radius={21} />
              <div className="min-w-0">
                <p className="rx-eyebrow m-0">Your buddy</p>
                <h3 className="rx-title m-0 mt-[3px] text-[27px]">{pairing.buddy?.name}</h3>
                <p className="m-0 mt-[3px] text-[15.5px] text-muted">{personMeta(pairing.buddy)}</p>
              </div>
              {pairing.started_at && (
                <span className="rx-chip rx-chip-tint ml-auto">Since {shortDate(pairing.started_at)}</span>
              )}
            </div>

            {pairing.match_reason && (
              <p className="m-0 mt-6 rounded-[16px] bg-sand px-[18px] py-4 text-[16.5px] leading-[1.45] font-semibold">
                {pairing.match_reason}
              </p>
            )}

            <p className="m-0 mt-4 text-[16px] leading-[1.5] text-muted">
              Nobody is scheduling this for you. Send a message, find an hour that survives both time
              zones, and talk about anything that isn't a ticket.
            </p>

            <div className="mt-6 flex flex-wrap gap-[10px]">
              <button onClick={() => openProfile(pairing.buddy?.id)} className="rx-btn rx-btn-acc rounded-[13px]">
                View profile
              </button>
              <button
                onClick={() => wrapUp.mutate(pairing.id)}
                disabled={wrapUp.isPending}
                className="rx-btn rx-btn-ghost rounded-[13px]"
              >
                {wrapUp.isPending ? 'Ending…' : 'End pairing'}
              </button>
            </div>
          </article>
        ) : waiting ? (
          <article className="animate-rise rounded-tile bg-cream p-[clamp(24px,3vw,34px)]">
            <span className="text-[34px] leading-none">🌍</span>
            <h3 className="rx-title m-0 mt-4 text-[26px]">Waiting for someone in another office</h3>
            <p className="m-0 mt-3 max-w-[520px] text-[16.5px] leading-[1.5] text-muted">
              You're in the pool. The moment somebody outside your office opts in, we pair you — no
              round to wait for, no end-of-month deadline. You'll see them here.
            </p>
            {signup?.note && (
              <p className="m-0 mt-4 rounded-[16px] bg-white px-[18px] py-4 text-[15.5px] leading-[1.45] text-muted">
                “{signup.note}”
              </p>
            )}
            <button
              onClick={() => leave.mutate()}
              disabled={leave.isPending}
              className="rx-btn rx-btn-ghost mt-6 rounded-[13px]"
            >
              {leave.isPending ? 'Leaving…' : 'Leave the pool'}
            </button>
          </article>
        ) : (
          <article className="rx-card-dark relative overflow-hidden rounded-panel p-[clamp(26px,3.4vw,44px)]">
            <div
              className="absolute top-[-80px] right-[-60px] h-[240px] w-[240px] rounded-full border-2 border-white/25"
              style={{ animation: 'floatC 15s ease-in-out infinite' }}
            />
            <div className="relative max-w-[560px]">
              <p className="m-0 text-[13.5px] font-bold tracking-[.14em] uppercase opacity-[.7]">
                Ninety-eight people, four continents
              </p>
              <h3 className="rx-display m-0 mt-[14px] text-[clamp(26px,3.2vw,38px)] leading-[1.04]">
                Get one person you'd never have met.
              </h3>
              <p className="m-0 mt-4 text-[17.5px] leading-[1.5] opacity-[.82]">
                Your buddy will be in a different office — that part isn't negotiable — and a
                different team wherever we can manage it. There's no monthly round: opt in and you're
                paired the second someone elsewhere is waiting.
              </p>
              <button
                onClick={() => join.mutate()}
                disabled={join.isPending}
                className="rx-btn rx-btn-inv rx-btn-lg mt-7"
              >
                {join.isPending ? 'Looking…' : 'Find me a buddy'}
              </button>
            </div>

            {join.error && (
              <div className="relative mt-5 max-w-[560px] rounded-[18px] bg-white/[.12] p-[20px]">
                <p className="m-0 text-[16.5px] font-bold">We can't pair you yet.</p>
                <p className="m-0 mt-2 text-[15.5px] opacity-[.85]">{join.error.message}</p>
                {/* Two different 422s land here, and only one is fixed on /me. */}
                {/location/i.test(join.error.message) && (
                  <Link to="/me" className="rx-btn rx-btn-inv mt-4 rounded-[13px] no-underline">
                    Set your location
                  </Link>
                )}
              </div>
            )}
          </article>
        )}
      </div>

      {previous.length > 0 && (
        <div className="mt-9">
          <p className="rx-eyebrow m-0 mb-[14px]">Buddies you've had</p>
          <div className="grid gap-[14px] [grid-template-columns:repeat(auto-fill,minmax(290px,1fr))]">
            {previous.map((item) => (
              <button
                key={item.id}
                onClick={() => item.buddy && openProfile(item.buddy.id)}
                className="flex animate-rise cursor-pointer items-center gap-[14px] rounded-tile border-[1.5px] border-edge-soft bg-white p-[18px] text-left transition-colors duration-200 hover:border-ink"
              >
                <Avatar person={item.buddy} size={46} radius={14} />
                <div className="min-w-0">
                  <p className="rx-title m-0 text-[18px]">{item.buddy?.name ?? 'Someone at Radix'}</p>
                  <p className="m-0 mt-[2px] text-[14.5px] text-muted">
                    {item.started_at ? shortDate(item.started_at) : '—'}
                    {item.ended_at ? ` – ${shortDate(item.ended_at)}` : ''}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
