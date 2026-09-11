import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import Modal from './Modal'
import { titleCase } from '../lib/format'

/**
 * The design's "Create something" sheet: a title, a line of intent, a handful
 * of fields, and one button. Field-driven so groups, events, recommendations
 * and stories all reuse it.
 *
 * fields: { key, label, placeholder?, type?: 'text'|'textarea'|'select'|'datetime', options?, required? }
 */
export default function FormModal({ title, intent, fields, submitLabel, onSubmit, onDone, onClose }) {
  const [values, setValues] = useState(() =>
    Object.fromEntries(fields.map((field) => [field.key, field.initial ?? (field.type === 'select' ? field.options?.[0] ?? '' : '')])),
  )

  const mutation = useMutation({
    mutationFn: () => onSubmit(values),
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
              type={field.type === 'datetime' ? 'datetime-local' : 'text'}
              placeholder={field.placeholder}
              value={values[field.key]}
              onChange={set(field.key)}
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
