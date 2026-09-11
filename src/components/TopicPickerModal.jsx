import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { searchTags } from '../api/people'
import Modal from './Modal'
import { ErrorNote } from './States'

/**
 * Every topic somebody has put on their profile, searchable.
 *
 * The Pick a Brain card shows the eight most-offered ones; this is the rest of
 * them. Choosing one closes the sheet and drops the slug into the URL, which is
 * what the people strip on the page reads.
 */
export default function TopicPickerModal({ selected, onSelect, onClose }) {
  const [query, setQuery] = useState('')

  const { data, isPending, error } = useQuery({
    queryKey: ['tags', { type: 'skill', q: query.trim() || undefined, limit: 100 }],
    queryFn: () => searchTags({ type: 'skill', q: query.trim() || undefined, limit: 100 }),
  })

  const topics = data?.items ?? []

  return (
    <Modal onClose={onClose} maxWidth={640} zIndex={130}>
      <p className="rx-eyebrow m-0">Knowledge sessions</p>
      <h2 className="rx-display m-0 mt-2 text-[clamp(28px,3.4vw,36px)]">What do you want to learn?</h2>
      <p className="m-0 mt-2.5 text-[16.5px] leading-[1.45] text-muted">
        Everything people have offered to talk about. Pick one and we'll show you who knows it.
      </p>

      <input
        className="rx-input mt-5"
        placeholder="Search topics…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        autoFocus
      />

      <ErrorNote error={error} className="mt-5" />

      <div className="mt-5 max-h-[52vh] overflow-y-auto pr-1">
        {isPending ? (
          <p className="m-0 py-6 text-[16.5px] text-muted">Loading topics…</p>
        ) : topics.length === 0 ? (
          <p className="m-0 py-8 text-center text-[16.5px] text-muted">
            No topic by that name yet.
          </p>
        ) : (
          <div className="flex flex-wrap gap-[9px]">
            {topics.map((tag) => (
              <button
                key={tag.id}
                onClick={() => {
                  onSelect(tag.slug)
                  onClose()
                }}
                className={
                  selected === tag.slug
                    ? 'rx-btn rx-btn-acc min-h-[46px] rounded-[15px] px-[18px] text-[15.5px]'
                    : 'rx-btn min-h-[46px] rounded-[15px] border-[1.5px] border-edge-soft bg-white px-[18px] text-[15.5px] font-semibold text-ink hover:-translate-y-[3px] hover:border-acc hover:bg-tint'
                }
              >
                {tag.name}
                {tag.usage_count > 0 && (
                  <span className="ml-2 text-[13.5px] font-semibold opacity-60">{tag.usage_count}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
