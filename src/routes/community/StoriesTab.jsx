import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { getMeta } from '../../api/meta'
import { convertToAma, createStory, discoverStories, listStories, react, removeReaction } from '../../api/stories'
import Avatar from '../../components/Avatar'
import FeaturedBanner, { BannerGhost, BannerPrimary } from '../../components/FeaturedBanner'
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

/*
  The canvas puts three reactions on the chip row and tucks the rest behind a
  "☺ +" picker, so the row stays short however many emoji exist. The API stores
  one reaction per person out of a fixed four, which lands three inline and the
  fourth in the menu.
*/
const INLINE_REACTIONS = REACTIONS.slice(0, 3)
const PICKER_REACTIONS = REACTIONS.slice(3)

const reactionLabel = (key) => key.replace('_', ' ')

/*
  The canvas asks for `transform .22s <spring>, background .2s`. Tailwind's
  scale/rotate utilities set the standalone `scale` and `rotate` properties
  rather than `transform`, so those have to be named too or the hover snaps.
*/
const CHIP_TRANSITION = [
  'transform .22s cubic-bezier(.2,1.6,.3,1)',
  'scale .22s cubic-bezier(.2,1.6,.3,1)',
  'rotate .22s cubic-bezier(.2,1.6,.3,1)',
  'background-color .2s',
].join(',')

const PICKER_TRANSITION = 'scale .18s cubic-bezier(.2,1.6,.3,1),background-color .18s'

/**
 * One story's reaction row: the default chips, whatever was picked out of the
 * menu promoted beside them, and the picker itself.
 */
function Reactions({ story, onReact }) {
  const [picking, setPicking] = useState(false)
  const picker = useRef(null)

  // Dismiss the menu the way the notification panel does — an outside click or
  // Escape — so a stray open picker never sits over the card below it.
  useEffect(() => {
    if (!picking) return
    const onDown = (event) => {
      if (!picker.current?.contains(event.target)) setPicking(false)
    }
    const onKey = (event) => {
      if (event.key === 'Escape') setPicking(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [picking])

  const mine = story.my_reaction
  // Picking from the menu would otherwise leave no trace on the row.
  const promoted = PICKER_REACTIONS.find((reaction) => reaction.key === mine)

  const fire = (reaction) => {
    onReact({ id: story.id, reaction: reaction.key, mine })
    setPicking(false)
  }

  return (
    <>
      {INLINE_REACTIONS.map((reaction) => (
        <button
          key={reaction.key}
          onClick={() => fire(reaction)}
          title={reactionLabel(reaction.key)}
          aria-pressed={mine === reaction.key}
          className={`flex min-h-[48px] cursor-pointer items-center gap-2 rounded-full border-none px-[17px] py-3 text-base font-bold hover:scale-110 hover:-rotate-3 hover:bg-tint ${
            mine === reaction.key ? 'bg-tint text-acc-ink' : 'bg-sand'
          }`}
          style={{ transition: CHIP_TRANSITION }}
        >
          {reaction.emoji}
        </button>
      ))}

      {promoted && (
        <button
          onClick={() => fire(promoted)}
          title={reactionLabel(promoted.key)}
          aria-pressed
          className="flex min-h-[48px] cursor-pointer items-center gap-2 rounded-full border border-acc-soft bg-tint px-[17px] py-3 text-base font-bold text-acc-ink"
          style={{ animation: 'pop .35s cubic-bezier(.2,1.5,.3,1) both' }}
        >
          {promoted.emoji}
        </button>
      )}

      <div ref={picker} className="relative">
        <button
          type="button"
          onClick={() => setPicking((open) => !open)}
          aria-expanded={picking}
          aria-label="More reactions"
          className="min-h-[48px] cursor-pointer rounded-full border-[1.5px] border-dashed border-[#D9D3C9] bg-white px-4 py-3 text-base font-bold text-muted transition-colors duration-200 hover:border-ink hover:text-ink"
        >
          ☺ +
        </button>

        {picking && (
          <div
            className="absolute bottom-[calc(100%+8px)] left-0 z-20 flex w-max max-w-[196px] flex-wrap gap-1 rounded-2xl border border-edge-soft bg-white p-2 shadow-[0_16px_36px_rgb(20_18_15/0.14)]"
            style={{ animation: 'springIn .3s both' }}
          >
            {PICKER_REACTIONS.map((reaction) => (
              <button
                key={reaction.key}
                type="button"
                onClick={() => fire(reaction)}
                title={reactionLabel(reaction.key)}
                aria-pressed={mine === reaction.key}
                className="h-11 w-11 cursor-pointer rounded-[11px] border-none bg-transparent p-1.5 text-[22px] leading-none hover:scale-125 hover:bg-sand"
                style={{ transition: PICKER_TRANSITION }}
              >
                {reaction.emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export default function StoriesTab() {
  const say = useToast()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { openRequest } = useOverlays()
  const [creating, setCreating] = useState(false)
  // 'discover' ranks other people's stories by how many tags match your profile.
  const [mode, setMode] = useState('discover')

  const { data: meta } = useQuery({ queryKey: ['meta'], queryFn: getMeta })
  const { data, isPending, error } = useQuery({
    queryKey: ['stories', { mode }],
    queryFn: () =>
      mode === 'discover' ? discoverStories({ per_page: 30 }) : listStories({ per_page: 30 }),
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

  // The newest story gets the accent slab; the rest fill the grid. Only worth
  // doing when there is still a grid left behind it.
  const { total, lead, rest } = useMemo(() => {
    const items = data?.items ?? []
    const featured = items.length >= 2
    return {
      total: items.length,
      lead: featured ? items[0] : null,
      rest: featured ? items.slice(1) : items,
    }
  }, [data])

  // The slab stands in for the lead's card, so it has to carry what that card's
  // chip row carried: the reaction you gave, and the count that sat beside it.
  const leadReaction = REACTIONS.find((reaction) => reaction.key === lead?.my_reaction)
  const leadCount = lead?.reactions_count ?? 0
  const leadNote =
    leadCount === 0
      ? 'Nobody has reacted yet. Go on.'
      : `${leadCount} ${leadCount === 1 ? 'person has' : 'people have'} reacted`

  return (
    <div className="mt-8 animate-rise">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="rx-display m-0 text-[clamp(28px,3.6vw,42px)] tracking-[-.032em]">
            Wait — they do that?!
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 rounded-[14px] bg-sand p-1">
            {[
              ['discover', 'For you'],
              ['all', 'Everything'],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setMode(value)}
                className={
                  mode === value
                    ? 'cursor-pointer rounded-[11px] border-none bg-white px-[22px] py-[11px] text-[15.5px] font-bold shadow-[0_2px_8px_rgb(20_18_15/0.08)]'
                    : 'cursor-pointer rounded-[11px] border-none bg-transparent px-[22px] py-[11px] text-[15.5px] font-semibold text-muted'
                }
              >
                {label}
              </button>
            ))}
          </div>
          <button onClick={() => setCreating(true)} className="rx-btn rx-btn-dark rx-btn-lg">
            Tell yours
          </button>
        </div>
      </div>

      <ErrorNote error={error} className="mt-6" />

      <div className="mt-[26px]">
        {isPending ? (
          <SkeletonCards count={3} height={420} />
        ) : total === 0 ? (
          <Empty
            title={mode === 'discover' ? 'Nothing matching your interests yet.' : 'No stories yet.'}
            hint={
              mode === 'discover'
                ? 'Add a few interests on your profile, or read everything instead.'
                : 'Somebody here has done something surprising. Probably you.'
            }
          />
        ) : (
          <>
            {lead && (
              <FeaturedBanner
                eyebrow="Latest from after hrs"
                title={`${storyEmoji(lead.category)} ${lead.title}`}
                meta={lead.body}
                note={leadNote}
                stack={[lead.user].filter(Boolean)}
                stackLine={lead.user ? `${lead.user.name} · ${personMeta(lead.user)}` : undefined}
              >
                {/*
                  There is room for one reaction here rather than the whole chip
                  row, so it holds the one you gave — tap again to take it back —
                  and the clap until you do.
                */}
                <BannerPrimary
                  onClick={() =>
                    toggleReaction.mutate({
                      id: lead.id,
                      reaction: leadReaction?.key ?? 'clap',
                      mine: lead.my_reaction,
                    })
                  }
                  disabled={toggleReaction.isPending}
                  title={leadReaction ? 'Take it back' : reactionLabel('clap')}
                >
                  {leadReaction ? `${leadReaction.emoji} You reacted` : '👏 Nice one'}
                </BannerPrimary>

                {lead.user && lead.user.id !== user?.id && (
                  <BannerGhost onClick={() => openRequest(lead.user, lead.title)}>Ask about it</BannerGhost>
                )}
                {lead.user?.id === user?.id && !lead.ama_id && (
                  <BannerGhost onClick={() => toAma.mutate(lead.id)} disabled={toAma.isPending}>
                    Turn into an AMA
                  </BannerGhost>
                )}
              </FeaturedBanner>
            )}

            <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(320px,1fr))]">
              {rest.map((story) => (
                <article key={story.id} className="rx-card rx-card-lift animate-rise overflow-hidden">
                  {/* The photo is absolute so a portrait one crops to the strip
                      rather than rendering at its own aspect ratio over the text:
                      `h-full` has nothing to resolve against in a centred grid. */}
                  <div className="relative grid h-[230px] place-items-center overflow-hidden bg-sand">
                    {story.media_url ? (
                      <img
                        src={story.media_url}
                        alt=""
                        className="absolute inset-0 block h-full w-full object-cover"
                      />
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
                    <p className="m-0 mt-3 mb-4 text-[16.5px] leading-[1.5] text-muted">{story.body}</p>

                    {story.tags?.length > 0 && (
                      <div className="mb-[18px] flex flex-wrap gap-[7px]">
                        {story.tags.map((tag) => (
                          <span key={tag.id} className="rx-chip rx-chip-sand px-[14px] py-2 text-[14px]">
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-[9px]">
                      <Reactions story={story} onReact={toggleReaction.mutate} />
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
          </>
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
            { key: 'tags', label: 'Tags', placeholder: 'hyrox, training, comebacks' },
          ]}
          onSubmit={(values) =>
            createStory({
              title: values.title,
              body: values.body,
              category: values.category,
              media_url: values.media_url || undefined,
              // The API takes up to six; a comma-separated line is easier to type.
              tags: values.tags
                ? values.tags.split(',').map((tag) => tag.trim()).filter(Boolean).slice(0, 6)
                : undefined,
            })
          }
        />
      )}
    </div>
  )
}
