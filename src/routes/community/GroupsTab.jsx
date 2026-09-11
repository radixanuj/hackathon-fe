import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { createGroup, joinGroup, leaveGroup, listGroups } from '../../api/groups'
import { getMeta } from '../../api/meta'
import { AvatarStack } from '../../components/Avatar'
import FeaturedBanner, {
  BannerDone,
  BannerGhost,
  BannerPrimary,
} from '../../components/FeaturedBanner'
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

  // The banner is whichever group is busiest, not whichever the API returned
  // first, and it is only worth giving the space to once there is a grid below.
  const { groups, lead, rest } = useMemo(() => {
    const items = data?.items ?? []
    if (items.length < 2) return { groups: items, lead: null, rest: items }
    const busiest = items.reduce((best, group) =>
      (group.members_count ?? 0) > (best.members_count ?? 0) ? group : best,
    )
    return { groups: items, lead: busiest, rest: items.filter((group) => group.id !== busiest.id) }
  }, [data])

  const toggle = (group) => membership.mutate({ slug: group.slug, isMember: group.is_member })

  return (
    <div className="mt-8 animate-rise">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-[9px]">
          <button
            onClick={() => setMine(false)}
            className={`rx-group ${!mine ? 'rx-group-on' : ''}`}
          >
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
        <>
          {lead && <LeadGroup group={lead} onToggle={toggle} busy={membership.isPending} />}

          <div className="grid gap-[18px] [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
            {rest.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                onToggle={toggle}
                busy={membership.isPending}
              />
            ))}
          </div>
        </>
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
            {
              key: 'description',
              label: 'What is it?',
              type: 'textarea',
              placeholder: 'Who it is for and what actually happens.',
            },
            {
              key: 'category',
              label: 'Category',
              type: 'select',
              options: meta?.group_categories ?? ['other'],
            },
            {
              key: 'external_platform',
              label: 'Where does it live?',
              type: 'select',
              options: meta?.group_platforms ?? ['slack'],
            },
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

function memberLine(group) {
  const count = group.members_count ?? 0
  return `${count} ${count === 1 ? 'member' : 'members'}`
}

/** The accent banner above the grid. */
function LeadGroup({ group, onToggle, busy }) {
  return (
    <FeaturedBanner
      eyebrow="Busiest group right now"
      title={`${group.emoji ?? '✨'} ${group.name}`}
      meta={group.description}
      note={group.creator?.name ? `Started by ${group.creator.name}` : undefined}
      stack={group.members ?? []}
      stackLine={memberLine(group)}
    >
      {group.is_member ? (
        <BannerDone>✓ You're in</BannerDone>
      ) : (
        <BannerPrimary onClick={() => onToggle(group)} disabled={busy}>
          Join group
        </BannerPrimary>
      )}

      {group.external_link && (
        <BannerGhost as="a" href={group.external_link} target="_blank" rel="noreferrer">
          Open {titleCase(group.external_platform ?? 'chat')}
        </BannerGhost>
      )}
    </FeaturedBanner>
  )
}

function GroupCard({ group, onToggle, busy }) {
  const crew = group.members ?? []

  return (
    <article className="group flex min-w-0 animate-rise flex-col gap-3.5 rounded-[24px] border border-edge bg-white p-6 transition-[transform,box-shadow,border-color] duration-[350ms] ease-[cubic-bezier(.2,.9,.3,1)] hover:-translate-y-[7px] hover:border-edge-hover hover:shadow-[0_20px_44px_rgb(20_18_15_/_0.09)]">
      <div className="flex items-center gap-3.5">
        <span className="grid h-14 w-14 flex-none place-items-center rounded-[17px] bg-tint text-[28px] transition-transform duration-300 ease-[cubic-bezier(.2,1.4,.3,1)] group-hover:scale-[1.08] group-hover:-rotate-[8deg]">
          {group.emoji ?? '✨'}
        </span>
        <div className="min-w-0">
          <h3 className="rx-title m-0 text-[23px] font-extrabold tracking-[-.026em]">
            {group.name}
          </h3>
          <p className="m-0 mt-[3px] text-[14.5px] font-semibold text-faint">{memberLine(group)}</p>
        </div>
      </div>

      {group.description && (
        <p className="m-0 flex-1 text-[16px] leading-[1.45] text-muted">{group.description}</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {crew.length > 0 && <AvatarStack people={crew.slice(0, 4)} size={34} />}

        {group.is_member ? (
          <span className="ml-auto grid min-h-[46px] animate-pop place-items-center rounded-[13px] bg-tint px-[18px] text-[15.5px] font-bold text-acc-ink">
            ✓ In
          </span>
        ) : (
          <button
            onClick={() => onToggle(group)}
            disabled={busy}
            className="rx-btn rx-btn-acc ml-auto min-h-[46px] rounded-[13px] px-5 text-[15.5px]"
          >
            Join
          </button>
        )}
      </div>

      {group.external_link && (
        <a
          href={group.external_link}
          target="_blank"
          rel="noreferrer"
          className="rx-link self-start no-underline"
        >
          Open {titleCase(group.external_platform ?? 'chat')} →
        </a>
      )}
    </article>
  )
}
