import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { listRequests, respond, updateRequest } from '../api/sessions'
import { titleCase } from '../lib/format'
import Avatar from './Avatar'
import { Empty, ErrorNote } from './States'
import TimeSlots from './TimeSlots'
import { buildSlots } from '../lib/slots'
import { useToast } from './Toast'

const STATUS_TONE = {
  pending: 'rx-chip-sand',
  accepted: 'rx-chip-tint',
  time_suggested: 'rx-chip-tint',
  declined: 'rx-chip-outline',
  completed: 'rx-chip-tint',
  cancelled: 'rx-chip-outline',
}

function when(value) {
  if (!value) return null
  return new Date(value).toLocaleString(undefined, {
    weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
  })
}

/** Incoming and outgoing 30-minute asks, with the recipient's three replies. */
export default function SessionsPanel() {
  const queryClient = useQueryClient()
  const say = useToast()
  const [direction, setDirection] = useState('incoming')
  // Accepting or suggesting a time both require a `scheduled_at`, and seeded
  // requests carry no proposed time — so the recipient picks one here.
  const slots = useMemo(() => buildSlots(), [])
  const [times, setTimes] = useState({})

  const { data, isPending, error } = useQuery({
    queryKey: ['session-requests', { direction }],
    queryFn: () => listRequests({ direction }),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['session-requests'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const reply = useMutation({
    mutationFn: ({ id, payload }) => respond(id, payload),
    onSuccess: (_, variables) => {
      invalidate()
      say(
        variables.payload.action === 'accept'
          ? "Accepted. It's in both your calendars now."
          : variables.payload.action === 'decline'
            ? 'Declined. No hard feelings.'
            : 'Another time suggested.',
      )
    },
    onError: (caught) => say(caught.message),
  })

  const change = useMutation({
    mutationFn: ({ id, status }) => updateRequest(id, { status }),
    onSuccess: () => {
      invalidate()
      say('Updated.')
    },
    onError: (caught) => say(caught.message),
  })

  const requests = data?.items ?? []

  return (
    <div className="mt-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="rx-display m-0 text-[clamp(28px,3.6vw,42px)] tracking-[-.032em]">Your sessions</h2>
        <div className="flex gap-1 rounded-[14px] bg-sand p-1">
          {['incoming', 'outgoing'].map((value) => (
            <button
              key={value}
              onClick={() => setDirection(value)}
              className={
                direction === value
                  ? 'cursor-pointer rounded-[11px] border-none bg-white px-[22px] py-[11px] text-[15.5px] font-bold shadow-[0_2px_8px_rgb(20_18_15/0.08)]'
                  : 'cursor-pointer rounded-[11px] border-none bg-transparent px-[22px] py-[11px] text-[15.5px] font-semibold text-muted'
              }
            >
              {value === 'incoming' ? 'Asked of you' : 'You asked'}
            </button>
          ))}
        </div>
      </div>

      <ErrorNote error={error} className="mt-6" />
      {isPending && <p className="pt-6 text-[16.5px] text-muted">Loading…</p>}

      {!isPending && requests.length === 0 && (
        <div className="mt-6">
          <Empty
            title={direction === 'incoming' ? 'Nobody has asked you yet.' : "You haven't asked anyone yet."}
            hint="Pick a topic above and request thirty minutes."
          />
        </div>
      )}

      <div className="mt-6 grid gap-[18px] [grid-template-columns:repeat(auto-fill,minmax(320px,1fr))]">
        {requests.map((request) => {
          const other = direction === 'incoming' ? request.requester : request.recipient
          const canRespond = direction === 'incoming' && request.status === 'pending'
          const proposed = request.proposed_at
            ? { value: request.proposed_at, label: `Their time · ${when(request.proposed_at)}` }
            : null
          const chosen = times[request.id] ?? request.proposed_at ?? slots[0].value
          return (
            <article key={request.id} className="rx-card animate-rise rounded-tile p-6">
              <div className="flex items-center gap-[14px]">
                <Avatar person={other} size={54} radius={16} />
                <div className="min-w-0">
                  <h3 className="rx-title m-0 text-[20px]">{other?.name}</h3>
                  <p className="m-0 mt-[2px] text-[14.5px] text-muted">{titleCase(request.category)}</p>
                </div>
                <span className={`rx-chip ${STATUS_TONE[request.status] ?? 'rx-chip-sand'} ml-auto px-3 py-1.5 text-[13px]`}>
                  {titleCase(request.status)}
                </span>
              </div>

              <p className="m-0 mt-4 text-[17px] leading-[1.45] font-semibold">{request.topic}</p>
              {request.message && <p className="m-0 mt-2 text-[15.5px] leading-[1.5] text-muted">{request.message}</p>}
              {(request.scheduled_at || request.proposed_at) && (
                <p className="m-0 mt-3 text-[15px] font-bold text-acc-ink">
                  {request.scheduled_at ? when(request.scheduled_at) : `Proposed ${when(request.proposed_at)}`}
                </p>
              )}

              {canRespond && (
                <div className="mt-5">
                  <p className="rx-eyebrow m-0 mb-2">
                    {request.proposed_at ? 'Accept that time, or pick another' : 'Pick a time'}
                  </p>
                  <TimeSlots
                    size="sm"
                    slots={proposed ? [proposed, ...slots] : slots}
                    value={chosen}
                    onChange={(value) => setTimes((current) => ({ ...current, [request.id]: value }))}
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() =>
                        reply.mutate({
                          id: request.id,
                          payload: { action: 'accept', scheduled_at: chosen },
                        })
                      }
                      disabled={reply.isPending}
                      className="rx-btn rx-btn-acc min-h-[44px] px-4 text-[15px]"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() =>
                        reply.mutate({
                          id: request.id,
                          payload: { action: 'suggest_time', scheduled_at: chosen },
                        })
                      }
                      disabled={reply.isPending || chosen === request.proposed_at}
                      className="rx-btn rx-btn-ghost min-h-[44px] px-4 text-[15px]"
                    >
                      Suggest this instead
                    </button>
                    <button
                      onClick={() => reply.mutate({ id: request.id, payload: { action: 'decline' } })}
                      disabled={reply.isPending}
                      className="rx-btn rx-btn-ghost min-h-[44px] px-4 text-[15px]"
                    >
                      Pass
                    </button>
                  </div>
                </div>
              )}

              {request.status === 'accepted' && (
                <button
                  onClick={() => change.mutate({ id: request.id, status: 'completed' })}
                  className="rx-btn rx-btn-ghost mt-5 min-h-[44px] px-4 text-[15px]"
                >
                  Mark as done
                </button>
              )}

              {direction === 'outgoing' && request.status === 'pending' && (
                <button
                  onClick={() => change.mutate({ id: request.id, status: 'cancelled' })}
                  className="rx-btn rx-btn-ghost mt-5 min-h-[44px] px-4 text-[15px]"
                >
                  Cancel
                </button>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}
