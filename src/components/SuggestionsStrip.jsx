import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { dismiss, listSuggestions, undismiss } from '../api/suggestions'
import { personMeta, tenureLabel } from '../lib/format'
import Avatar from './Avatar'
import { useOverlays } from './Overlays'
import { Empty, ErrorNote, SkeletonCards } from './States'
import { useToast } from './Toast'

const firstName = (person) => person?.name?.split(' ')[0] ?? 'They'

/**
 * "Who should I meet?" — the server ranks on shared interests, complementary
 * knowledge and, above all, on not having met yet. The reasons are the whole
 * point of the feature, so they get the room on the card; the buttons are the
 * small part underneath.
 */
export default function SuggestionsStrip({ limit = 3, title }) {
  const say = useToast()
  const queryClient = useQueryClient()
  const { openProfile, openRequest } = useOverlays()

  // "Not right now" is a real write, but the card should go the moment it's
  // clicked — and come straight back if it was a misclick.
  const [hidden, setHidden] = useState([])
  const [undoable, setUndoable] = useState(null)

  const { data, isPending, error } = useQuery({
    queryKey: ['suggestions', { limit }],
    queryFn: () => listSuggestions(limit),
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['suggestions'] })

  const notNow = useMutation({
    mutationFn: (person) => dismiss(person.id),
    onMutate: (person) => {
      setHidden((current) => [...current, person.id])
      setUndoable(person)
    },
    onSuccess: (_, person) => {
      refresh()
      say(`${firstName(person)} won't come up again — unless you say otherwise.`)
    },
    onError: (caught, person) => {
      setHidden((current) => current.filter((id) => id !== person.id))
      setUndoable(null)
      say(caught.message)
    },
  })

  const bringBack = useMutation({
    mutationFn: (person) => undismiss(person.id),
    onSuccess: (_, person) => {
      setHidden((current) => current.filter((id) => id !== person.id))
      setUndoable(null)
      refresh()
      say(`${firstName(person)} is back in the mix.`)
    },
    onError: (caught) => say(caught.message),
  })

  const suggestions = (data ?? []).filter((item) => !hidden.includes(item.person?.id))

  return (
    <section className="animate-rise">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="rx-eyebrow m-0 mb-2">Who should I meet?</p>
          <h2 className="rx-title m-0 max-w-[520px] text-[30px] font-bold tracking-[-.028em]">
            {title ?? "People you probably haven't met"}
          </h2>
        </div>
        <p className="m-0 max-w-[360px] text-[15.5px] leading-[1.45] text-muted">
          Picked on what you have in common, what you could learn from each other, and on not
          having crossed paths yet.
        </p>
      </div>

      <ErrorNote error={error} className="mt-6" />

      <div className="mt-[22px]">
        {isPending ? (
          <SkeletonCards count={limit} height={320} />
        ) : suggestions.length === 0 ? (
          hidden.length > 0 ? (
            <Empty
              title="That's the lot, for now."
              hint="New joiners and new tags will fill this back up. Nobody is gone for good."
            />
          ) : (
            <Empty
              title="You've met everyone we'd think to suggest."
              hint="Genuinely impressive. Add what you'd like to learn on your profile and we'll keep looking."
            />
          )
        ) : (
          <div className="grid gap-[18px] [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
            {suggestions.map(({ person, reasons, previously_connected }) => (
              <article
                key={person.id}
                className="rx-card rx-card-lift animate-rise flex min-w-0 flex-col rounded-tile p-[26px] hover:rotate-[-.4deg]"
              >
                <div className="flex items-start gap-4">
                  <Avatar person={person} size={64} radius={19} />
                  <div className="min-w-0">
                    <h3 className="rx-title m-0 text-[23px] font-bold">{person.name}</h3>
                    {personMeta(person) && (
                      <p className="m-0 mt-1 text-[15px] text-muted">{personMeta(person)}</p>
                    )}
                    {tenureLabel(person) && (
                      <p className="m-0 mt-0.5 text-[14.5px] text-faint">{tenureLabel(person)}</p>
                    )}
                  </div>
                </div>

                {previously_connected && (
                  <span className="rx-chip rx-chip-sand mt-4 self-start px-[13px] py-[7px] text-[13px] font-semibold text-faint">
                    You've met before
                  </span>
                )}

                {/* The reasons, not the buttons, are why this card exists. */}
                <ul className="m-0 mt-5 flex list-none flex-col gap-[11px] p-0">
                  {(reasons ?? []).map((reason) => (
                    <li key={reason} className="flex items-start gap-[10px] text-[16px] leading-[1.4]">
                      <span className="mt-[8px] h-[7px] w-[7px] flex-none rounded-full bg-acc" />
                      {reason}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-6">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => openRequest(person, reasons?.[0] ?? 'A first conversation')}
                      className="rx-btn rx-btn-acc flex-1 rounded-[14px]"
                    >
                      Ask for 30 minutes
                    </button>
                    <button
                      onClick={() => openProfile(person.id)}
                      className="rx-btn rx-btn-ghost rounded-[14px] px-4"
                    >
                      View profile
                    </button>
                  </div>
                  <button
                    onClick={() => notNow.mutate(person)}
                    disabled={notNow.isPending}
                    className="mt-3 cursor-pointer border-none bg-transparent p-0 text-[14.5px] font-semibold text-faint underline"
                  >
                    Not right now
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* The toast can't hold a button, so the way back lives here. */}
      {undoable && hidden.includes(undoable.id) && (
        <div className="mt-4 flex animate-fade flex-wrap items-center gap-3 rounded-[14px] bg-sand px-[18px] py-[13px] text-[15px] text-muted">
          <span>{undoable.name} won't be suggested again.</span>
          <button
            onClick={() => bringBack.mutate(undoable)}
            disabled={bringBack.isPending}
            className="rx-link"
          >
            {bringBack.isPending ? 'Undoing…' : 'Undo that'}
          </button>
        </div>
      )}
    </section>
  )
}
