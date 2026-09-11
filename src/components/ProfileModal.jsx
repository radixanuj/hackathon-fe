import { useQuery } from '@tanstack/react-query'
import { listStories } from '../api/stories'
import { getUser } from '../api/people'
import { personMeta, tenureLabel } from '../lib/format'
import Avatar from './Avatar'
import Modal from './Modal'
import { ErrorNote } from './States'
import { useOverlays } from './Overlays'

function TagRow({ label, tags, variant }) {
  if (!tags?.length) return null
  return (
    <div className="min-w-0">
      <p className="rx-eyebrow m-0 mb-3">{label}</p>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span key={tag.id ?? tag.slug ?? tag.name} className={`rx-chip ${variant}`}>
            {tag.name ?? tag}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function ProfileModal({ userId, onClose }) {
  const { openRequest } = useOverlays()

  const { data: person, isPending, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUser(userId),
  })

  // "Recent story" panel — the profile itself doesn't carry stories.
  const { data: stories } = useQuery({
    queryKey: ['stories', { user_id: userId, per_page: 1 }],
    queryFn: () => listStories({ user_id: userId, per_page: 1 }),
    enabled: Boolean(userId),
  })
  const story = stories?.items?.[0]

  return (
    <Modal onClose={onClose} maxWidth={760}>
      {isPending && <p className="py-8 text-[16.5px] text-muted">Loading profile…</p>}
      <ErrorNote error={error} />

      {person && (
        <>
          <div className="-mt-3 flex flex-wrap items-center gap-[22px]">
            <Avatar person={person} size={104} radius={28} />
            <div className="min-w-0">
              <h2 className="rx-display m-0 text-[clamp(30px,4vw,44px)]">{person.name}</h2>
              <p className="m-0 mt-[10px] text-[18.5px] text-muted">
                {person.job_title ? `${person.job_title} · ` : ''}
                {personMeta(person)}
              </p>
              <p className="m-0 mt-1 text-[16.5px] font-bold text-acc-ink">{tenureLabel(person)}</p>
            </div>
            {person.open_to_mentoring ? (
              <button
                onClick={() => openRequest(person, 'A first conversation')}
                className="rx-btn rx-btn-acc rx-btn-lg ml-auto"
              >
                Request 30 mins
              </button>
            ) : (
              <p className="ml-auto max-w-[180px] text-[14.5px] text-faint">
                Not taking session requests right now.
              </p>
            )}
          </div>

          {person.intro && (
            <>
              <p className="rx-eyebrow m-0 mt-7">About me</p>
              <p className="m-0 mt-[10px] max-w-[620px] text-[18px] leading-[1.55]">{person.intro}</p>
            </>
          )}

          <div className="mt-[30px] grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
            <TagRow label="Can talk about" tags={person.can_talk_about} variant="rx-chip-tint" />
            <TagRow label="Want to learn" tags={person.want_to_learn} variant="rx-chip-outline" />
          </div>

          {(person.can_help_with?.length > 0 || person.interests?.length > 0) && (
            <div className="mt-[30px] rounded-tile bg-cream p-[26px]">
              {person.can_help_with?.length > 0 && (
                <>
                  <p className="rx-eyebrow m-0 mb-[14px]">Can help with</p>
                  <div className="flex flex-wrap gap-[9px]">
                    {person.can_help_with.map((tag) => (
                      <span key={tag.id} className="rx-chip bg-white">
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </>
              )}
              {person.interests?.length > 0 && (
                <>
                  <p className="rx-eyebrow m-0 mt-[26px] mb-[14px]">Outside work</p>
                  <div className="flex flex-wrap gap-[9px]">
                    {person.interests.map((tag) => (
                      <span
                        key={tag.id}
                        className="rx-chip bg-white transition-transform duration-200 ease-[cubic-bezier(.2,1.5,.3,1)] hover:-translate-y-[3px] hover:-rotate-2"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {story && (
            <div className="mt-6 rounded-tile border border-edge p-[26px]">
              <p className="rx-eyebrow m-0 mb-[10px]">Recent story</p>
              <h3 className="rx-title m-0 text-2xl">{story.title}</h3>
              <p className="m-0 mt-[10px] text-[16.5px] leading-[1.5] text-muted">{story.body}</p>
            </div>
          )}
        </>
      )}
    </Modal>
  )
}
