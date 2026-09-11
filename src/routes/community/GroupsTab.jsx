import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { createGroup, joinGroup, leaveGroup, listGroups } from '../../api/groups'
import { getMeta } from '../../api/meta'
import FormModal from '../../components/FormModal'
import { Empty, ErrorNote, SkeletonCards } from '../../components/States'
import { useToast } from '../../components/Toast'
import { titleCase } from '../../lib/format'

/** Discovery only — the conversation itself carries on wherever it already lives. */
export default function GroupsTab() {
  const say = useToast()
  const queryClient = useQueryClient()
  const [creating, setCreating] = useState(false)
  const [mine, setMine] = useState(false)

  const { data: meta } = useQuery({ queryKey: ['meta'], queryFn: getMeta })
  const { data, isPending, error } = useQuery({
    queryKey: ['groups', { mine }],
    queryFn: () => listGroups({ mine: mine || undefined, per_page: 50 }),
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['groups'] })

  const membership = useMutation({
    mutationFn: ({ slug, isMember }) => (isMember ? leaveGroup(slug) : joinGroup(slug)),
    onSuccess: (_, variables) => {
      refresh()
      say(variables.isMember ? 'Left the group.' : "You're in. Say hello over there.")
    },
    onError: (caught) => say(caught.message),
  })

  const groups = data?.items ?? []

  return (
    <div className="mt-8 animate-rise">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-[9px]">
          <button onClick={() => setMine(false)} className={`rx-group ${!mine ? 'rx-group-on' : ''}`}>
            All groups
          </button>
          <button onClick={() => setMine(true)} className={`rx-group ${mine ? 'rx-group-on' : ''}`}>
            Mine
          </button>
        </div>
        <button onClick={() => setCreating(true)} className="rx-btn rx-btn-dark rx-btn-lg">
          Start a group
        </button>
      </div>

      <ErrorNote error={error} />

      {isPending ? (
        <SkeletonCards count={6} height={200} />
      ) : groups.length === 0 ? (
        <Empty title="No groups here yet." hint="Start the one you wish existed." />
      ) : (
        <div className="grid gap-[18px] [grid-template-columns:repeat(auto-fill,minmax(250px,1fr))]">
          {groups.map((group) => (
            <article
              key={group.id}
              className="relative flex min-h-[200px] min-w-0 animate-rise flex-col justify-between overflow-hidden rounded-tile bg-cream p-[26px] transition-all duration-[350ms] ease-[cubic-bezier(.2,.9,.3,1)] hover:-translate-y-[7px] hover:rotate-[-.6deg] hover:bg-tint"
            >
              <span className="text-[40px] leading-none">{group.emoji ?? '✨'}</span>
              <div>
                <h3 className="rx-title m-0 text-[26px] font-extrabold tracking-[-.028em]">{group.name}</h3>
                <p className="m-0 mt-2 text-[15.5px] text-muted">{group.members_count} members</p>
                {group.description && (
                  <p className="m-0 mt-2 line-clamp-2 text-[15px] leading-[1.45] text-muted">{group.description}</p>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => membership.mutate({ slug: group.slug, isMember: group.is_member })}
                    disabled={membership.isPending}
                    className={`rx-btn min-h-[42px] px-4 text-[15px] ${group.is_member ? 'rx-btn-ghost' : 'rx-btn-acc'}`}
                  >
                    {group.is_member ? 'Leave' : 'Join'}
                  </button>
                  {group.external_link && (
                    <a
                      href={group.external_link}
                      target="_blank"
                      rel="noreferrer"
                      className="rx-btn rx-btn-ghost min-h-[42px] px-4 text-[15px] no-underline"
                    >
                      Open {titleCase(group.external_platform ?? 'chat')}
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {creating && (
        <FormModal
          title="Start a group"
          intent="Discovery lives here. The conversation can stay where it already is."
          submitLabel="Put it out there"
          onClose={() => setCreating(false)}
          onDone={() => {
            refresh()
            say("It's live. People can find it now.")
          }}
          fields={[
            { key: 'name', label: 'Name', placeholder: 'Sunday Runners' },
            { key: 'emoji', label: 'Emoji', placeholder: '🏃' },
            { key: 'description', label: 'What is it?', type: 'textarea', placeholder: 'Who it is for and what actually happens.' },
            { key: 'category', label: 'Category', type: 'select', options: meta?.group_categories ?? ['other'] },
            { key: 'external_platform', label: 'Where does it live?', type: 'select', options: meta?.group_platforms ?? ['slack'] },
            { key: 'external_link', label: 'Link', placeholder: 'https://…' },
          ]}
          onSubmit={(values) =>
            createGroup({
              name: values.name,
              emoji: values.emoji || undefined,
              description: values.description || undefined,
              category: values.category,
              external_platform: values.external_platform,
              external_link: values.external_link || undefined,
            })
          }
        />
      )}
    </div>
  )
}
