import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { createEvent, listEvents, rsvp } from '../../api/events'
import { getMeta } from '../../api/meta'
import { AvatarStack } from '../../components/Avatar'
import FormModal from '../../components/FormModal'
import { Empty, ErrorNote, SkeletonCards } from '../../components/States'
import { useToast } from '../../components/Toast'
import { eventEmoji, eventWhen } from '../../lib/format'

export default function EventsTab() {
  const say = useToast()
  const queryClient = useQueryClient()
  const [creating, setCreating] = useState(false)
  const [scope, setScope] = useState('upcoming')

  const { data: meta } = useQuery({ queryKey: ['meta'], queryFn: getMeta })
  const { data, isPending, error } = useQuery({
    queryKey: ['events', { scope }],
    queryFn: () => listEvents({ scope, per_page: 50 }),
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['events'] })

  const going = useMutation({
    mutationFn: ({ id, status }) => rsvp(id, status),
    onSuccess: (_, variables) => {
      refresh()
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      say(variables.status === 'going' ? "You're in. The host has been told." : 'Updated.')
    },
    onError: (caught) => say(caught.message),
  })

  const events = data?.items ?? []

  return (
    <div className="mt-8 animate-rise">
      <div className="flex flex-wrap items-end justify-between gap-[18px]">
        <h2 className="rx-display m-0 max-w-[420px] text-[clamp(28px,3.6vw,42px)] leading-[1.02] tracking-[-.032em]">
          Do something together
        </h2>
        <button onClick={() => setCreating(true)} className="rx-btn rx-btn-dark rx-btn-lg">
          Create something
        </button>
      </div>

      <div className="mt-5 flex gap-[9px]">
        {['upcoming', 'past', 'all'].map((value) => (
          <button
            key={value}
            onClick={() => setScope(value)}
            className={`rx-group ${scope === value ? 'rx-group-on' : ''}`}
          >
            {value === 'upcoming' ? 'Upcoming' : value === 'past' ? 'Past' : 'Everything'}
          </button>
        ))}
      </div>

      <ErrorNote error={error} className="mt-6" />

      <div className="mt-[26px]">
        {isPending ? (
          <SkeletonCards count={6} height={280} />
        ) : events.length === 0 ? (
          <Empty title="Nothing planned yet." hint="Be the person who suggests something." />
        ) : (
          <div className="grid gap-[18px] [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
            {events.map((event) => (
              <article key={event.id} className="rx-card rx-card-lift animate-rise rounded-tile p-[26px] hover:rotate-[.5deg]">
                <span className="text-[34px] leading-none">{eventEmoji(event.category)}</span>
                <h3 className="rx-title m-0 mt-4 text-2xl">{event.title}</h3>
                <p className="m-0 mt-2 text-base text-muted">{eventWhen(event)}</p>
                {event.host && <p className="m-0 mt-0.5 text-base text-muted">Hosted by {event.host.name}</p>}

                <div className="my-5 flex items-center gap-3">
                  <AvatarStack people={[event.host].filter(Boolean)} size={34} />
                  <span className="text-[15px] text-muted">
                    {event.going_count} joining
                    {event.spots_left !== null && event.spots_left !== undefined
                      ? ` · ${event.spots_left} spots left`
                      : ''}
                  </span>
                </div>

                {event.my_rsvp === 'going' ? (
                  <div className="flex animate-pop items-center gap-[10px] rounded-[14px] bg-tint px-[18px] py-[13px] text-[15.5px] font-bold text-acc-ink">
                    <span className="grid h-[22px] w-[22px] place-items-center rounded-full bg-acc text-[13px] text-on-acc">✓</span>
                    You're in
                    <button
                      onClick={() => going.mutate({ id: event.id, status: 'not_going' })}
                      className="ml-auto cursor-pointer border-none bg-transparent text-[14px] font-semibold text-muted underline"
                    >
                      Can't make it
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => going.mutate({ id: event.id, status: 'going' })}
                      disabled={going.isPending || event.is_full || event.status === 'cancelled'}
                      className="rx-btn rx-btn-acc flex-1 rounded-[14px]"
                    >
                      {event.is_full ? 'Full' : "I'm in"}
                    </button>
                    <button
                      onClick={() => going.mutate({ id: event.id, status: 'maybe' })}
                      disabled={going.isPending}
                      className="rx-btn rx-btn-ghost rounded-[14px] px-4"
                    >
                      Maybe
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>

      {creating && (
        <FormModal
          title="Create something"
          intent="Four questions. Then it's real."
          submitLabel="Put it out there"
          onClose={() => setCreating(false)}
          onDone={() => {
            refresh()
            say("It's live. People will see it on Home.")
          }}
          fields={[
            { key: 'title', label: 'Title', placeholder: 'Sunset walk along the creek' },
            { key: 'description', label: 'What are we doing?', type: 'textarea', placeholder: 'Easy 5k, coffee after' },
            { key: 'category', label: 'Category', type: 'select', options: meta?.event_categories ?? ['other'] },
            { key: 'starts_at', label: 'When?', type: 'datetime' },
            { key: 'location', label: 'Where / virtual?', placeholder: 'Dubai Creek Harbour' },
          ]}
          onSubmit={(values) =>
            createEvent({
              title: values.title,
              description: values.description || undefined,
              category: values.category,
              starts_at: values.starts_at,
              location: values.location || undefined,
            })
          }
        />
      )}
    </div>
  )
}
