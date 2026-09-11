import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { searchTags, syncTags } from '../api/people'
import { useToast } from './Toast'

/** Past this many, a section collapses behind a "show all" rather than growing. */
const VISIBLE = 5

/** Everything that isn't "Outside work" is a skill, matching the API's tag types. */
const typeFor = (kind) => (kind === 'interest' ? 'interest' : 'skill')

const same = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase()

/**
 * One profile tag section, edited in place. The API replaces a whole section
 * at a time, so we always send the full list back.
 *
 * The tag vocabulary is open: typing something nobody has used before creates
 * it. Suggestions exist to steer people onto the existing wording first, since
 * near-duplicates ("Figma" vs "Figma Design") are what make matching go quiet.
 */
export default function TagEditor({ label, kind, tags = [], variant = 'rx-chip-sand', onSaved }) {
  const say = useToast()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(() => tags.map((tag) => tag.name))
  const [entry, setEntry] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [expanded, setExpanded] = useState(false)

  const term = useDebounced(entry.trim(), 180)

  // An empty box still asks, so opening the field shows what colleagues use most.
  const { data: matches } = useQuery({
    queryKey: ['tags', { type: typeFor(kind), q: term, limit: 8 }],
    queryFn: () => searchTags({ type: typeFor(kind), q: term || undefined, limit: 8 }),
    enabled: editing,
    staleTime: 60_000,
  })

  const suggestions = (matches?.items ?? []).filter(
    (tag) => !draft.some((name) => same(name, tag.name)),
  )

  // Offer to create only when the box holds something no suggestion already says.
  const creating =
    entry.trim() && !suggestions.some((tag) => same(tag.name, entry)) && !draft.some((name) => same(name, entry))
      ? entry.trim()
      : null

  const rows = [...suggestions.map((tag) => tag.name), ...(creating ? [creating] : [])]

  // Results arrive after the keystroke that asked for them, so the highlight can
  // briefly point past the end of a shorter list.
  const highlight = Math.min(active, Math.max(rows.length - 1, 0))

  const save = useMutation({
    mutationFn: (names) => syncTags(kind, names),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] })
      // A brand-new tag should show up in autocomplete and the People filters.
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      onSaved?.()
      setEditing(false)
      setOpen(false)
      say('Profile updated.')
    },
    onError: (caught) => say(caught.message),
  })

  function start() {
    setDraft(tags.map((tag) => tag.name))
    setEntry('')
    setActive(0)
    setEditing(true)
  }

  function add(name) {
    const value = (name ?? entry).trim()
    setEntry('')
    setOpen(false)
    if (!value || draft.some((item) => same(item, value))) return
    setDraft((current) => [...current, value])
  }

  /**
   * Text still sitting in the box is part of what someone meant to save - it used
   * to be dropped silently, toast and all.
   */
  function submit() {
    const value = entry.trim()
    const names = value && !draft.some((item) => same(item, value)) ? [...draft, value] : draft
    save.mutate(names)
  }

  function onKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault()
      add(open && rows[highlight] ? rows[highlight] : undefined)
      return
    }
    if (event.key === 'ArrowDown' && rows.length) {
      event.preventDefault()
      setOpen(true)
      setActive((index) => (Math.min(index, rows.length - 1) + 1) % rows.length)
      return
    }
    if (event.key === 'ArrowUp' && rows.length) {
      event.preventDefault()
      setOpen(true)
      setActive((index) => (Math.min(index, rows.length - 1) - 1 + rows.length) % rows.length)
      return
    }
    if (event.key === 'Escape' && open) {
      event.preventDefault()
      setOpen(false)
      return
    }
    // Backspace on an empty box takes the last chip back, as tag fields tend to.
    if (event.key === 'Backspace' && !entry) {
      setDraft((current) => current.slice(0, -1))
    }
  }

  return (
    <div className="rx-card min-w-0 animate-rise rounded-tile p-[20px]">
      <div className="mb-[14px] flex items-center justify-between gap-3">
        <p className="rx-eyebrow m-0">{label}</p>
        {!editing && (
          <button onClick={start} className="cursor-pointer border-none bg-transparent text-[14px] font-bold text-acc-ink">
            Edit
          </button>
        )}
      </div>

      {!editing ? (
        tags.length ? (
          <div className="flex flex-wrap gap-1.5">
            {(expanded ? tags : tags.slice(0, VISIBLE)).map((tag) => (
              <span key={tag.id} className={`rx-chip rx-chip-sm ${variant}`}>
                {tag.name}
              </span>
            ))}

            {tags.length > VISIBLE && (
              <button
                onClick={() => setExpanded((value) => !value)}
                className="rx-chip rx-chip-sm cursor-pointer bg-transparent font-bold text-acc-ink underline decoration-transparent underline-offset-2 transition-colors hover:decoration-current"
              >
                {expanded ? 'Show less' : `+${tags.length - VISIBLE} more`}
              </button>
            )}
          </div>
        ) : (
          <p className="m-0 text-[15px] text-faint">Nothing here yet — worth filling in.</p>
        )
      ) : (
        <>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {draft.map((name) => (
              <button
                key={name}
                onClick={() => setDraft((current) => current.filter((item) => item !== name))}
                className={`rx-chip rx-chip-sm ${variant} cursor-pointer`}
              >
                {name} ✕
              </button>
            ))}
          </div>

          <div className="relative">
            <input
              className="rx-input text-[15.5px]"
              placeholder="Add one and press Enter…"
              value={entry}
              autoComplete="off"
              onChange={(event) => {
                setEntry(event.target.value)
                setActive(0)
                setOpen(true)
              }}
              onFocus={() => setOpen(true)}
              // Blur closes the list, but a click on a row fires mousedown first.
              onBlur={() => setTimeout(() => setOpen(false), 120)}
              onKeyDown={onKeyDown}
            />

            {open && rows.length > 0 && (
              <ul className="rx-card absolute top-[calc(100%+6px)] right-0 left-0 z-20 m-0 max-h-[232px] list-none overflow-auto rounded-[16px] p-[6px] shadow-[0_18px_40px_rgb(20_18_15/0.13)]">
                {suggestions.map((tag, index) => (
                  <li key={tag.id}>
                    <button
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => add(tag.name)}
                      onMouseEnter={() => setActive(index)}
                      className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-[11px] border-none px-3 py-[9px] text-left text-[15px] font-semibold ${
                        highlight === index ? 'bg-sand' : 'bg-transparent'
                      }`}
                    >
                      {tag.name}
                      {tag.usage_count > 0 && (
                        <span className="text-[13px] font-semibold text-faint">
                          {tag.usage_count} {tag.usage_count === 1 ? 'person' : 'people'}
                        </span>
                      )}
                    </button>
                  </li>
                ))}

                {creating && (
                  <li>
                    <button
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => add(creating)}
                      onMouseEnter={() => setActive(rows.length - 1)}
                      className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-[11px] border-none px-3 py-[9px] text-left text-[15px] font-semibold ${
                        highlight === rows.length - 1 ? 'bg-sand' : 'bg-transparent'
                      }`}
                    >
                      Add “{creating}”
                      <span className="text-[13px] font-semibold text-faint">new</span>
                    </button>
                  </li>
                )}
              </ul>
            )}
          </div>

          <div className="mt-3 flex gap-2">
            <button
              onClick={submit}
              disabled={save.isPending}
              className="rx-btn rx-btn-acc min-h-[42px] px-4 text-[15px]"
            >
              {save.isPending ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => {
                setEditing(false)
                setOpen(false)
              }}
              className="rx-btn rx-btn-ghost min-h-[42px] px-4 text-[15px]"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  )
}

/** Keeps the autocomplete off the wire until typing pauses. */
function useDebounced(value, delay) {
  const [settled, setSettled] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return settled
}
