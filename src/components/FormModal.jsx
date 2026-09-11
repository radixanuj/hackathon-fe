import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import Modal from './Modal'
import { titleCase } from '../lib/format'

// Everything not listed here falls back to a plain text input.
const INPUT_TYPES = { datetime: 'datetime-local', date: 'date', number: 'number' }

/**
 * A datetime-local input yields a naked wall-clock string ("2026-09-11T18:30")
 * with no offset, and the API parses that as UTC. Left alone, every time the
 * user picks is stored shifted by their offset — and `after:now` rejects
 * perfectly valid times for anyone behind UTC. So a datetime field leaves here
 * as a real instant; a `date` field is a plain calendar day and stays as-is.
 */
function normalise(values, fields) {
  const out = { ...values }
  for (const field of fields) {
    if (field.type !== 'datetime') continue
    const value = out[field.key]
    if (!value) continue
    const at = new Date(value)
    if (!Number.isNaN(at.valueOf())) out[field.key] = at.toISOString()
  }
  return out
}

/**
 * The design's "Create something" sheet: a title, a line of intent, a handful
 * of fields, and one button. Field-driven so groups, events, recommendations
 * and stories all reuse it.
 *
 * fields: { key, label, placeholder?, options?, min?, max?,
 *            type?: 'text' | 'textarea' | 'select' | 'datetime' | 'date' | 'number' }
 */
export default function FormModal({ title, intent, fields, submitLabel, onSubmit, onDone, onClose }) {
  const [values, setValues] = useState(() =>
    Object.fromEntries(fields.map((field) => [field.key, field.initial ?? (field.type === 'select' ? field.options?.[0] ?? '' : '')])),
  )

  const mutation = useMutation({
    mutationFn: () => onSubmit(normalise(values, fields)),
    onSuccess: (result) => {
      onDone?.(result)
      onClose()
    },
  })

  const set = (key) => (event) => setValues((current) => ({ ...current, [key]: event.target.value }))
  const error = mutation.error

  return (
    <Modal onClose={onClose} maxWidth={540} zIndex={140} showClose={false}>
      <h2 className="rx-display m-0 text-[34px] tracking-[-.032em]">{title}</h2>
      {intent && <p className="m-0 mt-[10px] mb-6 text-[17px] text-muted">{intent}</p>}

      {fields.map((field) => (
        <div key={field.key} className="mb-4">
          <p className="rx-label">{field.label}</p>
          {field.type === 'textarea' ? (
            <textarea
              className="rx-textarea"
              placeholder={field.placeholder}
              value={values[field.key]}
              onChange={set(field.key)}
            />
          ) : field.type === 'select' ? (
            <select className="rx-input" value={values[field.key]} onChange={set(field.key)}>
              {field.options.map((option) => (
                <option key={option} value={option}>
                  {titleCase(option)}
                </option>
              ))}
            </select>
          ) : (
            <input
              className="rx-input"
              type={INPUT_TYPES[field.type] ?? 'text'}
              placeholder={field.placeholder}
              value={values[field.key]}
              onChange={set(field.key)}
              min={field.min}
              max={field.max}
            />
          )}
          {error?.fieldError?.(field.key) && (
            <p className="m-0 mt-1.5 text-[14px] font-semibold text-[#B90F33]">{error.fieldError(field.key)}</p>
          )}
        </div>
      ))}

      {error && !error.errors && (
        <p className="m-0 mt-2 text-[15px] font-semibold text-[#B90F33]">{error.message}</p>
      )}

      <div className="mt-3 flex flex-wrap gap-[10px]">
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="rx-btn rx-btn-acc flex-[1_1_180px] rounded-ctl py-[17px] text-[17px]"
          style={{ minHeight: 54 }}
        >
          {mutation.isPending ? 'Sending…' : submitLabel}
        </button>
        <button onClick={onClose} className="rx-btn rx-btn-ghost rounded-ctl px-[22px] py-[17px] text-[17px]" style={{ minHeight: 54 }}>
          Cancel
        </button>
      </div>
    </Modal>
  )
}
