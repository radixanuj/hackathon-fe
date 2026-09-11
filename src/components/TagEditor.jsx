import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { syncTags } from '../api/people'
import { useToast } from './Toast'

/**
 * One profile tag section, edited in place. The API replaces a whole section
 * at a time, so we always send the full list back.
 */
export default function TagEditor({ label, kind, tags = [], variant = 'rx-chip-sand', onSaved }) {
  const say = useToast()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(() => tags.map((tag) => tag.name))
  const [entry, setEntry] = useState('')

  const save = useMutation({
    mutationFn: (names) => syncTags(kind, names),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] })
      onSaved?.()
      setEditing(false)
      say('Profile updated.')
    },
    onError: (caught) => say(caught.message),
  })

  function start() {
    setDraft(tags.map((tag) => tag.name))
    setEntry('')
    setEditing(true)
  }

  function add() {
    const value = entry.trim()
    if (!value || draft.includes(value)) return setEntry('')
    setDraft((current) => [...current, value])
    setEntry('')
  }

  return (
    <div className="rx-card min-w-0 animate-rise rounded-tile p-[26px]">
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
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag.id} className={`rx-chip ${variant}`}>
                {tag.name}
              </span>
            ))}
          </div>
        ) : (
          <p className="m-0 text-[15px] text-faint">Nothing here yet — worth filling in.</p>
        )
      ) : (
        <>
          <div className="mb-3 flex flex-wrap gap-2">
            {draft.map((name) => (
              <button
                key={name}
                onClick={() => setDraft((current) => current.filter((item) => item !== name))}
                className={`rx-chip ${variant} cursor-pointer`}
              >
                {name} ✕
              </button>
            ))}
          </div>
          <input
            className="rx-input text-[15.5px]"
            placeholder="Add one and press Enter…"
            value={entry}
            onChange={(event) => setEntry(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                add()
              }
            }}
          />
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => save.mutate(draft)}
              disabled={save.isPending}
              className="rx-btn rx-btn-acc min-h-[42px] px-4 text-[15px]"
            >
              {save.isPending ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => setEditing(false)} className="rx-btn rx-btn-ghost min-h-[42px] px-4 text-[15px]">
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  )
}
