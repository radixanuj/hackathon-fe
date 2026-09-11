import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { createAma, listAmas } from '../../api/amas'
import { getMeta } from '../../api/meta'
import { createRecommendation, like, listRecommendations, unlike } from '../../api/recommendations'
import AmaModal from '../../components/AmaModal'
import FormModal from '../../components/FormModal'
import { Empty, ErrorNote, SkeletonCards } from '../../components/States'
import { useToast } from '../../components/Toast'
import { titleCase } from '../../lib/format'

// Four muted spines, so a shelf of recommendations reads as a shelf.
const SPINES = ['#14120F', '#EFE6D8', '#E3E7DF', '#E7E4EE']
const spine = (id) => SPINES[Number(id) % SPINES.length]

export default function LearnTab() {
  const say = useToast()
  const queryClient = useQueryClient()
  const [stream, setStream] = useState('work')
  const [creatingRec, setCreatingRec] = useState(false)
  const [creatingAma, setCreatingAma] = useState(false)
  const [openAma, setOpenAma] = useState(null)

  const { data: meta } = useQuery({ queryKey: ['meta'], queryFn: getMeta })

  const { data: recs, isPending: recsPending, error: recsError } = useQuery({
    queryKey: ['recommendations', { stream }],
    queryFn: () => listRecommendations({ stream, sort: 'recent', per_page: 24 }),
  })

  const { data: amas, isPending: amasPending } = useQuery({
    queryKey: ['amas'],
    queryFn: () => listAmas({ per_page: 24 }),
  })

  const toggleLike = useMutation({
    mutationFn: ({ id, liked }) => (liked ? unlike(id) : like(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recommendations'] }),
    onError: (caught) => say(caught.message),
  })

  return (
    <div className="mt-8 animate-rise">
      {/* --- Recommendations --------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="rx-title m-0 text-[30px] font-bold tracking-[-.028em]">Recommendations</h2>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 rounded-[14px] bg-sand p-1">
            {['work', 'leisure'].map((value) => (
              <button
                key={value}
                onClick={() => setStream(value)}
                className={
                  stream === value
                    ? 'cursor-pointer rounded-[11px] border-none bg-white px-[22px] py-[11px] text-[15.5px] font-bold shadow-[0_2px_8px_rgb(20_18_15/0.08)]'
                    : 'cursor-pointer rounded-[11px] border-none bg-transparent px-[22px] py-[11px] text-[15.5px] font-semibold text-muted'
                }
              >
                {titleCase(value)}
              </button>
            ))}
          </div>
          <button onClick={() => setCreatingRec(true)} className="rx-btn rx-btn-ghost">
            Recommend something
          </button>
        </div>
      </div>

      <ErrorNote error={recsError} className="mt-5" />

      <div className="mt-[22px]">
        {recsPending ? (
          <SkeletonCards count={4} height={230} />
        ) : (recs?.items ?? []).length === 0 ? (
          <Empty title="Nothing recommended yet." hint="Be the first to put something on the shelf." />
        ) : (
          <div className="grid gap-[18px] [grid-template-columns:repeat(auto-fill,minmax(290px,1fr))]">
            {recs.items.map((rec) => (
              <article key={rec.id} className="rx-card rx-card-lift animate-rise rounded-tile p-6">
                <div className="flex items-start gap-[14px]">
                  <span
                    className="h-[70px] w-[52px] flex-none rounded-[9px]"
                    style={{ background: spine(rec.id) }}
                  />
                  <div className="min-w-0">
                    <p className="rx-eyebrow m-0 mb-[5px]">{titleCase(rec.type)}</p>
                    <h3 className="rx-title m-0 text-[21px] leading-[1.14]">{rec.title}</h3>
                    {rec.creator && <p className="m-0 mt-1 text-[14.5px] text-muted">{rec.creator}</p>}
                  </div>
                </div>
                <p className="m-0 mt-[18px] mb-[14px] text-base leading-[1.5]">{rec.why}</p>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="m-0 text-[14.5px] font-bold text-acc-ink">
                    Recommended by {rec.user?.name ?? 'someone here'}
                  </p>
                  <button
                    onClick={() => toggleLike.mutate({ id: rec.id, liked: rec.is_liked })}
                    className={`ml-auto cursor-pointer rounded-full border-none px-[15px] py-2 text-[15px] font-bold transition-transform duration-200 ease-[cubic-bezier(.2,1.6,.3,1)] hover:scale-110 ${
                      rec.is_liked ? 'bg-tint text-acc-ink' : 'bg-sand text-ink'
                    }`}
                  >
                    ♥ {rec.likes_count ?? 0}
                  </button>
                  {rec.url && (
                    <a href={rec.url} target="_blank" rel="noreferrer" className="rx-link no-underline">
                      Open →
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* --- AMAs --------------------------------------------------------- */}
      <div className="mt-[54px] flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="rx-title m-0 text-[30px] font-bold tracking-[-.028em]">AMAs</h2>
          <p className="m-0 mt-1.5 text-[17px] text-muted">
            Someone here has done the thing you're curious about.
          </p>
        </div>
        <button onClick={() => setCreatingAma(true)} className="rx-btn rx-btn-ghost">
          Host an AMA
        </button>
      </div>

      <div className="mt-[22px]">
        {amasPending ? (
          <SkeletonCards count={3} height={220} />
        ) : (amas?.items ?? []).length === 0 ? (
          <Empty title="No AMAs open." hint="Host the one only you could host." />
        ) : (
          <div className="grid gap-[18px] [grid-template-columns:repeat(auto-fill,minmax(320px,1fr))]">
            {amas.items.map((ama) => (
              <article
                key={ama.id}
                className="rx-card-dark animate-rise p-7 transition-transform duration-[350ms] ease-[cubic-bezier(.2,.9,.3,1)] hover:-translate-y-1.5"
              >
                <p className="m-0 mb-[14px] text-[12.5px] font-bold tracking-[.14em] text-acc-soft uppercase">
                  {titleCase(ama.format)} · {titleCase(ama.status)}
                </p>
                <h3 className="rx-title m-0 text-[25px] font-bold">{ama.title}</h3>
                <p className="m-0 mt-3 mb-[22px] text-base text-dim">
                  {ama.host?.name}
                  {ama.host?.team ? ` · ${ama.host.team}` : ''}
                  {ama.questions_count ? ` · ${ama.questions_count} questions` : ''}
                </p>
                <button onClick={() => setOpenAma(ama.id)} className="rx-btn rx-btn-acc">
                  Ask a question
                </button>
              </article>
            ))}
          </div>
        )}
      </div>

      {openAma && <AmaModal amaId={openAma} onClose={() => setOpenAma(null)} />}

      {creatingRec && (
        <FormModal
          title="Recommend something"
          intent="The why matters more than the what."
          submitLabel="Put it on the shelf"
          onClose={() => setCreatingRec(false)}
          onDone={() => {
            queryClient.invalidateQueries({ queryKey: ['recommendations'] })
            say("Added. Someone's next read just got decided.")
          }}
          fields={[
            { key: 'title', label: 'What is it?', placeholder: 'The Mom Test' },
            { key: 'creator', label: 'Who made it?', placeholder: 'Rob Fitzpatrick' },
            { key: 'type', label: 'Type', type: 'select', options: meta?.recommendation_types ?? ['book'] },
            { key: 'stream', label: 'Stream', type: 'select', options: meta?.recommendation_streams ?? ['work'], initial: stream },
            { key: 'url', label: 'Link', placeholder: 'https://…' },
            { key: 'why', label: 'Why should someone bother?', type: 'textarea', placeholder: 'The bit that actually changed how you think.' },
          ]}
          onSubmit={(values) =>
            createRecommendation({
              title: values.title,
              creator: values.creator || undefined,
              type: values.type,
              stream: values.stream,
              url: values.url || undefined,
              why: values.why,
            })
          }
        />
      )}

      {creatingAma && (
        <FormModal
          title="Host an AMA"
          intent="Ask me anything — about the thing only you have done."
          submitLabel="Open it up"
          onClose={() => setCreatingAma(false)}
          onDone={() => {
            queryClient.invalidateQueries({ queryKey: ['amas'] })
            say("It's open. Questions will start landing.")
          }}
          fields={[
            { key: 'title', label: 'Title', placeholder: 'Nine years at Radix. Ask me anything.' },
            { key: 'description', label: 'What can people ask about?', type: 'textarea', placeholder: 'Set the scope so people know where to start.' },
            { key: 'format', label: 'Format', type: 'select', options: meta?.ama_formats ?? ['async', 'live'] },
          ]}
          onSubmit={(values) =>
            createAma({
              title: values.title,
              description: values.description || undefined,
              format: values.format,
              status: 'open',
            })
          }
        />
      )}
    </div>
  )
}
