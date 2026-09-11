import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { book, cancelBooking, createSlot, listSlots, myBookings } from '../../api/officeHours'
import { useAuth } from '../../auth/AuthContext'
import Avatar from '../../components/Avatar'
import FormModal from '../../components/FormModal'
import { useOverlays } from '../../components/Overlays'
import { Empty, ErrorNote, SkeletonCards } from '../../components/States'
import { useToast } from '../../components/Toast'
import { eventWhen, personMeta } from '../../lib/format'

const SCOPES = [
  ['upcoming', 'Upcoming'],
  ['past', 'Past'],
  ['all', 'Everything'],
]

const firstName = (name) => String(name ?? '').split(' ')[0]

const slotTitle = (slot) => slot.title ?? `Office hours with ${firstName(slot.host?.name)}`

/**
 * A host publishes open slots and anyone books one. There is no accept or
 * decline step — that is what a mentoring session request is for.
 */
export default function OfficeHoursPanel() {
  const say = useToast()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { openProfile } = useOverlays()

  const [scope, setScope] = useState('upcoming')
  const [availableOnly, setAvailableOnly] = useState(false)
  const [publishing, setPublishing] = useState(false)
  // The slot being booked — booking takes an optional topic, so it goes
  // through the same create sheet as everything else.
  const [booking, setBooking] = useState(null)

  const { data, isPending, error } = useQuery({
    queryKey: ['office-hours', { scope, availableOnly }],
    queryFn: () => listSlots({ scope, available_only: availableOnly || undefined, per_page: 50 }),
  })

  const { data: mine } = useQuery({ queryKey: ['office-hour-bookings'], queryFn: () => myBookings() })

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['office-hours'] })
    queryClient.invalidateQueries({ queryKey: ['office-hour-bookings'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const drop = useMutation({
    mutationFn: (id) => cancelBooking(id),
    onSuccess: () => {
      refresh()
      say('Cancelled. The seat is back on offer.')
    },
    onError: (caught) => say(caught.message),
  })

  const slots = data?.items ?? []
  // /me/office-hour-bookings filters on status alone, with no date scope, so
  // past slots would otherwise sit here with a live Cancel button.
  const bookings = (mine?.items ?? []).filter(
    (item) => item.slot && new Date(item.slot.starts_at) >= new Date(),
  )

  return (
    <section className="mt-16 animate-rise">
      <div className="flex flex-wrap items-end justify-between gap-[18px]">
        <div>
          <p className="rx-eyebrow m-0">Office hours</p>
          <h2 className="rx-display m-0 mt-2 max-w-[520px] text-[clamp(28px,3.6vw,42px)] leading-[1.02] tracking-[-.032em]">
            Open door, fixed hour
          </h2>
        </div>
        <button onClick={() => setPublishing(true)} className="rx-btn rx-btn-dark rx-btn-lg">
          Publish a slot
        </button>
      </div>

      <p className="m-0 mt-3 max-w-[560px] text-[18.5px] text-muted">
        Somebody blocked out the time already. Take a seat — no asking, no waiting to be accepted.
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
        <button
          onClick={() => setAvailableOnly((current) => !current)}
          className={`rx-group ${availableOnly ? 'rx-group-on' : ''}`}
        >
          Available only
        </button>
      </div>

      <ErrorNote error={error} className="mt-6" />

      <div className="mt-[26px]">
        {isPending ? (
          <SkeletonCards count={3} height={260} />
        ) : slots.length === 0 ? (
          <Empty
            title={scope === 'past' ? 'No office hours have been and gone yet.' : 'Nobody has opened their door yet.'}
            hint="Publish an hour of your own. Someone always turns up."
          />
        ) : (
          <div className="grid gap-[18px] [grid-template-columns:repeat(auto-fill,minmax(320px,1fr))]">
            {slots.map((slot) => {
              const isHost = slot.host?.id === user?.id
              const isPast = slot.starts_at ? new Date(slot.starts_at) < new Date() : false
              const booked = slot.my_booking === 'booked'
              return (
                <article key={slot.id} className="rx-card rx-card-lift animate-rise flex flex-col rounded-tile p-[26px]">
                  <div className="flex items-center gap-[13px]">
                    <Avatar person={slot.host} size={50} radius={15} />
                    <div className="min-w-0">
                      <button onClick={() => openProfile(slot.host?.id)} className="rx-link text-[17px]">
                        {slot.host?.name}
                      </button>
                      <p className="m-0 mt-[2px] text-[14.5px] text-muted">{personMeta(slot.host)}</p>
                    </div>
                  </div>

                  <h3 className="rx-title m-0 mt-[18px] text-[21px]">{slotTitle(slot)}</h3>
                  <p className="m-0 mt-2 text-[15.5px] text-muted">{eventWhen(slot)}</p>
                  {slot.description && (
                    <p className="m-0 mt-2 line-clamp-3 text-[15.5px] leading-[1.45] text-muted">{slot.description}</p>
                  )}

                  <div className="mt-4 mb-5 flex flex-wrap gap-2">
                    <span className="rx-chip rx-chip-sand px-3 py-1.5 text-[13.5px]">{slot.duration_minutes} min</span>
                    <span className={`rx-chip px-3 py-1.5 text-[13.5px] ${slot.is_full ? 'rx-chip-outline' : 'rx-chip-tint'}`}>
                      {slot.is_full ? 'Fully booked' : `${slot.seats_left} of ${slot.capacity} seats left`}
                    </span>
                    {slot.link && (
                      <a
                        href={slot.link}
                        target="_blank"
                        rel="noreferrer"
                        className="rx-chip rx-chip-outline px-3 py-1.5 text-[13.5px] no-underline"
                      >
                        Call link
                      </a>
                    )}
                  </div>

                  <div className="mt-auto">
                    {booked ? (
                      <div className="flex animate-pop items-center gap-[10px] rounded-[14px] bg-tint px-[18px] py-[13px] text-[15.5px] font-bold text-acc-ink">
                        <span className="grid h-[22px] w-[22px] place-items-center rounded-full bg-acc text-[13px] text-on-acc">✓</span>
                        Seat booked
                        {!isPast && (
                          <button
                            onClick={() => drop.mutate(slot.id)}
                            disabled={drop.isPending}
                            className="ml-auto cursor-pointer border-none bg-transparent text-[14px] font-semibold text-muted underline"
                          >
                            Cancel booking
                          </button>
                        )}
                      </div>
                    ) : isHost ? (
                      <p className="m-0 text-[15.5px] font-semibold text-muted">
                        Yours. {slot.bookings_count === 0
                          ? 'Nobody has booked it yet.'
                          : `${slot.bookings_count} ${slot.bookings_count === 1 ? 'person has' : 'people have'} booked.`}
                      </p>
                    ) : isPast ? (
                      <p className="m-0 text-[15.5px] font-semibold text-muted">That hour has been and gone.</p>
                    ) : (
                      <button
                        onClick={() => setBooking(slot)}
                        disabled={slot.is_full}
                        className="rx-btn rx-btn-acc w-full rounded-[14px]"
                      >
                        {slot.is_full ? 'Fully booked' : 'Book a slot'}
                      </button>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

      {bookings.length > 0 && (
        <div className="mt-10">
          <p className="rx-eyebrow m-0 mb-[14px]">Your bookings</p>
          <div className="grid gap-[14px] [grid-template-columns:repeat(auto-fill,minmax(320px,1fr))]">
            {bookings.map((item) => (
              <article
                key={item.id}
                className="flex animate-rise items-center gap-[14px] rounded-tile bg-cream p-[18px]"
              >
                <Avatar person={item.slot.host} size={46} radius={14} />
                <div className="min-w-0 flex-1">
                  <p className="rx-title m-0 text-[18px]">{slotTitle(item.slot)}</p>
                  <p className="m-0 mt-[2px] text-[14.5px] text-muted">{eventWhen(item.slot)}</p>
                  {item.topic && <p className="m-0 mt-[3px] text-[14.5px] text-muted">On: {item.topic}</p>}
                </div>
                <button
                  onClick={() => drop.mutate(item.slot.id)}
                  disabled={drop.isPending}
                  className="rx-btn rx-btn-ghost min-h-[42px] px-4 text-[14.5px]"
                >
                  Cancel
                </button>
              </article>
            ))}
          </div>
        </div>
      )}

      {booking && (
        <FormModal
          title={`Book ${firstName(booking.host?.name)}`}
          intent={`${eventWhen(booking)} · ${booking.duration_minutes} minutes. Tell them what you'd like to cover, or don't.`}
          submitLabel="Take the seat"
          onClose={() => setBooking(null)}
          onDone={() => {
            refresh()
            say("Booked. It's in the diary — no reply needed.")
          }}
          fields={[
            { key: 'topic', label: 'What do you want to talk about?', placeholder: 'Breaking up a service that got too big' },
          ]}
          onSubmit={(values) => book(booking.id, values.topic || undefined)}
        />
      )}

      {publishing && (
        <FormModal
          title="Publish a slot"
          intent="Pick an hour you'd give away. People book it themselves."
          submitLabel="Open the door"
          onClose={() => setPublishing(false)}
          onDone={() => {
            refresh()
            say("It's up. People can book it now.")
          }}
          fields={[
            { key: 'starts_at', label: 'When?', type: 'datetime' },
            { key: 'title', label: 'Call it something', placeholder: 'Ask me about infrastructure' },
            { key: 'description', label: 'What can people bring you?', type: 'textarea', placeholder: 'Anything from a stuck deploy to a career question.' },
            { key: 'duration_minutes', label: 'How long, in minutes?', type: 'select', options: ['30', '45', '60', '90'], initial: '30' },
            { key: 'capacity', label: 'How many people can book it?', type: 'select', options: ['1', '2', '3', '4', '6'], initial: '1' },
            { key: 'location', label: 'Where?', placeholder: 'Meeting room 3, or Virtual' },
            { key: 'link', label: 'Call link', placeholder: 'https://…' },
          ]}
          onSubmit={(values) =>
            createSlot({
              starts_at: values.starts_at,
              title: values.title || undefined,
              description: values.description || undefined,
              duration_minutes: Number(values.duration_minutes),
              capacity: Number(values.capacity),
              location: values.location || undefined,
              link: values.link || undefined,
            })
          }
        />
      )}
    </section>
  )
}
