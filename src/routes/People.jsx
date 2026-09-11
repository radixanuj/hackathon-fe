import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { getMeta } from '../api/meta'
import { listUsers, searchTags } from '../api/people'
import Avatar from '../components/Avatar'
import { useOverlays } from '../components/Overlays'
import { Empty, ErrorNote, SkeletonCards } from '../components/States'
import { personMeta } from '../lib/format'

const GROUPS = [
  { label: 'Can help with', kind: 'can_help_with', source: 'skill' },
  { label: 'Want to learn', kind: 'want_to_learn', source: 'skill' },
  { label: 'Interest', kind: 'interest', source: 'interest' },
  { label: 'Location', source: 'location' },
  { label: 'Team', source: 'team' },
]

export default function People() {
  const { openProfile } = useOverlays()
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState(GROUPS[2])
  const [selected, setSelected] = useState([])

  const { data: meta } = useQuery({ queryKey: ['meta'], queryFn: getMeta })
  const { data: skills } = useQuery({
    queryKey: ['tags', { type: 'skill', limit: 12 }],
    queryFn: () => searchTags({ type: 'skill', limit: 12 }),
  })
  const { data: interests } = useQuery({
    queryKey: ['tags', { type: 'interest', limit: 12 }],
    queryFn: () => searchTags({ type: 'interest', limit: 12 }),
  })

  // Options for the active filter group — tag slugs, or plain strings for team/location.
  const options = useMemo(() => {
    if (group.source === 'team') return (meta?.teams ?? []).map((name) => ({ label: name, value: name }))
    if (group.source === 'location') return (meta?.locations ?? []).map((name) => ({ label: name, value: name }))
    const pool = group.source === 'interest' ? interests?.items : skills?.items
    return (pool ?? []).map((tag) => ({ label: tag.name, value: tag.slug }))
  }, [group, meta, skills, interests])

  // The API narrows by one tag at a time, so the first selection goes to the
  // server and any others narrow the (generously sized) page client-side.
  const [primary, ...extra] = selected
  const params = useMemo(() => {
    const base = { q: query || undefined, per_page: 100 }
    if (!primary) return base
    if (group.source === 'team') return { ...base, team: primary }
    if (group.source === 'location') return { ...base, location: primary }
    if (group.source === 'interest') return { ...base, interest: primary }
    return { ...base, tag: primary, kind: group.kind }
  }, [query, primary, group])

  const { data, isPending, error } = useQuery({
    queryKey: ['users', params],
    queryFn: () => listUsers(params),
  })

  const people = useMemo(() => {
    const items = data?.items ?? []
    if (!extra.length) return items
    return items.filter((person) => {
      const haystack = [
        person.team,
        person.location,
        ...(person.can_talk_about ?? []).map((t) => t.slug),
        ...(person.can_help_with ?? []).map((t) => t.slug),
        ...(person.want_to_learn ?? []).map((t) => t.slug),
        ...(person.interests ?? []).map((t) => t.slug),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return extra.every((value) => haystack.includes(String(value).toLowerCase()))
    })
  }, [data, extra])

  function toggle(value) {
    setSelected((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    )
  }

  function pickGroup(next) {
    setGroup(next)
    setSelected([])
  }

  return (
    <section className="animate-rise pt-[52px]">
      <h1 className="rx-display m-0 max-w-[620px] text-[clamp(36px,5vw,58px)] text-pretty">
        Find someone worth talking to
      </h1>

      <div className="relative mt-[30px] mb-6 max-w-[660px]">
        <input
          className="rx-input rounded-[18px] px-[22px] py-5 text-[18px]"
          placeholder="Search skills, interests, teams or people..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div className="mb-[14px] flex flex-wrap gap-[9px]">
        {GROUPS.map((item) => (
          <button
            key={item.label}
            onClick={() => pickGroup(item)}
            className={`rx-group ${group.label === item.label ? 'rx-group-on' : ''}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex min-h-[46px] flex-wrap gap-[9px]">
        {options.map((option) => {
          const on = selected.includes(option.value)
          return (
            <button
              key={option.value}
              onClick={() => toggle(option.value)}
              className={`rx-pill ${on ? 'rx-pill-on' : ''}`}
            >
              {option.label}
              {on && ' ✕'}
            </button>
          )
        })}
      </div>

      <p className="mt-7 mb-[18px] text-[15.5px] font-semibold text-faint">
        {isPending ? 'Looking…' : `${people.length} ${people.length === 1 ? 'person' : 'people'}`}
      </p>

      <ErrorNote error={error} />

      {isPending ? (
        <SkeletonCards count={6} height={300} />
      ) : people.length === 0 ? (
        <Empty title="Nobody matches that yet." hint="Try a broader interest — or clear the filters." />
      ) : (
        <div className="grid gap-[18px] [grid-template-columns:repeat(auto-fill,minmax(290px,1fr))]">
          {people.map((person) => (
            <article
              key={person.id}
              onClick={() => openProfile(person.id)}
              className="rx-card rx-card-lift animate-rise cursor-pointer rounded-tile p-6"
            >
              <div className="flex items-center gap-[15px]">
                <Avatar person={person} size={66} radius={19} />
                <div className="min-w-0">
                  <h3 className="rx-title m-0 text-[22px]">{person.name}</h3>
                  <p className="m-0 mt-[3px] text-[15px] text-muted">{personMeta(person)}</p>
                </div>
              </div>

              {person.can_talk_about?.length > 0 && (
                <>
                  <p className="rx-eyebrow m-0 mt-[22px] mb-2">Can talk about</p>
                  <div className="flex flex-wrap gap-[7px]">
                    {person.can_talk_about.slice(0, 2).map((tag) => (
                      <span key={tag.id} className="rx-chip rx-chip-tint px-[14px] py-2 text-[14px]">
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </>
              )}

              {person.interests?.length > 0 && (
                <>
                  <p className="rx-eyebrow m-0 mt-[18px] mb-2">Into</p>
                  <div className="flex flex-wrap gap-[7px]">
                    {person.interests.slice(0, 2).map((tag) => (
                      <span key={tag.id} className="rx-chip rx-chip-sand px-[14px] py-2 text-[14px]">
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </>
              )}

              <p className="m-0 mt-[22px] text-[15.5px] font-bold text-acc-ink">
                View {person.name.split(' ')[0]} →
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
