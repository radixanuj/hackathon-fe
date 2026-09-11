import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { listUsers, searchTags } from '../api/people'
import { personMeta, tenureLabel } from '../lib/format'
import Avatar from './Avatar'
import Modal from './Modal'
import { ErrorNote } from './States'

/**
 * Everybody you could ask, in one scrollable list.
 *
 * The cards on Pick a Brain show a handful of names each; this is the "see
 * everyone" behind them. Search runs on the server, the skill filter narrows to
 * people who listed that skill under "can help with", and picking somebody
 * hands straight over to the request sheet.
 */
export default function PeoplePickerModal({
  kind = 'mentoring',
  title,
  intent,
  filters = {},
  topic,
  onPick,
  onProfile,
  onClose,
}) {
  // A caller can pin the list to one skill — "everyone who knows Kubernetes" —
  // in which case the skill chips below would only fight it.
  const lockedTag = Boolean(filters.tag)

  const [query, setQuery] = useState('')
  const [skill, setSkill] = useState(null)
  // Coaching leans on people who have been round the block; mentoring doesn't
  // have to. Either way it is a toggle, not a rule.
  const [seniorOnly, setSeniorOnly] = useState(kind === 'coaching')

  // The same curated row the Knowledge Session card shows, so the filters here
  // and the topics out on the page are the one vocabulary.
  const { data: skills } = useQuery({
    queryKey: ['tags', { type: 'skill', featured: true }],
    queryFn: () => searchTags({ type: 'skill', featured: true }),
    enabled: !lockedTag,
  })

  // Not memoised: react-query hashes the key by value, so a fresh object each
  // render is the same query.
  const params = {
    open_to_mentoring: true,
    per_page: 100,
    q: query.trim() || undefined,
    tag: skill ?? undefined,
    kind: skill ? 'can_help_with,can_talk_about' : undefined,
    tenure_band: seniorOnly ? 'senior' : undefined,
    ...filters,
  }

  const { data, isPending, error } = useQuery({
    queryKey: ['users', params],
    queryFn: () => listUsers(params),
  })

  const people = data?.items ?? []
  // One page holds a hundred; `total` is the honest number to print.
  const total = data?.meta?.total ?? people.length

  return (
    <Modal onClose={onClose} maxWidth={720} zIndex={130}>
      <p className="rx-eyebrow m-0">{kind === 'coaching' ? 'Coaching' : kind === 'mentoring' ? 'Mentoring' : 'Knowledge sessions'}</p>
      <h2 className="rx-display m-0 mt-2 text-[clamp(28px,3.4vw,36px)]">{title}</h2>
      {intent && <p className="m-0 mt-2.5 text-[16.5px] leading-[1.45] text-muted">{intent}</p>}

      <input
        className="rx-input mt-5"
        placeholder="Search by name, team, skill…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() => setSeniorOnly((current) => !current)}
          className={`rx-group ${seniorOnly ? 'rx-group-on' : ''}`}
        >
          Six years or more
        </button>
        {(lockedTag ? [] : skills?.items ?? []).map((tag) => (
          <button
            key={tag.id}
            onClick={() => setSkill(skill === tag.slug ? null : tag.slug)}
            className={`rx-group ${skill === tag.slug ? 'rx-group-on' : ''}`}
          >
            {tag.name}
          </button>
        ))}
      </div>

      <ErrorNote error={error} className="mt-5" />

      <p className="m-0 mt-5 mb-3 text-[16px] text-muted">
        {isPending ? (
          'Looking…'
        ) : (
          <>
            <strong className="font-bold text-ink">{total}</strong>{' '}
            {total === 1 ? 'person is' : 'people are'} {kind === 'mentoring' ? 'mentoring' : 'open to this'}
            {skill ? ' and listed that skill' : ''}
          </>
        )}
      </p>

      <div className="max-h-[46vh] overflow-y-auto pr-1">
        {!isPending && people.length === 0 && (
          <p className="m-0 py-8 text-center text-[16.5px] text-muted">
            Nobody matches that. Clear the filters and try again.
          </p>
        )}

        <div className="grid gap-[10px]">
          {people.map((person) => (
            <article
              key={person.id}
              className="flex flex-wrap items-center gap-[14px] rounded-tile border border-edge bg-cream p-[14px_16px]"
            >
              <Avatar person={person} size={46} radius={14} />
              <div className="min-w-0 flex-1">
                <p className="rx-title m-0 text-[18px]">{person.name}</p>
                <p className="m-0 mt-[2px] text-[14px] text-muted">
                  {[person.job_title, personMeta(person)].filter(Boolean).join(' · ')}
                </p>
                <div className="mt-[7px] flex flex-wrap gap-1.5">
                  {(person.can_help_with ?? []).slice(0, 3).map((tag) => (
                    <span key={tag.id ?? tag.slug} className="rx-chip rx-chip-sm rx-chip-sand">
                      {tag.name}
                    </span>
                  ))}
                  {person.tenure_years >= 1 && (
                    <span className="rx-chip rx-chip-sm rx-chip-outline">{tenureLabel(person)}</span>
                  )}
                </div>
              </div>
              <div className="flex flex-none gap-2">
                <button
                  onClick={() => onProfile?.(person.id)}
                  className="rx-btn rx-btn-ghost min-h-[42px] rounded-[12px] px-[14px] text-[14.5px]"
                >
                  Profile
                </button>
                <button
                  onClick={() => onPick(person, topic)}
                  className="rx-btn rx-btn-acc min-h-[42px] rounded-[12px] px-[14px] text-[14.5px]"
                >
                  {kind === 'coaching' ? 'Book coaching' : kind === 'mentoring' ? 'Ask them' : 'Book 30 mins'}
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </Modal>
  )
}
