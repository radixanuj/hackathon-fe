import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { getMeta } from '../../api/meta'
import { askQuestion, listQuestions, questionsForMe } from '../../api/questions'
import {
  addInterest,
  createOffer,
  listOffers,
  readyOffers,
  removeInterest,
  schedule,
} from '../../api/teach'
import { useAuth } from '../../auth/AuthContext'
import Avatar from '../../components/Avatar'
import FormModal from '../../components/FormModal'
import QuestionModal from '../../components/QuestionModal'
import { Empty, ErrorNote, SkeletonCards } from '../../components/States'
import { useToast } from '../../components/Toast'
import { personMeta, titleCase } from '../../lib/format'

const ASK_SCOPES = [
  { value: 'for_me', label: 'For me' },
  { value: 'all', label: 'Everything' },
  { value: 'open', label: 'Open' },
  { value: 'answered', label: 'Answered' },
]

const TEACH_SCOPES = [
  { value: 'all', label: 'Everything' },
  { value: 'ready', label: 'Ready to schedule' },
  { value: 'mine', label: 'Mine' },
]

/** How far an offer is towards the number of people its teacher asked for. */
const interestPercent = (offer) =>
  Math.min(100, Math.round(((offer.interested_count ?? 0) / Math.max(1, offer.min_interested ?? 1)) * 100))

/**
 * Ask Radix and Teach Radix — the two halves of the same idea. You don't need
 * to know who can help; and you don't need a date before you know anyone cares.
 */
export default function AskTeachTab() {
  const { user } = useAuth()
  const say = useToast()
  const queryClient = useQueryClient()

  const [askScope, setAskScope] = useState('for_me')
  const [search, setSearch] = useState('')
  const [asking, setAsking] = useState(false)
  const [openQuestion, setOpenQuestion] = useState(null)

  const [teachScope, setTeachScope] = useState('all')
  const [format, setFormat] = useState('')
  const [level, setLevel] = useState('')
  const [offering, setOffering] = useState(false)
  const [scheduling, setScheduling] = useState(null)

  const { data: meta } = useQuery({ queryKey: ['meta'], queryFn: getMeta })

  const { data: questions, isPending: questionsPending, error: questionsError } = useQuery({
    queryKey: ['questions', { askScope, search }],
    queryFn: () => {
      const params = { q: search || undefined, per_page: 24 }
      if (askScope === 'for_me') return questionsForMe(params)
      if (askScope === 'all') return listQuestions(params)
      return listQuestions({ ...params, status: askScope })
    },
  })

  const offerParams = {
    format: format || undefined,
    level: level || undefined,
    user_id: teachScope === 'mine' ? user?.id : undefined,
    per_page: 24,
  }

  const { data: offers, isPending: offersPending, error: offersError } = useQuery({
    queryKey: ['teach-offers', { teachScope, format, level, userId: user?.id }],
    queryFn: () => (teachScope === 'ready' ? readyOffers(offerParams) : listOffers(offerParams)),
  })

  const refreshOffers = () => queryClient.invalidateQueries({ queryKey: ['teach-offers'] })

  const interest = useMutation({
    mutationFn: ({ id, isInterested }) => (isInterested ? removeInterest(id) : addInterest(id)),
    onSuccess: (_, variables) => {
      refreshOffers()
      say(variables.isInterested ? 'Taken off the list.' : "Noted. You'll be RSVP'd the moment it gets a date.")
    },
    onError: (caught) => say(caught.message),
  })

  const questionItems = questions?.items ?? []
  const offerItems = offers?.items ?? []

  return (
    <div className="mt-8 animate-rise">
      {/* --- Ask Radix ----------------------------------------------------- */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-[520px]">
          <h2 className="rx-title m-0 text-[30px] font-bold tracking-[-.028em]">Ask Radix</h2>
          <p className="m-0 mt-1.5 text-[17px] leading-[1.45] text-muted">
            You don't have to know who can help. Tag the question and it finds them — they can write
            an answer, or just offer to talk it through.
          </p>
        </div>
        <button onClick={() => setAsking(true)} className="rx-btn rx-btn-dark rx-btn-lg">
          Ask Radix
        </button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-[9px]">
        {ASK_SCOPES.map((scope) => (
          <button
            key={scope.value}
            onClick={() => setAskScope(scope.value)}
            className={`rx-group ${askScope === scope.value ? 'rx-group-on' : ''}`}
          >
            {scope.label}
          </button>
        ))}
        <input
          className="rx-input ml-auto max-w-[280px] rounded-full px-[18px] py-3 text-[15.5px]"
          placeholder="Search questions…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {askScope === 'for_me' && (
        <p className="m-0 mt-3 text-[15.5px] text-acc-ink">
          Open questions tagged with something you said you can talk about or help with.
        </p>
      )}

      <ErrorNote error={questionsError} className="mt-5" />

      <div className="mt-[22px]">
        {questionsPending ? (
          <SkeletonCards count={4} height={210} />
        ) : questionItems.length === 0 ? (
          askScope === 'for_me' ? (
            <Empty
              title="Nothing is waiting on you."
              hint="Add a few more things to “can talk about” on your profile and questions will start finding you."
            />
          ) : (
            <Empty title="No questions here." hint="Ask the one you've been quietly googling." />
          )
        ) : (
          <div className="grid gap-[18px] [grid-template-columns:repeat(auto-fill,minmax(310px,1fr))]">
            {questionItems.map((question) => {
              const isMine = question.user?.id === user?.id
              return (
                <article
                  key={question.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setOpenQuestion(question.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setOpenQuestion(question.id)
                    }
                  }}
                  className="rx-card rx-card-lift animate-rise cursor-pointer rounded-tile p-6 text-left"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rx-eyebrow">{titleCase(question.status)}</span>
                    {question.matches_my_profile && (
                      <span className="rx-chip rx-chip-tint py-1.5 text-[13px]">Matches your profile</span>
                    )}
                    {isMine && <span className="rx-chip rx-chip-sand py-1.5 text-[13px]">Yours</span>}
                  </div>

                  <h3 className="rx-title m-0 mt-3 text-[21px] leading-[1.16]">{question.title}</h3>

                  <div className="mt-4 flex items-center gap-2.5">
                    <Avatar person={question.user} size={34} radius={11} />
                    <p className="m-0 min-w-0 truncate text-[14.5px] text-muted">
                      {isMine ? 'You' : question.user?.name}
                      {personMeta(question.user) ? ` · ${personMeta(question.user)}` : ''}
                    </p>
                  </div>

                  {(question.tags ?? []).length > 0 && (
                    <div className="mt-3.5 flex flex-wrap gap-1.5">
                      {question.tags.slice(0, 4).map((tag) => (
                        <span key={tag.id} className="rx-chip rx-chip-outline py-1.5 text-[13px]">
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-[18px] flex flex-wrap items-center gap-3 border-t border-line pt-3.5">
                    <p className="m-0 text-[14.5px] text-muted">
                      {question.answers_count ?? 0} answer{question.answers_count === 1 ? '' : 's'}
                    </p>
                    <p className="m-0 text-[14.5px] font-bold text-acc-ink">
                      {question.volunteers_count ?? 0} offering to talk
                    </p>
                    {question.i_volunteered && (
                      <p className="m-0 ml-auto text-[14px] font-bold text-acc-ink">You're in ✓</p>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

      {/* --- Teach Radix --------------------------------------------------- */}
      <div className="mt-[54px] flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-[520px]">
          <h2 className="rx-title m-0 text-[30px] font-bold tracking-[-.028em]">Teach Radix</h2>
          <p className="m-0 mt-1.5 text-[17px] leading-[1.45] text-muted">
            Float the session first. Find out whether anyone wants it before you go looking for a room
            and a Thursday.
          </p>
        </div>
        <button onClick={() => setOffering(true)} className="rx-btn rx-btn-dark rx-btn-lg">
          Offer to teach something
        </button>
      </div>

      <div className="mt-5 flex flex-wrap gap-[9px]">
        {TEACH_SCOPES.map((scope) => (
          <button
            key={scope.value}
            onClick={() => setTeachScope(scope.value)}
            className={`rx-group ${teachScope === scope.value ? 'rx-group-on' : ''}`}
          >
            {scope.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rx-eyebrow">Format</span>
          <button onClick={() => setFormat('')} className={`rx-pill ${format === '' ? 'rx-pill-on' : ''}`}>
            Any
          </button>
          {(meta?.teach_formats ?? []).map((value) => (
            <button
              key={value}
              onClick={() => setFormat(value)}
              className={`rx-pill ${format === value ? 'rx-pill-on' : ''}`}
            >
              {titleCase(value)}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rx-eyebrow">Level</span>
          <button onClick={() => setLevel('')} className={`rx-pill ${level === '' ? 'rx-pill-on' : ''}`}>
            Any
          </button>
          {(meta?.teach_levels ?? []).map((value) => (
            <button
              key={value}
              onClick={() => setLevel(value)}
              className={`rx-pill ${level === value ? 'rx-pill-on' : ''}`}
            >
              {titleCase(value)}
            </button>
          ))}
        </div>
      </div>

      <ErrorNote error={offersError} className="mt-5" />

      <div className="mt-[22px]">
        {offersPending ? (
          <SkeletonCards count={3} height={280} />
        ) : offerItems.length === 0 ? (
          teachScope === 'ready' ? (
            <Empty
              title="Nothing is over the line yet."
              hint="Offers show up here the moment enough people say they'd come."
            />
          ) : teachScope === 'mine' ? (
            <Empty title="You haven't offered anything." hint="The thing you explain twice a week counts." />
          ) : (
            <Empty title="Nobody is teaching anything yet." hint="Go first. It's how the rest start." />
          )
        ) : (
          <div className="grid gap-[18px] [grid-template-columns:repeat(auto-fill,minmax(320px,1fr))]">
            {offerItems.map((offer) => {
              const isMine = offer.user?.id === user?.id
              const isLive = offer.status === 'open' || offer.status === 'scheduled'
              const short = Math.max(0, (offer.min_interested ?? 0) - (offer.interested_count ?? 0))
              return (
                <article key={offer.id} className="rx-card rx-card-lift animate-rise rounded-tile p-[26px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rx-eyebrow">
                      {titleCase(offer.format)}
                      {offer.level ? ` · ${titleCase(offer.level)}` : ''}
                      {offer.duration_minutes ? ` · ${offer.duration_minutes} min` : ''}
                    </span>
                    {isMine && <span className="rx-chip rx-chip-sand py-1.5 text-[13px]">Yours</span>}
                  </div>

                  <h3 className="rx-title m-0 mt-2.5 text-[22px] leading-[1.14]">{offer.title}</h3>

                  {offer.description && (
                    <p className="m-0 mt-2.5 line-clamp-3 text-[15.5px] leading-[1.5] text-muted">
                      {offer.description}
                    </p>
                  )}

                  <div className="mt-4 flex items-center gap-2.5">
                    <Avatar person={offer.user} size={34} radius={11} />
                    <p className="m-0 min-w-0 truncate text-[14.5px] text-muted">
                      {isMine ? 'You' : offer.user?.name}
                      {personMeta(offer.user) ? ` · ${personMeta(offer.user)}` : ''}
                    </p>
                  </div>

                  {(offer.tag?.name || offer.preferred_times) && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {offer.tag?.name && (
                        <span className="rx-chip rx-chip-outline py-1.5 text-[13px]">{offer.tag.name}</span>
                      )}
                      {offer.preferred_times && (
                        <span className="rx-chip rx-chip-sand py-1.5 text-[13px]">{offer.preferred_times}</span>
                      )}
                    </div>
                  )}

                  {/* The whole point: does anyone want this yet? */}
                  <div className="mt-[18px]">
                    <div className="flex items-end justify-between gap-3">
                      <p
                        className={`m-0 text-[15px] font-bold ${
                          offer.has_enough_interest ? 'text-acc-ink' : 'text-muted'
                        }`}
                      >
                        {offer.has_enough_interest
                          ? 'Enough people want this'
                          : `${short} more and it's on`}
                      </p>
                      <p className="m-0 text-[14.5px] text-faint">
                        {offer.interested_count ?? 0} / {offer.min_interested ?? 1}
                      </p>
                    </div>
                    <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#EDE8E0]">
                      <div
                        className="h-full rounded-full bg-acc transition-[width] duration-700 ease-[cubic-bezier(.2,.9,.3,1)]"
                        style={{ width: `${interestPercent(offer)}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-[18px] flex flex-wrap items-center gap-2.5">
                    {offer.status === 'scheduled' ? (
                      <p className="m-0 text-[15px] font-bold text-acc-ink">
                        Scheduled — it's an event now.
                      </p>
                    ) : offer.status === 'cancelled' || offer.status === 'delivered' ? (
                      <p className="m-0 text-[15px] text-faint">{titleCase(offer.status)}.</p>
                    ) : null}

                    {isMine ? (
                      offer.has_enough_interest && offer.status === 'open' ? (
                        <button
                          onClick={() => setScheduling(offer)}
                          className="rx-btn rx-btn-acc min-h-[44px] px-4 text-[15px]"
                        >
                          Schedule it
                        </button>
                      ) : offer.status === 'open' ? (
                        <p className="m-0 text-[15px] text-muted">
                          Waiting on {short} more {short === 1 ? 'person' : 'people'} before you pick a date.
                        </p>
                      ) : null
                    ) : (
                      isLive && (
                        <button
                          onClick={() => interest.mutate({ id: offer.id, isInterested: offer.im_interested })}
                          disabled={interest.isPending}
                          className={`rx-btn min-h-[44px] px-4 text-[15px] ${
                            offer.im_interested ? 'rx-btn-ghost' : 'rx-btn-acc'
                          }`}
                        >
                          {offer.im_interested ? "You're in ✓" : "I'd come to this"}
                        </button>
                      )
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

      {openQuestion && (
        <QuestionModal questionId={openQuestion} onClose={() => setOpenQuestion(null)} />
      )}

      {asking && (
        <FormModal
          title="Ask Radix"
          intent="Tag it and the right people find it. You don't need to know who they are."
          submitLabel="Put it out there"
          onClose={() => setAsking(false)}
          onDone={() => {
            queryClient.invalidateQueries({ queryKey: ['questions'] })
            say("Asked. It's on its way to whoever has done this before.")
          }}
          fields={[
            {
              key: 'title',
              label: 'What do you need to know?',
              placeholder: 'How do we handle refunds for annual plans?',
            },
            {
              key: 'body',
              label: 'Any context?',
              type: 'textarea',
              placeholder: 'What you have already tried, and what you actually need to decide.',
            },
            {
              key: 'tags',
              label: 'Tags',
              placeholder: 'billing, pricing, support — up to six, comma separated',
            },
          ]}
          onSubmit={(values) => {
            const tags = values.tags
              .split(',')
              .map((tag) => tag.trim())
              .filter(Boolean)
              .slice(0, 6)
            return askQuestion({
              title: values.title,
              body: values.body || undefined,
              tags: tags.length ? tags : undefined,
            })
          }}
        />
      )}

      {offering && (
        <FormModal
          title="Offer to teach something"
          intent="No date yet. Just say what you'd run and see who puts their hand up."
          submitLabel="Float it"
          onClose={() => setOffering(false)}
          onDone={() => {
            refreshOffers()
            say("It's up. You'll hear when enough people want it.")
          }}
          fields={[
            { key: 'title', label: 'What would you teach?', placeholder: 'Reading a flame graph without panicking' },
            {
              key: 'description',
              label: 'What would people walk out knowing?',
              type: 'textarea',
              placeholder: 'Who it is for, and the one thing they will be able to do afterwards.',
            },
            { key: 'format', label: 'Format', type: 'select', options: meta?.teach_formats ?? ['session'] },
            { key: 'level', label: 'Level', type: 'select', options: meta?.teach_levels ?? ['any'] },
            { key: 'duration_minutes', label: 'How long? (minutes)', placeholder: '60', initial: '60' },
            { key: 'min_interested', label: 'Run it once this many people are in', placeholder: '3', initial: '3' },
            { key: 'preferred_times', label: 'When suits you?', placeholder: 'Thursday afternoons' },
            { key: 'topic', label: 'Topic', placeholder: 'observability' },
          ]}
          onSubmit={(values) =>
            createOffer({
              title: values.title,
              description: values.description || undefined,
              format: values.format,
              level: values.level || undefined,
              duration_minutes: Number(values.duration_minutes) || undefined,
              min_interested: Number(values.min_interested) || undefined,
              preferred_times: values.preferred_times || undefined,
              topic: values.topic || undefined,
            })
          }
        />
      )}

      {scheduling && (
        <FormModal
          title="Put a date on it"
          intent={`${scheduling.interested_count} people are already in. Scheduling this turns it into an event and RSVPs every one of them.`}
          submitLabel="Schedule it"
          onClose={() => setScheduling(null)}
          onDone={(event) => {
            refreshOffers()
            queryClient.invalidateQueries({ queryKey: ['events'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard'] })
            say(`“${event?.title ?? scheduling.title}” is now an event — everyone interested is RSVP'd.`)
          }}
          fields={[
            { key: 'starts_at', label: 'When?', type: 'datetime' },
            { key: 'location', label: 'Where?', placeholder: 'Mumbai · Room 4' },
            { key: 'link', label: 'Or a link', placeholder: 'https://…' },
            { key: 'capacity', label: 'Cap the room at', placeholder: 'Leave blank for no limit' },
          ]}
          onSubmit={(values) =>
            schedule(scheduling.id, {
              starts_at: values.starts_at,
              location: values.location || undefined,
              link: values.link || undefined,
              capacity: Number(values.capacity) || undefined,
            })
          }
        />
      )}
    </div>
  )
}
