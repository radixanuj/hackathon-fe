import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { addInterest, convertToEvent, createInvite, listInvites, removeInterest } from '../../api/openInvites'
import { getMeta } from '../../api/meta'
import { useAuth } from '../../auth/AuthContext'
import FormModal from '../../components/FormModal'
import { Empty, ErrorNote, SkeletonCards } from '../../components/States'
import { useToast } from '../../components/Toast'
import { eventEmoji, eventWhen } from '../../lib/format'

// The API defaults to open invites and takes one status at a time, so a view
// that wants the closed and converted ones asks for each and merges.
const ALL_STATUSES = ['open', 'converted', 'closed']

const SCOPES = [
  { value: 'open', label: 'Still open' },
  { value: 'mine', label: 'Mine' },
  { value: 'all', label: 'Everything' },
]

/**
 * Open Invites — an idea with no date and no logistics, floated to see who
 * bites. Enough hands up and the author turns it into a real event.
 */
export default function OpenInvitesSection() {
  const say = useToast()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [scope, setScope] = useState('open')
  const [search, setSearch] = useState('')
  const [floating, setFloating] = useState(false)
  const [converting, setConverting] = useState(null)

  const { data: meta } = useQuery({ queryKey: ['meta'], queryFn: getMeta })

  const statuses = scope === 'open' ? ['open'] : ALL_STATUSES
  const results = useQueries({
    queries: statuses.map((status) => ({
      queryKey: ['open-invites', { status, mine: scope === 'mine', q: search }],
      queryFn: () =>
        listInvites({
          status,
          mine: scope === 'mine' || undefined,
          q: search || undefined,
          per_page: 50,
        }),
    })),
  })

  const isPending = results.some((result) => result.isPending)
  const error = results.find((result) => result.error)?.error

  // Each status comes back sorted by interest; merging them means sorting once more.
  const invites = results
    .flatMap((result) => result.data?.items ?? [])
    .sort((a, b) => b.interested_count - a.interested_count || b.id - a.id)

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['open-invites'] })

  const interest = useMutation({
    mutationFn: ({ id, interested }) => (interested ? removeInterest(id) : addInterest(id)),
    onSuccess: (_, variables) => {
      refresh()
      say(variables.interested ? 'Taken off the list.' : "You're counted. One more voice for it.")
    },
    onError: (caught) => say(caught.message),
  })

  return (
    <div className="mt-8 animate-rise">
      <div className="flex flex-wrap items-end justify-between gap-[18px]">
        <div className="max-w-[520px]">
          <h2 className="rx-display m-0 text-[clamp(28px,3.6vw,42px)] leading-[1.02] tracking-[-.032em]">
            Anyone interested?
          </h2>
          <p className="m-0 mt-3 text-[17px] leading-[1.5] text-muted">
            No date, no venue, no plan. Float the idea, see who puts their hand up, and only then
            work out the details. Enough interest and it becomes a real event.
          </p>
        </div>
        <button onClick={() => setFloating(true)} className="rx-btn rx-btn-dark rx-btn-lg">
          Float an idea
        </button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-[9px]">
        {SCOPES.map((option) => (
          <button
            key={option.value}
            onClick={() => setScope(option.value)}
            className={`rx-group ${scope === option.value ? 'rx-group-on' : ''}`}
          >
            {option.label}
          </button>
        ))}
        <input
          className="rx-input ml-auto max-w-[320px] rounded-[16px] px-[18px] py-[11px] text-[16px]"
          placeholder="Search the ideas…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <ErrorNote error={error} className="mt-6" />

      <div className="mt-[26px]">
        {isPending ? (
          <SkeletonCards count={6} height={260} />
        ) : invites.length === 0 ? (
          search ? (
            <Empty title="Nothing matches that." hint="Try fewer words — or float the idea yourself." />
          ) : scope === 'mine' ? (
            <Empty
              title="You haven't floated anything, and you're not in on anyone else's."
              hint="Say the thing you've been meaning to do. Someone else has been meaning to do it too."
            />
          ) : (
            <Empty
              title="No ideas floating right now."
              hint="Costs nothing to start one. You don't even need a date."
            />
          )
        ) : (
          <div className="grid gap-[18px] [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
            {invites.map((invite) => {
              const mine = invite.user?.id === user?.id
              return (
                <article
                  key={invite.id}
                  className="rx-card rx-card-lift animate-rise flex min-w-0 flex-col rounded-tile p-[26px] hover:rotate-[.4deg]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-[34px] leading-none">{eventEmoji(invite.category)}</span>
                    {/* The count is the headline: this is a show of hands. */}
                    <div className="grid flex-none place-items-center rounded-[16px] bg-tint px-[17px] py-[10px] text-acc-ink">
                      <span className="rx-display text-[28px] leading-none">{invite.interested_count}</span>
                      <span className="mt-[5px] text-[11px] font-bold tracking-[.13em] uppercase">
                        interested
                      </span>
                    </div>
                  </div>

                  <h3 className="rx-title m-0 mt-4 text-2xl">{invite.title}</h3>
                  {invite.description && (
                    <p className="m-0 mt-2 line-clamp-3 text-[15.5px] leading-[1.45] text-muted">
                      {invite.description}
                    </p>
                  )}

                  {(invite.rough_timing || invite.location) && (
                    <div className="mt-[14px] flex flex-wrap gap-2">
                      {invite.rough_timing && (
                        <span className="rx-chip rx-chip-sand text-[14px]">🕗 {invite.rough_timing}</span>
                      )}
                      {invite.location && (
                        <span className="rx-chip rx-chip-sand text-[14px]">📍 {invite.location}</span>
                      )}
                    </div>
                  )}

                  <p className="m-0 mt-[14px] text-[15px] text-muted">
                    Floated by {mine ? 'you' : (invite.user?.name ?? 'someone here')}
                    {invite.status === 'closed' && ' · called off'}
                  </p>

                  <div className="mt-auto pt-5">
                    {invite.status === 'converted' ? (
                      <div className="flex flex-wrap items-center gap-[10px] rounded-[14px] bg-tint px-[18px] py-[13px] text-[15.5px] font-bold text-acc-ink">
                        <span className="grid h-[22px] w-[22px] flex-none place-items-center rounded-full bg-acc text-[13px] text-on-acc">
                          ✓
                        </span>
                        <span className="min-w-0">
                          It happened — this is an event now
                          {invite.event && eventWhen(invite.event) ? (
                            <span className="block text-[14.5px] font-semibold opacity-80">
                              {eventWhen(invite.event)}
                            </span>
                          ) : null}
                        </span>
                      </div>
                    ) : invite.status === 'open' ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() =>
                            interest.mutate({ id: invite.id, interested: invite.im_interested })
                          }
                          disabled={interest.isPending}
                          className={`rx-btn flex-1 rounded-[14px] ${invite.im_interested ? 'rx-btn-ghost' : 'rx-btn-acc'}`}
                        >
                          {invite.im_interested ? "I'm out" : "I'm interested"}
                        </button>
                        {mine && (
                          <button
                            onClick={() => setConverting(invite)}
                            className="rx-btn rx-btn-dark rounded-[14px] px-4"
                          >
                            Make it real
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="m-0 text-[15px] text-faint">
                        Closed. Nobody can put their hand up any more.
                      </p>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

      {floating && (
        <FormModal
          title="Float an idea"
          intent="No date needed. Just the thing you'd like to do with someone."
          submitLabel="Put it out there"
          onClose={() => setFloating(false)}
          onDone={() => {
            refresh()
            say("It's up, and you're the first one interested.")
          }}
          fields={[
            { key: 'title', label: "What's the idea?", placeholder: 'A trek somewhere green' },
            {
              key: 'description',
              label: 'Any more to it?',
              type: 'textarea',
              placeholder: 'Nothing fancy. Half a day, easy pace, food after.',
            },
            {
              key: 'category',
              label: 'Category',
              type: 'select',
              options: meta?.open_invite_categories ?? ['other'],
            },
            {
              key: 'rough_timing',
              label: 'Roughly when?',
              placeholder: 'Some weekend in October',
            },
            { key: 'location', label: 'Roughly where?', placeholder: 'Somewhere outside the city' },
          ]}
          onSubmit={(values) => {
            if (!values.title.trim()) throw new Error('It needs a title, at least.')
            if (values.title.trim().length > 180) throw new Error('Keep the title under 180 characters.')
            return createInvite({
              title: values.title.trim(),
              description: values.description || undefined,
              category: values.category,
              rough_timing: values.rough_timing || undefined,
              location: values.location || undefined,
            })
          }}
        />
      )}

      {converting && (
        <FormModal
          title="Make it real"
          intent={`${converting.interested_count} ${converting.interested_count === 1 ? 'person is' : 'people are'} in. Give it a time and everyone gets RSVP'd.`}
          submitLabel="Make it an event"
          onClose={() => setConverting(null)}
          onDone={(event) => {
            setConverting(null)
            refresh()
            queryClient.invalidateQueries({ queryKey: ['events'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard'] })
            say(`"${event?.title ?? 'It'}" is a real event now — everyone interested is RSVP'd.`)
          }}
          fields={[
            { key: 'starts_at', label: 'When?', type: 'datetime' },
            { key: 'ends_at', label: 'Until? (optional)', type: 'datetime' },
            {
              key: 'location',
              label: 'Where / virtual?',
              initial: converting.location ?? '',
              placeholder: 'Dubai Creek Harbour',
            },
            { key: 'capacity', label: 'Cap the numbers? (optional)', placeholder: '20' },
          ]}
          onSubmit={(values) => {
            if (!values.starts_at) throw new Error("Pick a date and time — that's the whole point.")
            if (new Date(values.starts_at) <= new Date()) {
              throw new Error('That moment has already passed. Pick one ahead of now.')
            }
            return convertToEvent(converting.id, {
              starts_at: values.starts_at,
              ends_at: values.ends_at || undefined,
              location: values.location || undefined,
              capacity: values.capacity ? Number(values.capacity) : undefined,
            })
          }}
        />
      )}
    </div>
  )
}
