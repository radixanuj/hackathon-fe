import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { updateCurrently } from '../api/people'
import { useToast } from './Toast'

/** The API caps it, and past four the card stops being a glance. */
const MAX = 4

/**
 * What the card offers someone starting from nothing — the three lines the
 * design ships with. Labels stay editable: the roster has people Shooting,
 * Perfecting and Relearning things too.
 */
const DEFAULTS = [
  { label: 'Reading', value: '', placeholder: 'What book?' },
  { label: 'Training for', value: '', placeholder: 'What are you training for?' },
  { label: 'Watching', value: '', placeholder: 'What show?' },
]

const LABELS = [
  'Reading', 'Watching', 'Listening to', 'Training for', 'Building', 'Playing',
  'Cooking', 'Perfecting', 'Shooting', 'Following', 'Planning', 'Learning', 'Making',
]

/**
 * "Currently into" — the part of a profile that dates itself on purpose, and
 * the one that gives somebody an opening line that isn't your job title.
 *
 * The whole list is sent on save, as tag sections are: the card is edited as
 * one block, and a partial write would leave no way to delete a line.
 */
export default function CurrentlyEditor({ entries = [], onSaved }) {
  const say = useToast()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState([])

  const save = useMutation({
    mutationFn: (rows) =>
      updateCurrently(
        rows
          .filter((row) => row.label.trim() && row.value.trim())
          .map((row) => ({ label: row.label.trim(), value: row.value.trim() })),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] })
      onSaved?.()
      setEditing(false)
      say('Profile updated.')
    },
    onError: (caught) => say(caught.message),
  })

  function start() {
    setDraft(entries.length ? entries.map((entry) => ({ label: entry.label, value: entry.value })) : DEFAULTS)
    setEditing(true)
  }

  const set = (index, key) => (event) =>
    setDraft((rows) => rows.map((row, at) => (at === index ? { ...row, [key]: event.target.value } : row)))

  return (
    <div className="rx-card min-w-0 animate-rise rounded-tile p-[20px]">
      <p className="rx-eyebrow m-0 mb-[14px]">Currently into</p>

      {!editing ? (
        <>
          {entries.length ? (
            <ul className="m-0 list-none p-0">
              {entries.map((entry, index) => (
                <li key={`${entry.label}-${index}`} className="mb-3 flex items-center gap-3 last:mb-0">
                  <span className="flex-none text-[22px] leading-none">{entry.icon}</span>
                  <p className="m-0 text-[16px] leading-[1.4]">
                    <strong className="font-bold">{entry.label}:</strong> {entry.value}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 text-[15px] text-faint">
              Nothing here yet — a book or a race is the easiest thing to talk to you about.
            </p>
          )}

          <button
            onClick={start}
            className="mt-[14px] cursor-pointer border-none bg-transparent p-0 text-[15px] font-bold text-acc-ink"
          >
            {entries.length ? 'Update these →' : 'Add a few →'}
          </button>
        </>
      ) : (
        <>
          <datalist id="rx-currently-labels">
            {LABELS.map((label) => (
              <option key={label} value={label} />
            ))}
          </datalist>

          {draft.map((row, index) => (
            <div key={index} className="mb-2.5 flex flex-wrap items-center gap-2">
              <input
                className="rx-input min-w-0 flex-[0_1_130px] text-[15px] font-bold"
                list="rx-currently-labels"
                placeholder="Reading"
                value={row.label}
                onChange={set(index, 'label')}
              />
              <input
                className="rx-input min-w-0 flex-[1_1_150px] text-[15px]"
                placeholder={row.placeholder ?? 'What is it?'}
                value={row.value}
                onChange={set(index, 'value')}
              />
              <button
                onClick={() => setDraft((rows) => rows.filter((_, at) => at !== index))}
                aria-label={`Remove ${row.label || 'line'}`}
                className="flex-none cursor-pointer border-none bg-transparent px-1 text-[16px] text-faint hover:text-ink"
              >
                ✕
              </button>
            </div>
          ))}

          {draft.length < MAX && (
            <button
              onClick={() => setDraft((rows) => [...rows, { label: '', value: '' }])}
              className="cursor-pointer border-none bg-transparent p-0 text-[14px] font-bold text-acc-ink"
            >
              + Add another
            </button>
          )}

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
