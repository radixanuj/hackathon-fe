import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { answerQuestion, askQuestion, getAma, removeUpvote, upvote } from '../api/amas'
import { useAuth } from '../auth/AuthContext'
import Avatar from './Avatar'
import Modal from './Modal'
import { ErrorNote } from './States'
import { useToast } from './Toast'
import { titleCase } from '../lib/format'

/** An AMA in full: ask, upvote, and — if you're the host — answer. */
export default function AmaModal({ amaId, onClose }) {
  const { user } = useAuth()
  const say = useToast()
  const queryClient = useQueryClient()
  const [question, setQuestion] = useState('')
  const [answers, setAnswers] = useState({})

  const { data: ama, isPending, error } = useQuery({
    queryKey: ['ama', amaId],
    queryFn: () => getAma(amaId),
  })

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['ama', amaId] })
    queryClient.invalidateQueries({ queryKey: ['amas'] })
  }

  const isHost = ama?.host?.id === user?.id
  const canAsk = ama?.status === 'open' || ama?.status === 'scheduled'

  const ask = useMutation({
    mutationFn: () => askQuestion(amaId, { body: question }),
    onSuccess: () => {
      setQuestion('')
      refresh()
      say('Asked. It goes to the top of nobody\'s inbox and straight to the host.')
    },
    onError: (caught) => say(caught.message),
  })

  const vote = useMutation({
    mutationFn: ({ id, on }) => (on ? removeUpvote(id) : upvote(id)),
    onSuccess: refresh,
    onError: (caught) => say(caught.message),
  })

  const answer = useMutation({
    mutationFn: ({ id, body }) => answerQuestion(id, { body }),
    onSuccess: (_, variables) => {
      setAnswers((current) => ({ ...current, [variables.id]: '' }))
      refresh()
      say('Answered.')
    },
    onError: (caught) => say(caught.message),
  })

  return (
    <Modal onClose={onClose} maxWidth={720} zIndex={135}>
      {isPending && <p className="py-8 text-[16.5px] text-muted">Loading…</p>}
      <ErrorNote error={error} />

      {ama && (
        <>
          <p className="m-0 text-[12.5px] font-bold tracking-[.14em] text-acc-ink uppercase">
            {titleCase(ama.format)} · {titleCase(ama.status)}
          </p>
          <h2 className="rx-display m-0 mt-2 text-[clamp(26px,3.4vw,38px)]">{ama.title}</h2>
          {ama.host && (
            <div className="mt-4 flex items-center gap-3">
              <Avatar person={ama.host} size={44} radius={13} />
              <p className="m-0 text-[16px] text-muted">
                Hosted by {ama.host.name} · {[ama.host.team, ama.host.location].filter(Boolean).join(', ')}
              </p>
            </div>
          )}
          {ama.description && <p className="m-0 mt-5 text-[17px] leading-[1.5]">{ama.description}</p>}

          {canAsk && (
            <div className="mt-7 rounded-tile bg-cream p-[22px]">
              <p className="rx-label">Ask {ama.host?.name?.split(' ')[0] ?? 'them'} anything</p>
              <textarea
                className="rx-textarea"
                placeholder="What do you actually want to know?"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
              />
              <button
                onClick={() => ask.mutate()}
                disabled={!question.trim() || ask.isPending}
                className="rx-btn rx-btn-acc mt-3"
              >
                {ask.isPending ? 'Sending…' : 'Ask'}
              </button>
            </div>
          )}

          <p className="rx-eyebrow m-0 mt-8 mb-4">
            {ama.questions?.length ?? 0} question{ama.questions?.length === 1 ? '' : 's'}
          </p>

          <div className="flex flex-col gap-4">
            {(ama.questions ?? []).map((item) => (
              <article key={item.id} className="rounded-tile border border-edge p-5">
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => vote.mutate({ id: item.id, on: item.is_upvoted })}
                    className={`flex min-w-[56px] cursor-pointer flex-col items-center gap-0.5 rounded-[14px] border-[1.5px] px-3 py-2 transition-colors ${
                      item.is_upvoted ? 'border-acc bg-tint text-acc-ink' : 'border-edge-soft bg-white text-muted hover:border-ink'
                    }`}
                  >
                    <span className="text-[15px] leading-none">▲</span>
                    <span className="text-[15px] font-bold">{item.upvotes_count ?? 0}</span>
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="m-0 text-[17px] leading-[1.45]">{item.body}</p>
                    <p className="m-0 mt-1.5 text-[14px] text-faint">{item.user?.name}</p>

                    {(item.answers ?? []).map((reply) => (
                      <div key={reply.id} className="mt-3 rounded-[14px] bg-cream p-4">
                        <p className="m-0 text-[16px] leading-[1.5]">{reply.body}</p>
                        <p className="m-0 mt-1.5 text-[13.5px] font-bold text-acc-ink">
                          {reply.user?.name ?? 'Host'}
                        </p>
                      </div>
                    ))}

                    {isHost && (
                      <div className="mt-3">
                        <textarea
                          className="rx-textarea min-h-[64px] text-[15.5px]"
                          placeholder="Answer this one…"
                          value={answers[item.id] ?? ''}
                          onChange={(event) =>
                            setAnswers((current) => ({ ...current, [item.id]: event.target.value }))
                          }
                        />
                        <button
                          onClick={() => answer.mutate({ id: item.id, body: answers[item.id] })}
                          disabled={!answers[item.id]?.trim() || answer.isPending}
                          className="rx-btn rx-btn-ghost mt-2 min-h-[42px] px-4 text-[15px]"
                        >
                          Answer
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}

            {(ama.questions ?? []).length === 0 && (
              <p className="text-[16.5px] text-muted">No questions yet. Be the one who asks.</p>
            )}
          </div>
        </>
      )}
    </Modal>
  )
}
