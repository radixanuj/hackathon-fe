import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { getMeta } from '../../api/meta'
import { convertToAma, createStory, listStories, react, removeReaction } from '../../api/stories'
import Avatar from '../../components/Avatar'
import FormModal from '../../components/FormModal'
import { useOverlays } from '../../components/Overlays'
import { Empty, ErrorNote, SkeletonCards } from '../../components/States'
import { useToast } from '../../components/Toast'
import { personMeta, storyEmoji } from '../../lib/format'
import { useAuth } from '../../auth/AuthContext'

const REACTIONS = [
  { key: 'clap', emoji: '👏' },
  { key: 'heart', emoji: '❤️' },
  { key: 'mind_blown', emoji: '🤯' },
  { key: 'inspired', emoji: '✨' },
]

export default function StoriesTab() {
  const say = useToast()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { openRequest } = useOverlays()
  const [creating, setCreating] = useState(false)

  const { data: meta } = useQuery({ queryKey: ['meta'], queryFn: getMeta })
  const { data, isPending, error } = useQuery({
    queryKey: ['stories'],
    queryFn: () => listStories({ per_page: 30 }),
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['stories'] })

  // One reaction per person: tapping the one you already gave takes it back.
  const toggleReaction = useMutation({
    mutationFn: ({ id, reaction, mine }) => (mine === reaction ? removeReaction(id) : react(id, reaction)),
    onSuccess: refresh,
    onError: (caught) => say(caught.message),
  })

  const toAma = useMutation({
    mutationFn: (id) => convertToAma(id, {}),
    onSuccess: () => {
      refresh()
      queryClient.invalidateQueries({ queryKey: ['amas'] })
      say("It's an AMA now. People can ask you anything.")
    },
    onError: (caught) => say(caught.message),
  })

  const stories = data?.items ?? []

  return (
    <div className="mt-8 animate-rise">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="rx-display m-0 mb-1.5 text-[clamp(28px,3.6vw,42px)] tracking-[-.032em]">
            Wait — they do that?!
          </h2>
          <p className="m-0 max-w-[520px] text-[18px] text-muted">
            What people here get up to when they're not at work.
          </p>
        </div>
        <button onClick={() => setCreating(true)} className="rx-btn rx-btn-dark rx-btn-lg">
          Tell yours
        </button>
      </div>

      <ErrorNote error={error} className="mt-6" />

      <div className="mt-[26px]">
        {isPending ? (
          <SkeletonCards count={3} height={420} />
        ) : stories.length === 0 ? (
          <Empty title="No stories yet." hint="Somebody here has done something surprising. Probably you." />
        ) : (
          <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(320px,1fr))]">
            {stories.map((story) => (
              <article key={story.id} className="rx-card rx-card-lift animate-rise overflow-hidden">
                <div className="relative grid h-[230px] place-items-center bg-sand">
                  {story.media_url ? (
                    <img src={story.media_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[64px] leading-none">{storyEmoji(story.category)}</span>
                  )}
                </div>
                <div className="p-[26px]">
                  <h3 className="rx-title m-0 text-[26px] font-extrabold tracking-[-.03em] leading-[1.05]">
                    {story.title}
                  </h3>
                  {story.user && (
                    <div className="mt-3 flex items-center gap-2.5">
                      <Avatar person={story.user} size={32} radius={10} />
                      <p className="m-0 text-[15.5px] font-bold text-acc-ink">
                        {story.user.name} · {personMeta(story.user)}
                      </p>
                    </div>
                  )}
                  <p className="m-0 mt-3 mb-[22px] text-[16.5px] leading-[1.5] text-muted">{story.body}</p>

                  <div className="flex flex-wrap items-center gap-[9px]">
                    {REACTIONS.map((reaction) => {
                      const mine = story.my_reaction === reaction.key
                      return (
                        <button
                          key={reaction.key}
                          onClick={() =>
                            toggleReaction.mutate({
                              id: story.id,
                              reaction: reaction.key,
                              mine: story.my_reaction,
                            })
                          }
                          title={reaction.key.replace('_', ' ')}
                          className={`flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full border-none px-[15px] text-base font-bold transition-transform duration-200 ease-[cubic-bezier(.2,1.6,.3,1)] hover:scale-110 hover:-rotate-3 ${
                            mine ? 'bg-tint text-acc-ink' : 'bg-sand'
                          }`}
                        >
                          {reaction.emoji}
                        </button>
                      )
                    })}
                    <span className="text-[15px] text-muted">{story.reactions_count ?? 0}</span>

                    {story.user && story.user.id !== user?.id && (
                      <button
                        onClick={() => openRequest(story.user, story.title)}
                        className="rx-btn rx-btn-ghost ml-auto min-h-[44px] rounded-full px-5 text-base"
                      >
                        Ask about it
                      </button>
                    )}
                    {story.user?.id === user?.id && !story.ama_id && (
                      <button
                        onClick={() => toAma.mutate(story.id)}
                        disabled={toAma.isPending}
                        className="rx-btn rx-btn-ghost ml-auto min-h-[44px] rounded-full px-5 text-base"
                      >
                        Turn into an AMA
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {creating && (
        <FormModal
          title="Tell yours"
          intent="Not a humblebrag. The thing people would never guess."
          submitLabel="Share it"
          onClose={() => setCreating(false)}
          onDone={() => {
            refresh()
            say("It's up. Expect questions.")
          }}
          fields={[
            { key: 'title', label: 'Title', placeholder: 'I finished my first HYROX' },
            { key: 'body', label: 'What happened?', type: 'textarea', placeholder: 'A few lines is plenty.' },
            { key: 'category', label: 'Category', type: 'select', options: meta?.story_categories ?? ['other'] },
            { key: 'media_url', label: 'Photo link', placeholder: 'https://…' },
          ]}
          onSubmit={(values) =>
            createStory({
              title: values.title,
              body: values.body,
              category: values.category,
              media_url: values.media_url || undefined,
            })
          }
        />
      )}
    </div>
  )
}
