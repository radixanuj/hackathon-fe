import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { acceptAnswer, answer as postAnswer, getQuestion, unvolunteer, volunteer } from '../api/questions'
import { useAuth } from '../auth/AuthContext'
import Avatar from './Avatar'
import Modal from './Modal'
import { useOverlays } from './Overlays'
import { ErrorNote } from './States'
import { useToast } from './Toast'
import { personMeta, shortDate, titleCase } from '../lib/format'

/**
 * A question in full. Two ways to help live side by side here on purpose: write
 * an answer, or just put your hand up and talk to the person for half an hour.
 */
export default function QuestionModal({ questionId, onClose }) {
  const { user } = useAuth()
  const say = useToast()
  const queryClient = useQueryClient()
  const { openProfile, openRequest } = useOverlays()
  const [body, setBody] = useState('')
  const [note, setNote] = useState('')

  const { data: question, isPending, error } = useQuery({
    queryKey: ['question', questionId],
    queryFn: () => getQuestion(questionId),
  })

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['question', questionId] })
    queryClient.invalidateQueries({ queryKey: ['questions'] })
  }

  const isAsker = question?.user?.id === user?.id
  const isClosed = question?.status === 'closed'
  const answers = question?.answers ?? []
  const volunteers = question?.volunteers ?? []
  const tags = question?.tags ?? []
  const mine = volunteers.find((entry) => entry.user?.id === user?.id)
  const askerFirstName = question?.user?.name?.split(' ')[0] ?? 'them'

  const send = useMutation({
    mutationFn: () => postAnswer(questionId, body),
    onSuccess: () => {
      setBody('')
      refresh()
      say('Answered. One fewer thing someone has to guess at.')
    },
    onError: (caught) => say(caught.message),
  })

  const handRaise = useMutation({
    mutationFn: () => (question?.i_volunteered ? unvolunteer(questionId) : volunteer(questionId, note || undefined)),
    onSuccess: () => {
      setNote('')
      refresh()
      say(question?.i_volunteered ? 'Taken off the list.' : `You're on the list. ${askerFirstName} can book you now.`)
    },
    onError: (caught) => say(caught.message),
  })

  const accept = useMutation({
    mutationFn: (answerId) => acceptAnswer(answerId),
    onSuccess: () => {
      refresh()
      say('Marked as the one that helped.')
    },
    onError: (caught) => say(caught.message),
  })

  return (
    <Modal onClose={onClose} maxWidth={760} zIndex={135}>
      {isPending && <p className="py-8 text-[16.5px] text-muted">Loading…</p>}
      <ErrorNote error={error} />

      {question && (
        <>
          <p className="m-0 text-[12.5px] font-bold tracking-[.14em] text-acc-ink uppercase">
            {titleCase(question.status)} · {question.answers_count ?? 0} answer
            {question.answers_count === 1 ? '' : 's'} · {question.volunteers_count ?? 0} offering to talk
          </p>
          <h2 className="rx-display m-0 mt-2 text-[clamp(24px,3.2vw,34px)]">{question.title}</h2>

          {question.user && (
            <button
              onClick={() => openProfile(question.user.id)}
              className="mt-4 flex cursor-pointer items-center gap-3 border-none bg-transparent p-0 text-left"
            >
              <Avatar person={question.user} size={44} radius={13} />
              <span>
                <span className="block text-[16px] font-bold">
                  {isAsker ? 'You asked this' : `Asked by ${question.user.name}`}
                </span>
                <span className="block text-[14.5px] text-muted">
                  {[personMeta(question.user), shortDate(question.created_at)].filter(Boolean).join(' · ')}
                </span>
              </span>
            </button>
          )}

          {question.body && (
            <p className="m-0 mt-5 text-[17px] leading-[1.55] whitespace-pre-line">{question.body}</p>
          )}

          {tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag.id} className="rx-chip rx-chip-tint text-[14px]">
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          {/* --- People who will talk to you ------------------------------- */}
          <p className="rx-eyebrow m-0 mt-8 mb-4">
            {volunteers.length} {volunteers.length === 1 ? 'person' : 'people'} happy to talk this through
          </p>

          <div className="flex flex-col gap-3">
            {volunteers.map((entry) => (
              <article
                key={entry.id}
                className="flex flex-wrap items-center gap-4 rounded-tile bg-cream p-[18px]"
              >
                <Avatar person={entry.user} size={46} radius={14} />
                <div className="min-w-0 flex-1">
                  <p className="m-0 text-[16.5px] font-bold">
                    {entry.user?.id === user?.id ? 'You' : entry.user?.name}
                  </p>
                  <p className="m-0 mt-0.5 text-[14.5px] text-muted">{personMeta(entry.user)}</p>
                  {entry.note && <p className="m-0 mt-2 text-[15.5px] leading-[1.45]">{entry.note}</p>}
                </div>
                {entry.user?.id !== user?.id && (
                  <button
                    onClick={() => openRequest(entry.user, question.title)}
                    className="rx-btn rx-btn-acc min-h-[44px] px-4 text-[15px]"
                  >
                    Ask for 30 minutes
                  </button>
                )}
              </article>
            ))}

            {volunteers.length === 0 && (
              <p className="m-0 text-[16.5px] text-muted">
                Nobody has put their hand up yet. Half an hour with the right person often beats a
                written answer.
              </p>
            )}
          </div>

          {/* --- Written answers ------------------------------------------- */}
          <p className="rx-eyebrow m-0 mt-8 mb-4">
            {answers.length} answer{answers.length === 1 ? '' : 's'}
          </p>

          <div className="flex flex-col gap-3">
            {answers.map((item) => (
              <article
                key={item.id}
                className={`rounded-tile border-[1.5px] p-5 ${
                  item.is_accepted ? 'border-acc bg-tint' : 'border-edge bg-white'
                }`}
              >
                {item.is_accepted && (
                  <p className="m-0 mb-2 text-[12.5px] font-bold tracking-[.13em] text-acc-ink uppercase">
                    ✓ The one that helped
                  </p>
                )}
                <p className="m-0 text-[16.5px] leading-[1.5] whitespace-pre-line">{item.body}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <p className="m-0 text-[14.5px] font-bold">
                    {item.user?.id === user?.id ? 'You' : item.user?.name}
                  </p>
                  <p className="m-0 text-[14px] text-faint">{shortDate(item.created_at)}</p>
                  {isAsker && !item.is_accepted && (
                    <button
                      onClick={() => accept.mutate(item.id)}
                      disabled={accept.isPending}
                      className="rx-btn rx-btn-ghost ml-auto min-h-[40px] px-4 text-[14.5px]"
                    >
                      Accept this
                    </button>
                  )}
                </div>
              </article>
            ))}

            {answers.length === 0 && (
              <p className="m-0 text-[16.5px] text-muted">Nothing written down yet.</p>
            )}
          </div>

          {/* --- Two ways to help ------------------------------------------ */}
          {isAsker ? (
            <p className="mt-8 rounded-tile bg-sand p-[18px] text-[15.5px] text-muted">
              This one's yours. When an answer actually helps, accept it — that's how the next person
              knows which one to read.
            </p>
          ) : (
            <div className="mt-8 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(258px,1fr))]">
              {isClosed ? (
                <p className="m-0 rounded-tile bg-sand p-[22px] text-[15.5px] text-muted">
                  Closed — {askerFirstName} got what they needed, so answers are shut off.
                </p>
              ) : (
                <div className="rounded-tile bg-cream p-[22px]">
                  <p className="rx-label">Write an answer</p>
                  <p className="m-0 mb-3 text-[14.5px] text-muted">
                    If you already know the thing, just say the thing.
                  </p>
                  <textarea
                    className="rx-textarea min-h-[104px] text-[16px]"
                    placeholder="What you'd tell them over a desk."
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                  />
                  <button
                    onClick={() => send.mutate()}
                    disabled={!body.trim() || send.isPending}
                    className="rx-btn rx-btn-ghost mt-3"
                  >
                    {send.isPending ? 'Posting…' : 'Post answer'}
                  </button>
                </div>
              )}

              <div className="rounded-tile bg-tint p-[22px]">
                <p className="rx-label">Or just offer to talk</p>
                {question.i_volunteered ? (
                  <>
                    <p className="m-0 mb-3 text-[15px] leading-[1.45] text-acc-ink">
                      You're on the list. {askerFirstName} can book 30 minutes with you whenever they
                      like.
                    </p>
                    {mine?.note && (
                      <p className="m-0 mb-3 text-[15.5px] leading-[1.45]">“{mine.note}”</p>
                    )}
                    <button
                      onClick={() => handRaise.mutate()}
                      disabled={handRaise.isPending}
                      className="rx-btn rx-btn-ghost"
                    >
                      Take my name off
                    </button>
                  </>
                ) : (
                  <>
                    <p className="m-0 mb-3 text-[14.5px] leading-[1.45] text-acc-ink">
                      Twenty minutes on a call usually beats four paragraphs.
                    </p>
                    <input
                      className="rx-input text-[15.5px]"
                      placeholder="Optional: I ran this exact migration last year."
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                    />
                    <button
                      onClick={() => handRaise.mutate()}
                      disabled={handRaise.isPending}
                      className="rx-btn rx-btn-acc mt-3"
                    >
                      I can talk about this
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </Modal>
  )
}
