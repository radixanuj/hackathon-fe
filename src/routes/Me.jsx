import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { me as fetchMe } from '../api/auth'
import { listGroups } from '../api/groups'
import { getQuest, regenerateQuest, updateTarget } from '../api/quest'
import { updateMe } from '../api/people'
import { useAuth } from '../auth/AuthContext'
import Avatar from '../components/Avatar'
import FormModal from '../components/FormModal'
import { useOverlays } from '../components/Overlays'
import QuestComplete from '../components/QuestComplete'
import { ErrorNote } from '../components/States'
import TagEditor from '../components/TagEditor'
import { useToast } from '../components/Toast'
import { personMeta, tenureLabel } from '../lib/format'

export default function Me() {
  const { user, setUser, signOut } = useAuth()
  const say = useToast()
  const queryClient = useQueryClient()
  const { openProfile } = useOverlays()
  const [editing, setEditing] = useState(false)
  const [celebrating, setCelebrating] = useState(false)

  const { data: profile, error } = useQuery({
    queryKey: ['me'],
    queryFn: fetchMe,
    initialData: user,
  })

  const { data: quest } = useQuery({ queryKey: ['quest'], queryFn: getQuest })
  const { data: groups } = useQuery({
    queryKey: ['groups', { mine: true }],
    queryFn: () => listGroups({ mine: true, per_page: 50 }),
  })

  const refreshQuest = () => queryClient.invalidateQueries({ queryKey: ['quest'] })

  const mark = useMutation({
    mutationFn: ({ id, status }) => updateTarget(id, { status }),
    onSuccess: async (_, variables) => {
      await refreshQuest()
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      // The quest auto-completes server-side once nothing is pending.
      const fresh = await queryClient.fetchQuery({ queryKey: ['quest'], queryFn: getQuest })
      if (variables.status === 'met' && fresh?.status === 'completed') setCelebrating(true)
    },
    onError: (caught) => say(caught.message),
  })

  const regenerate = useMutation({
    mutationFn: regenerateQuest,
    onSuccess: () => {
      refreshQuest()
      say('Five new people to meet.')
    },
    onError: (caught) => say(caught.message),
  })

  const targets = quest?.targets ?? []
  const metCount = quest?.met_count ?? targets.filter((target) => target.status === 'met').length
  const percent = targets.length ? Math.round((metCount / targets.length) * 100) : 0
  const teamCount = new Set(targets.map((target) => target.person?.team).filter(Boolean)).size
  const locationCount = new Set(targets.map((target) => target.person?.location).filter(Boolean)).size

  if (error) return <div className="pt-14"><ErrorNote error={error} /></div>

  return (
    <section className="animate-rise pt-[52px]">
      {celebrating && (
        <QuestComplete onClose={() => setCelebrating(false)} teams={teamCount} locations={locationCount} />
      )}

      {/* --- Header ------------------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-[26px]">
        <span className="grid h-28 w-28 flex-none place-items-center rounded-[30px] bg-acc font-display text-[40px] font-extrabold text-on-acc">
          {(profile?.name ?? '?')
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part[0])
            .join('')
            .toUpperCase()}
        </span>
        <div className="min-w-0">
          <h1 className="rx-display m-0 text-[clamp(32px,4.4vw,50px)]">{profile?.name}</h1>
          <p className="m-0 mt-2.5 text-[19px] text-muted">
            {profile?.job_title ? `${profile.job_title} · ` : ''}
            {personMeta(profile)}
          </p>
          <p className="m-0 mt-1 text-[17px] font-bold text-acc-ink">{tenureLabel(profile)}</p>
        </div>
        <div className="ml-auto flex flex-wrap gap-[10px]">
          <button
            onClick={() => setEditing(true)}
            className="rx-btn rx-btn-dark rx-btn-lg whitespace-nowrap"
          >
            Edit profile
          </button>
          <button
            onClick={() => profile?.id && openProfile(profile.id)}
            className="rx-btn rx-btn-ghost rx-btn-lg whitespace-nowrap"
          >
            How others see me
          </button>
          <button
            onClick={signOut}
            className="rx-btn rx-btn-ghost rx-btn-lg whitespace-nowrap text-muted hover:text-ink"
          >
            Sign out
          </button>
        </div>
      </div>

      {profile && <ProfileCompletion profile={profile} />}

      {profile?.intro && (
        <p className="mt-6 max-w-[640px] text-[18px] leading-[1.55]">{profile.intro}</p>
      )}

      {/* --- New Joiner Quest --------------------------------------------- */}
      {targets.length > 0 && (
        <div className="relative mt-11 animate-rise overflow-hidden rounded-panel bg-cream p-[clamp(26px,3.4vw,44px)]">
          <div className="absolute top-[-60px] right-[-60px] h-[220px] w-[220px] rounded-full bg-tint" style={{ animation: 'floatC 13s ease-in-out infinite' }} />

          <div className="relative flex flex-wrap items-end justify-between gap-[22px]">
            <div className="max-w-[520px]">
              <p className="m-0 mb-3 text-[13.5px] font-bold tracking-[.14em] text-acc-ink uppercase">
                New Joiner Quest
              </p>
              <h2 className="rx-display m-0 text-[clamp(30px,4vw,44px)] leading-[1.02]">
                Your first Radix mission
              </h2>
              <p className="m-0 mt-[14px] text-[18.5px] leading-[1.45] text-muted">
                Meet five people across Radix in your first month — deliberately across teams,
                locations and tenure.
                {quest?.days_remaining !== null && quest?.days_remaining !== undefined && (
                  <> {quest.days_remaining} days left.</>
                )}
              </p>
            </div>
            <div className="flex-none text-right">
              <p className="rx-display m-0 text-[clamp(40px,6vw,64px)] tracking-[-.04em]">
                {metCount} / {targets.length}
              </p>
              <p className="m-0 mt-0.5 text-base text-muted">people met</p>
            </div>
          </div>

          <div className="relative mt-7 h-2.5 overflow-hidden rounded-full bg-[#EDE8E0]">
            <div
              className="h-full rounded-full bg-acc transition-[width] duration-700 ease-[cubic-bezier(.2,.9,.3,1)]"
              style={{ width: `${percent}%` }}
            />
          </div>

          <div className="relative mt-[26px] grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(215px,1fr))]">
            {targets.map((target) => {
              const done = target.status === 'met'
              const skipped = target.status === 'skipped'
              return (
                <article
                  key={target.id}
                  className="min-w-0 animate-rise rounded-[22px] bg-white p-[22px] transition-transform duration-300 ease-[cubic-bezier(.2,.9,.3,1)] hover:-translate-y-[5px]"
                >
                  <div className="flex items-center gap-3">
                    <Avatar person={target.person} size={50} radius={15} />
                    {done ? (
                      <span className="ml-auto grid h-7 w-7 animate-pop place-items-center rounded-full bg-acc text-[15px] text-on-acc">
                        ✓
                      </span>
                    ) : skipped ? (
                      <span className="ml-auto text-[13px] font-bold text-faint">Skipped</span>
                    ) : (
                      <span className="ml-auto h-7 w-7 rounded-full border-2 border-edge-strong" />
                    )}
                  </div>

                  <h3 className="rx-title m-0 mt-4 text-[20px]">{target.person?.name}</h3>
                  <p className="m-0 mt-[3px] text-[14.5px] text-muted">{personMeta(target.person)}</p>
                  <p className="m-0 mt-3 mb-4 text-[15px] leading-[1.45]">{target.reason}</p>

                  {done ? (
                    <p className="m-0 text-[15px] font-bold text-acc-ink">Met ✓</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => mark.mutate({ id: target.id, status: 'met' })}
                        disabled={mark.isPending}
                        className="rx-btn w-full min-h-[46px] rounded-[13px] border-[1.5px] border-edge-strong bg-white text-[15px] hover:border-acc hover:bg-acc hover:text-on-acc"
                      >
                        We met
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openProfile(target.person.id)}
                          className="flex-1 cursor-pointer border-none bg-transparent text-[14px] font-bold text-acc-ink"
                        >
                          Profile
                        </button>
                        {!skipped && (
                          <button
                            onClick={() => mark.mutate({ id: target.id, status: 'skipped' })}
                            className="flex-1 cursor-pointer border-none bg-transparent text-[14px] font-semibold text-faint"
                          >
                            Skip
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </article>
              )
            })}
          </div>

          <button
            onClick={() => regenerate.mutate()}
            disabled={regenerate.isPending}
            className="rx-link relative mt-6"
          >
            {regenerate.isPending ? 'Finding five more…' : 'Give me five different people →'}
          </button>
        </div>
      )}

      {/* --- Profile sections --------------------------------------------- */}
      <div className="mt-[26px] grid gap-[18px] [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
        <TagEditor
          label="You can talk about"
          kind="can_talk_about"
          tags={profile?.can_talk_about}
          variant="rx-chip-tint"
        />
        <TagEditor
          label="You can help with"
          kind="can_help_with"
          tags={profile?.can_help_with}
          variant="rx-chip-tint"
        />
        <TagEditor label="You want to learn" kind="want_to_learn" tags={profile?.want_to_learn} />
        <TagEditor label="Outside work" kind="interest" tags={profile?.interests} />

        <div className="rx-card min-w-0 animate-rise rounded-tile p-[26px]">
          <p className="rx-eyebrow m-0 mb-[14px]">Your groups</p>
          {(groups?.items ?? []).length ? (
            <div className="flex flex-wrap gap-2">
              {groups.items.map((group) => (
                <span key={group.id} className="rx-chip rx-chip-sand">
                  {group.emoji} {group.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="m-0 text-[15px] text-faint">You haven't joined any yet.</p>
          )}
        </div>
      </div>

      {editing && profile && (
        <FormModal
          title="Edit profile"
          intent="This is what tells someone why they'd want to talk to you."
          submitLabel="Save"
          onClose={() => setEditing(false)}
          onDone={(updated) => {
            setUser(updated)
            queryClient.invalidateQueries({ queryKey: ['me'] })
            say('Profile updated.')
          }}
          fields={[
            { key: 'job_title', label: 'Job title', initial: profile.job_title ?? '', placeholder: 'Product Designer' },
            { key: 'team', label: 'Team', initial: profile.team ?? '', placeholder: 'Design' },
            { key: 'location', label: 'Location', initial: profile.location ?? '', placeholder: 'Mumbai' },
            { key: 'pronouns', label: 'Pronouns', initial: profile.pronouns ?? '', placeholder: 'they/them' },
            {
              key: 'intro',
              label: 'Intro',
              type: 'textarea',
              initial: profile.intro ?? '',
              placeholder: 'What you do, and the thing people would never guess.',
            },
            {
              key: 'open_to_mentoring',
              label: 'Open to session requests?',
              type: 'select',
              options: ['yes', 'no'],
              initial: profile.open_to_mentoring ? 'yes' : 'no',
            },
          ]}
          onSubmit={(values) =>
            updateMe({
              job_title: values.job_title || null,
              team: values.team || null,
              location: values.location || null,
              pronouns: values.pronouns || null,
              intro: values.intro || null,
              open_to_mentoring: values.open_to_mentoring === 'yes',
            })
          }
        />
      )}
    </section>
  )
}

/**
 * Design lines 883-891: a friendly nudge sitting under the header telling you
 * how full your profile is. We derive the percent from what's actually on the
 * profile (intro plus three tag sections), so it settles at 100% once the four
 * things people search on are filled in.
 */
function ProfileCompletion({ profile }) {
  const checks = [
    { done: (profile.can_talk_about ?? []).length > 0, missing: 'something you can talk about' },
    { done: (profile.want_to_learn ?? []).length > 0, missing: 'something you want to learn' },
    { done: (profile.interests ?? []).length > 0, missing: 'an interest or group' },
    { done: Boolean((profile.intro ?? '').trim()), missing: 'a line about yourself' },
  ]
  const missing = checks.filter((c) => !c.done)
  const pct = Math.round(((checks.length - missing.length) / checks.length) * 100)
  const hint =
    pct >= 100
      ? 'Everything filled in. People can actually find you now.'
      : `Add ${missing[0].missing} so people know why to reach out.`

  return (
    <div className="mt-[26px] flex animate-rise flex-wrap items-center gap-[18px] rounded-[22px] border border-line bg-cream p-[22px_24px]">
      <div className="min-w-0 flex-1 basis-[260px]">
        <p className="m-0 mb-2.5 text-[16.5px] font-bold">Your profile is {pct}% there</p>
        <div className="h-[9px] overflow-hidden rounded-full bg-[#EDE8E0]">
          <div
            className="h-full rounded-full bg-acc transition-[width] duration-700 ease-[cubic-bezier(.2,.9,.3,1)]"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <p className="m-0 flex-1 basis-[240px] text-[16px] text-muted text-pretty">{hint}</p>
    </div>
  )
}
