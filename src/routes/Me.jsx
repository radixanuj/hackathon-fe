import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { me as fetchMe } from '../api/auth'
import { listGroups } from '../api/groups'
import { updateMe } from '../api/people'
import { useAuth } from '../auth/AuthContext'
import CurrentlyEditor from '../components/CurrentlyEditor'
import FormModal from '../components/FormModal'
import { useOverlays } from '../components/Overlays'
import { ErrorNote } from '../components/States'
import TagEditor from '../components/TagEditor'
import { useToast } from '../components/Toast'
import { personMeta, personPhoto, tenureLabel } from '../lib/format'

export default function Me() {
  const { user, setUser, signOut } = useAuth()
  const say = useToast()
  const queryClient = useQueryClient()
  const { openProfile } = useOverlays()
  const [editing, setEditing] = useState(false)

  const { data: profile, error } = useQuery({
    queryKey: ['me'],
    queryFn: fetchMe,
    initialData: user,
  })

  const { data: groups } = useQuery({
    queryKey: ['groups', { mine: true }],
    queryFn: () => listGroups({ mine: true, per_page: 50 }),
  })

  if (error) return <div className="pt-14"><ErrorNote error={error} /></div>

  return (
    <section className="animate-rise pt-[52px]">
      {/* --- Header ------------------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-[26px]">
        <span className="relative h-28 w-28 flex-none">
          <span className="absolute inset-0 grid place-items-center overflow-hidden rounded-[30px] bg-acc font-display text-[40px] font-extrabold text-on-acc">
            {(profile?.name ?? '?')
              .split(/\s+/)
              .slice(0, 2)
              .map((part) => part[0])
              .join('')
              .toUpperCase()}
          </span>
          {personPhoto(profile) && (
            <img
              src={personPhoto(profile)}
              alt={profile?.name ?? ''}
              className="absolute inset-0 h-full w-full rounded-[30px] object-cover"
            />
          )}
          <button
            onClick={() => setEditing(true)}
            title="Change photo"
            aria-label="Change photo"
            className="absolute right-[-6px] bottom-[-6px] grid h-[38px] w-[38px] cursor-pointer place-items-center rounded-full border-[1.5px] border-edge bg-white shadow-[0_4px_12px_rgb(20_18_15_/_0.12)] transition-[transform,border-color] duration-200 ease-[cubic-bezier(.2,1.5,.3,1)] hover:scale-110 hover:border-ink"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#14120F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          </button>
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

      {/* --- Profile sections --------------------------------------------- */}
      <div className="mt-[18px] grid gap-[18px] [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
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
        <CurrentlyEditor entries={profile?.currently ?? []} />

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
    { done: (profile.currently ?? []).length > 0, missing: "what you're currently into" },
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
