import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { listUsers, searchTags } from '../../api/people'
import Avatar from '../../components/Avatar'
import { useOverlays } from '../../components/Overlays'
import SessionsPanel from '../../components/SessionsPanel'
import { SkeletonCards } from '../../components/States'
import { personMeta } from '../../lib/format'

/** Pick a topic, see who offered it, ask for thirty minutes. */
export default function MentoringPanel() {
  const { openProfile, openRequest } = useOverlays()
  const [searchParams, setSearchParams] = useSearchParams()
  const topic = searchParams.get('topic')

  const { data: topics } = useQuery({
    queryKey: ['tags', { type: 'skill', limit: 10 }],
    queryFn: () => searchTags({ type: 'skill', limit: 10 }),
  })

  const { data: mentors, isPending: mentorsPending } = useQuery({
    queryKey: ['users', { tag: topic, kind: 'can_help_with', open_to_mentoring: true }],
    queryFn: () => listUsers({ tag: topic, kind: 'can_help_with', open_to_mentoring: true, per_page: 12 }),
    enabled: Boolean(topic),
  })

  // The tab lives in the query string as well, so keep it when the topic changes.
  const setTopic = (slug) =>
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      if (slug) next.set('topic', slug)
      else next.delete('topic')
      return next
    })

  const mentorList = useMemo(() => mentors?.items ?? [], [mentors])
  const topicName = topics?.items?.find((tag) => tag.slug === topic)?.name ?? topic

  return (
    <>
      <div>
        <h2 className="rx-display m-0 text-[clamp(30px,4vw,46px)] tracking-[-.032em] leading-[1.02]">
          Learn from someone at Radix
        </h2>
        <p className="m-0 mt-3 mb-[26px] max-w-[560px] text-[18.5px] text-muted">
          Pick a topic. We'll show you who offered to talk about it. Thirty minutes, that's all.
        </p>

        <div className="flex flex-wrap gap-[11px]">
          {(topics?.items ?? []).map((tag) => {
            const on = topic === tag.slug
            return (
              <button
                key={tag.id}
                onClick={() => setTopic(on ? null : tag.slug)}
                className={
                  on
                    ? 'rx-btn rx-btn-acc min-h-[54px] animate-pop rounded-[18px] px-6 text-[17px]'
                    : 'rx-btn rounded-[18px] border-[1.5px] border-edge-soft bg-white px-6 text-[17px] font-semibold text-ink hover:-translate-y-1 hover:border-acc hover:bg-tint'
                }
                style={{ minHeight: 54 }}
              >
                {tag.name}
              </button>
            )
          })}
        </div>

        {topic && (
          <div className="mt-[30px] animate-rise">
            <p className="m-0 mb-[18px] text-[16.5px] text-muted">
              <strong className="font-bold text-ink">{mentorList.length}</strong>{' '}
              {mentorList.length === 1 ? 'person has' : 'people have'} offered to talk about {topicName}
            </p>

            {mentorsPending ? (
              <SkeletonCards count={3} height={220} />
            ) : mentorList.length === 0 ? (
              <p className="text-[16.5px] text-muted">Nobody has offered this one yet. Try another topic.</p>
            ) : (
              <div className="grid gap-[18px] [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
                {mentorList.map((person) => (
                  <article
                    key={person.id}
                    className="min-w-0 animate-rise rounded-tile bg-cream p-6 transition-transform duration-300 ease-[cubic-bezier(.2,.9,.3,1)] hover:-translate-y-[5px]"
                  >
                    <div className="flex items-center gap-[14px]">
                      <Avatar person={person} size={58} radius={17} />
                      <div className="min-w-0">
                        <h3 className="rx-title m-0 text-[20.5px]">{person.name}</h3>
                        <p className="m-0 mt-[3px] text-[14.5px] text-muted">{personMeta(person)}</p>
                      </div>
                    </div>
                    <p className="m-0 mt-[18px] mb-5 text-base leading-[1.5]">
                      {person.intro ?? `Happy to talk about ${topicName}.`}
                    </p>
                    <div className="flex flex-wrap gap-[9px]">
                      <button
                        onClick={() => openRequest(person, topicName)}
                        className="rx-btn rx-btn-acc rounded-[13px]"
                      >
                        Request 30 mins
                      </button>
                      <button onClick={() => openProfile(person.id)} className="rx-btn rx-btn-ghost rounded-[13px]">
                        Profile
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <SessionsPanel />
    </>
  )
}
