import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { createInvite, join, leave, listInvites } from '../../api/coffee'
import { getMeta } from '../../api/meta'
import { useAuth } from '../../auth/AuthContext'
import Avatar from '../../components/Avatar'
import FormModal from '../../components/FormModal'
import { useOverlays } from '../../components/Overlays'
import { Empty, ErrorNote, SkeletonCards } from '../../components/States'
import { useToast } from '../../components/Toast'
import { eventWhen, personMeta, titleCase } from '../../lib/format'

const SCOPES = [
  ['open', 'Open now'],
  ['mine', 'Mine'],
  ['past', 'Past'],
  ['all', 'Everything'],
]

const KIND_EMOJI = { coffee: '☕', lunch: '🍝', walk: '🚶' }
const kindEmoji = (kind) => KIND_EMOJI[kind] ?? '☕'

const firstName = (name) => String(name ?? '').split(' ')[0]

/**
 * Deliberately lighter than an Event: a time, a place and a couple of seats.
 * `capacity` counts guest seats — the host is never one of them.
 */
export default function CoffeePanel() {
  const say = useToast()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { openProfile } = useOverlays()

  const [scope, setScope] = useState('open')
  const [kind, setKind] = useState(null)
  const [starting, setStarting] = useState(false)

  const { data: meta } = useQuery({ queryKey: ['meta'], queryFn: getMeta })
  const { data, isPending, error } = useQuery({
    queryKey: ['coffee-invites', { scope, kind }],
    queryFn: () => listInvites({ scope, kind: kind ?? undefined, per_page: 50 }),
  })

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['coffee-invites'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const seat = useMutation({
    mutationFn: ({ id, joined }) => (joined ? leave(id) : join(id)),
    onSuccess: (_, variables) => {
      refresh()
      say(variables.joined ? 'Left. The seat is free again.' : "You're in. The host can see you're coming.")
    },
    onError: (caught) => say(caught.message),
  })

  const kinds = meta?.coffee_invite_kinds ?? []
  const invites = data?.items ?? []

  return (
    <section className="mt-16 animate-rise">
      <div className="flex flex-wrap items-end justify-between gap-[18px]">
        <div>
          <p className="rx-eyebrow m-0">Open invites</p>
          <h2 className="rx-display m-0 mt-2 max-w-[520px] text-[clamp(28px,3.6vw,42px)] leading-[1.02] tracking-[-.032em]">
            A coffee, a lunch, a walk
          </h2>
        </div>
        <button onClick={() => setStarting(true)} className="rx-btn rx-btn-dark rx-btn-lg">
          Start one
        </button>
      </div>

      <p className="m-0 mt-3 max-w-[560px] text-[18.5px] text-muted">
        Not an event. Two or three seats, a time and somewhere to be. Say you're going and turn up.
      </p>

      <div className="mt-5 flex flex-wrap gap-[9px]">
        {SCOPES.map(([value, label]) => (
          <button
            key={value}
            onClick={() => setScope(value)}
            className={`rx-group ${scope === value ? 'rx-group-on' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>

      {kinds.length > 0 && (
        <div className="mt-[14px] flex flex-wrap gap-[9px]">
          <button onClick={() => setKind(null)} className={`rx-pill ${kind === null ? 'rx-pill-on' : ''}`}>
            Anything
          </button>
          {kinds.map((value) => (
            <button
              key={value}
              onClick={() => setKind(kind === value ? null : value)}
              className={`rx-pill ${kind === value ? 'rx-pill-on' : ''}`}
            >
              {kindEmoji(value)} {titleCase(value)}
            </button>
          ))}
        </div>
      )}

      <ErrorNote error={error} className="mt-6" />

      <div className="mt-[26px]">
        {isPending ? (
          <SkeletonCards count={3} height={240} />
        ) : invites.length === 0 ? (
          <Empty
            title={
              scope === 'mine'
                ? "You haven't joined or started one yet."
                : scope === 'past'
                  ? 'Nothing has happened yet.'
                  : 'No open invites right now.'
            }
            hint="Put a time and a table out there. Three seats is plenty."
          />
        ) : (
          <div className="grid gap-[18px] [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
            {invites.map((invite) => {
              const isHost = invite.host?.id === user?.id
              const isPast = invite.starts_at ? new Date(invite.starts_at) < new Date() : false
              const cancelled = invite.status === 'cancelled'
              const closed = isPast || cancelled
              return (
                <article
                  key={invite.id}
                  className="rx-card rx-card-lift animate-rise flex flex-col rounded-tile p-[26px] hover:rotate-[.5deg]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[34px] leading-none">{kindEmoji(invite.kind)}</span>
                    <span className={`rx-chip px-3 py-1.5 text-[13.5px] ${invite.is_full || closed ? 'rx-chip-outline' : 'rx-chip-tint'}`}>
                      {cancelled
                        ? 'Called off'
                        : invite.is_full
                          ? 'Seats taken'
                          : `${invite.seats_left} of ${invite.capacity} seats`}
                    </span>
                  </div>

                  <h3 className="rx-title m-0 mt-4 text-[22px]">
                    {titleCase(invite.kind)} with {isHost ? 'you' : firstName(invite.host?.name)}
                  </h3>
                  <p className="m-0 mt-2 text-[15.5px] text-muted">{eventWhen(invite)}</p>
                  {invite.note && (
                    <p className="m-0 mt-3 line-clamp-3 text-[16px] leading-[1.45]">{invite.note}</p>
                  )}

                  <div className="my-5 flex items-center gap-3">
                    <Avatar person={invite.host} size={38} radius={12} />
                    <button onClick={() => openProfile(invite.host?.id)} className="rx-link text-[15px]">
                      {invite.host?.name}
                    </button>
                    <p className="m-0 ml-auto truncate text-[14.5px] text-muted">{personMeta(invite.host)}</p>
                  </div>

                  <div className="mt-auto">
                    {invite.has_joined ? (
                      <div className="flex animate-pop items-center gap-[10px] rounded-[14px] bg-tint px-[18px] py-[13px] text-[15.5px] font-bold text-acc-ink">
                        <span className="grid h-[22px] w-[22px] place-items-center rounded-full bg-acc text-[13px] text-on-acc">✓</span>
                        You're in
                        {!closed && (
                          <button
                            onClick={() => seat.mutate({ id: invite.id, joined: true })}
                            disabled={seat.isPending}
                            className="ml-auto cursor-pointer border-none bg-transparent text-[14px] font-semibold text-muted underline"
                          >
                            Can't make it
                          </button>
                        )}
                      </div>
                    ) : isHost ? (
                      <p className="m-0 text-[15.5px] font-semibold text-muted">
                        Yours. {invite.joins_count === 0
                          ? 'Nobody has said yes yet.'
                          : `${invite.joins_count} ${invite.joins_count === 1 ? 'person is' : 'people are'} coming.`}
                      </p>
                    ) : cancelled ? (
                      <p className="m-0 text-[15.5px] font-semibold text-muted">The host called this one off.</p>
                    ) : isPast ? (
                      <p className="m-0 text-[15.5px] font-semibold text-muted">This one has been and gone.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => seat.mutate({ id: invite.id, joined: false })}
                          disabled={seat.isPending || invite.is_full}
                          className="rx-btn rx-btn-acc flex-1 rounded-[14px]"
                        >
                          {invite.is_full ? 'All seats taken' : "I'll come"}
                        </button>
                        {invite.link && (
                          <a
                            href={invite.link}
                            target="_blank"
                            rel="noreferrer"
                            className="rx-btn rx-btn-ghost rounded-[14px] px-4 no-underline"
                          >
                            Link
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

      {starting && (
        <FormModal
          title="Start one"
          intent="A time, a place, a couple of seats. That's the whole thing."
          submitLabel="Put it out there"
          onClose={() => setStarting(false)}
          onDone={() => {
            refresh()
            say("It's out there. Someone will take a seat.")
          }}
          fields={[
            { key: 'kind', label: 'What is it?', type: 'select', options: kinds.length ? kinds : ['coffee'] },
            { key: 'starts_at', label: 'When?', type: 'datetime' },
            { key: 'note', label: 'Anything to say?', type: 'textarea', placeholder: 'Flat white and nothing work-related.' },
            { key: 'where', label: 'In person or virtual?', type: 'select', options: ['in person', 'virtual'] },
            { key: 'location', label: 'Where?', placeholder: 'The cafe on the ground floor' },
            { key: 'link', label: 'Call link, if virtual', placeholder: 'https://…' },
            { key: 'capacity', label: 'Seats for guests', type: 'select', options: ['1', '2', '3', '4', '6'], initial: '3' },
          ]}
          onSubmit={(values) =>
            createInvite({
              kind: values.kind,
              starts_at: values.starts_at,
              note: values.note || undefined,
              is_virtual: values.where === 'virtual',
              location: values.location || undefined,
              link: values.link || undefined,
              capacity: Number(values.capacity),
            })
          }
        />
      )}
    </section>
  )
}
