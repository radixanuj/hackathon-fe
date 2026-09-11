import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { getMeta } from '../../api/meta'
import { convertToAma, createStory, discoverStories, react, removeReaction } from '../../api/stories'
import Avatar from '../../components/Avatar'
import FormModal from '../../components/FormModal'
import { useOverlays } from '../../components/Overlays'
import { Empty, ErrorNote, SkeletonCards } from '../../components/States'
import { useToast } from '../../components/Toast'
import { personMeta, storyEmoji } from '../../lib/format'
import { useAuth } from '../../auth/AuthContext'

/** The story the tab opens on. Anything else falls in behind it, in server order. */
const HIGHLIGHT = 'Monsoon in Maharashtra is a vibe like no other!'

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

/* Same story: `translate` is its own property in Tailwind v4, so the card lift
   needs it named beside `transform`. */
const CARD_TRANSITION = [
  'transform .35s cubic-bezier(.2,.9,.3,1)',
  'translate .35s cubic-bezier(.2,.9,.3,1)',
  'box-shadow .35s',
].join(',')

/** A story the compose card posts has no category picker, and this is the one
 *  the API keeps for "doesn't fit the other five". */
const DROP_CATEGORY = 'other'

/**
 * The API wants a title and a body; the compose card asks one question. The
 * opening sentence becomes the headline and the whole note stays as the body.
 */
function headline(text) {
  const firstLine = text.split('\n')[0].trim() || text.trim()
  const stop = firstLine.search(/[.!?]/)
  const candidate = stop > 20 ? firstLine.slice(0, stop) : firstLine
  return candidate.length > 120 ? `${candidate.slice(0, 119).trimEnd()}…` : candidate
}

/**
 * Close a popover the way the notification panel does — an outside click or
 * Escape — so a stray open picker never sits over the card below it.
 */
function useDismissable(open, setOpen) {
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDown = (event) => {
      if (!ref.current?.contains(event.target)) setOpen(false)
    }
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, setOpen])

  return ref
}

/**
 * A story's picture. Absolutely positioned so a portrait shot crops to the
 * frame rather than rendering at its own aspect ratio; the category emoji
 * stands in for the stories that arrived without a `media_url`.
 */
function StoryPhoto({ story, className, emojiClassName }) {
  return (
    <div className={`relative grid place-items-center overflow-hidden ${className}`}>
      {story.media_url ? (
        <img
          src={story.media_url}
          alt=""
          className="absolute inset-0 block h-full w-full object-cover"
        />
      ) : (
        <span className={`leading-none ${emojiClassName}`}>{storyEmoji(story.category)}</span>
      )}
    </div>
  )
}

/**
 * One story's reaction row: the default chips, whatever was picked out of the
 * menu promoted beside them, and the picker itself.
 */
function Reactions({ story, onReact }) {
  const [picking, setPicking] = useState(false)
  const picker = useDismissable(picking, setPicking)

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

/**
 * The same row, on the accent slab. The chips invert instead of sitting on
 * sand, and the picker's outline borrows the slab's own text colour.
 *
 * The API keeps one total — `reactions_count` — rather than a tally per emoji,
 * so the count rides the chip you gave (a ✓ marks it) and the row ends with
 * the total rather than printing the same number four times.
 */
function LeadReactions({ story, onReact }) {
  const [picking, setPicking] = useState(false)
  const picker = useDismissable(picking, setPicking)

  const mine = story.my_reaction
  const count = story.reactions_count ?? 0
  const promoted = PICKER_REACTIONS.find((reaction) => reaction.key === mine)

  const fire = (reaction) => {
    onReact({ id: story.id, reaction: reaction.key, mine })
    setPicking(false)
  }

  const chip = (reaction, extra = '') => (
    <button
      key={reaction.key}
      onClick={() => fire(reaction)}
      title={mine === reaction.key ? 'Take it back' : reactionLabel(reaction.key)}
      aria-pressed={mine === reaction.key}
      className={`flex min-h-[48px] cursor-pointer items-center gap-2 rounded-full border-none bg-inv px-[18px] py-3 text-base font-bold text-on-inv hover:scale-110 hover:-rotate-3 ${extra}`}
      style={{ transition: CHIP_TRANSITION }}
    >
      {reaction.emoji}
      {mine === reaction.key && <span>✓ {count}</span>}
    </button>
  )

  return (
    <>
      {INLINE_REACTIONS.map((reaction) => chip(reaction))}
      {promoted && chip(promoted, 'animate-pop')}

      <div ref={picker} className="relative">
        <button
          type="button"
          onClick={() => setPicking((open) => !open)}
          aria-expanded={picking}
          aria-label="More reactions"
          className="min-h-[48px] cursor-pointer rounded-full border-[1.5px] border-dashed border-current bg-transparent px-4 py-3 text-base font-bold opacity-80 transition-opacity duration-200 hover:opacity-100"
        >
          ☺ +
        </button>

        {picking && (
          <div
            className="absolute bottom-[calc(100%+8px)] left-0 z-20 flex w-[196px] flex-wrap gap-1 rounded-[16px] border border-edge-soft bg-white p-2 shadow-[0_16px_36px_rgb(20_18_15/0.2)]"
            style={{ animation: 'springIn .3s both' }}
          >
            {PICKER_REACTIONS.map((reaction) => (
              <button
                key={reaction.key}
                type="button"
                onClick={() => fire(reaction)}
                title={reactionLabel(reaction.key)}
                aria-pressed={mine === reaction.key}
                className="h-11 w-11 cursor-pointer rounded-[11px] border-none bg-transparent p-1.5 text-[22px] leading-none text-ink hover:scale-125 hover:bg-sand"
                style={{ transition: PICKER_TRANSITION }}
              >
                {reaction.emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {!mine && (
        <span className="text-[15px] font-semibold opacity-80">
          {count === 0 ? 'Nobody has reacted yet.' : `${count} ${count === 1 ? 'reaction' : 'reactions'}`}
        </span>
      )}
    </>
  )
}

/**
 * First tile in the grid: the short way in. No photo drop — the API takes a
 * `media_url`, not an upload, and the full sheet behind "Tell yours" is where
 * a link, a category and tags belong.
 */
function DropMine({ onPost, onMore, pending }) {
  const [draft, setDraft] = useState('')

  const submit = () => {
    const text = draft.trim()
    if (!text || pending) return
    onPost(text, () => setDraft(''))
  }

  return (
    <article className="flex min-w-0 flex-col rounded-[26px] border-[1.5px] border-dashed border-acc-soft bg-tint p-[26px]">
      <p className="m-0 mb-2.5 text-[12.5px] font-bold tracking-[.14em] text-acc-ink uppercase">
        Your turn
      </p>
      <h3 className="rx-title m-0 text-[26px] font-extrabold leading-[1.05] tracking-[-.03em]">
        Drop mine
      </h3>
      <p className="m-0 mt-2.5 mb-4 text-[16.5px] leading-[1.5] text-muted">
        Something you did, made, climbed, cooked or survived. A couple of lines is plenty.
      </p>

      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="I spent six months learning to…"
        aria-label="Your story"
        className="rx-textarea min-h-[104px] p-[15px] text-base leading-[1.45]"
      />

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={submit}
          disabled={pending || draft.trim().length === 0}
          className="rx-btn rx-btn-acc min-h-[50px] rounded-[14px] px-[22px] py-3.5 text-base"
        >
          {pending ? 'Posting…' : 'Post it'}
        </button>
        <button type="button" onClick={onMore} className="rx-link">
          Add a photo or tags →
        </button>
      </div>
    </article>
  )
}

export default function StoriesTab() {
  const say = useToast()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { openRequest } = useOverlays()
  const [creating, setCreating] = useState(false)
  const { data: meta } = useQuery({ queryKey: ['meta'], queryFn: getMeta })
  // Ranked by how many tags match your profile, rather than newest first.
  const { data, isPending, error } = useQuery({
    queryKey: ['stories', { mode: 'discover' }],
    queryFn: () => discoverStories({ per_page: 30 }),
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

  // The same create the "Tell yours" sheet runs, minus the fields the compose
  // card doesn't ask for.
  const dropStory = useMutation({
    mutationFn: (text) => createStory({ title: headline(text), body: text, category: DROP_CATEGORY }),
    onSuccess: () => {
      refresh()
      say("It's up. Expect questions.")
    },
    onError: (caught) => say(caught.message),
  })

  // The newest story gets the accent slab; the rest fill the grid. Only worth
  // doing when there is still a grid left behind it.
  const { total, lead, rest } = useMemo(() => {
    const items = data?.items ?? []
    if (items.length < 2) return { total: items.length, lead: null, rest: items }
    const hero = items.find((story) => story.title === HIGHLIGHT) ?? items[0]
    return {
      total: items.length,
      lead: hero,
      rest: items.filter((story) => story.id !== hero.id),
    }
  }, [data])

  return (
    <div className="mt-8 animate-rise">
      <ErrorNote error={error} />

      <div>
        {isPending ? (
          <SkeletonCards count={3} height={420} />
        ) : (
          <>
            {total === 0 && (
              <Empty
                title="Nothing matching your interests yet."
                hint="Add a few interests on your profile — or drop the first story yourself."
              />
            )}

            {lead && (
              /* After hrs leads on the picture: the photo takes one column of the
                 slab and the story sits in the other, so the tab opens on a face
                 rather than a headline. */
              <article className="relative mb-[18px] grid overflow-hidden rounded-[28px] bg-acc text-on-acc [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
                <StoryPhoto
                  story={lead}
                  className="min-h-[300px] bg-white/[.12]"
                  emojiClassName="text-[86px]"
                />

                <div className="flex min-w-0 flex-col justify-center p-[clamp(26px,3.4vw,40px)]">
                  <p className="m-0 mb-3.5 text-[13px] font-bold tracking-[.14em] uppercase opacity-[.78]">
                    Latest from after hrs
                  </p>
                  <h3 className="rx-display m-0 text-[clamp(28px,3.6vw,42px)] leading-[1.03] tracking-[-.032em]">
                    {lead.title}
                  </h3>
                  {lead.user && (
                    <p className="m-0 mt-3 text-[17px] font-bold opacity-90">
                      {lead.user.name} · {personMeta(lead.user)}
                    </p>
                  )}
                  {lead.body && (
                    <p className="m-0 mt-3.5 text-[18px] leading-[1.45] opacity-[.88]">{lead.body}</p>
                  )}

                  <div className="h-6" />

                  <div className="flex flex-wrap items-center gap-[9px]">
                    <LeadReactions story={lead} onReact={toggleReaction.mutate} />

                    {lead.user && lead.user.id !== user?.id && (
                      <button
                        type="button"
                        onClick={() => openRequest(lead.user, lead.title)}
                        className="min-h-[48px] cursor-pointer rounded-full border-[1.5px] border-current bg-transparent px-[22px] py-3 text-base font-bold opacity-85 transition-opacity duration-200 hover:opacity-100"
                      >
                        Ask about it
                      </button>
                    )}
                    {lead.user?.id === user?.id && !lead.ama_id && (
                      <button
                        type="button"
                        onClick={() => toAma.mutate(lead.id)}
                        disabled={toAma.isPending}
                        className="min-h-[48px] cursor-pointer rounded-full border-[1.5px] border-current bg-transparent px-[22px] py-3 text-base font-bold opacity-85 transition-opacity duration-200 hover:opacity-100 disabled:opacity-55"
                      >
                        Turn into an AMA
                      </button>
                    )}
                  </div>
                </div>
              </article>
            )}

            <div
              className={`grid gap-[18px] [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))] ${
                total === 0 ? 'mt-[18px]' : ''
              }`}
            >
              <DropMine
                onPost={(text, clear) => dropStory.mutate(text, { onSuccess: clear })}
                onMore={() => setCreating(true)}
                pending={dropStory.isPending}
              />

              {rest.map((story) => (
                <article
                  key={story.id}
                  className="animate-rise min-w-0 overflow-hidden rounded-[26px] border border-edge bg-white hover:-translate-y-[7px] hover:shadow-[0_24px_48px_rgb(20_18_15/0.10)]"
                  style={{ transition: CARD_TRANSITION }}
                >
                  <StoryPhoto story={story} className="h-[230px] bg-sand" emojiClassName="text-[64px]" />

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
