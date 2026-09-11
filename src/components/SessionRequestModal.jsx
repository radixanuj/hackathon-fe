import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { createRequest } from '../api/sessions'
import { titleCase } from '../lib/format'
import Modal from './Modal'
import TimeSlots from './TimeSlots'
import { buildSlots } from '../lib/slots'
import { useToast } from './Toast'

const CATEGORIES = ['work_knowledge', 'career', 'leadership', 'people', 'technical', 'personal_experience']

export default function SessionRequestModal({ person, topic, onClose }) {
  const say = useToast()
  const queryClient = useQueryClient()
  const slots = useMemo(() => buildSlots(), [])

  const [note, setNote] = useState('')
  const [slot, setSlot] = useState(slots[1].value)
  const [category, setCategory] = useState('work_knowledge')

  const mutation = useMutation({
    mutationFn: () =>
      createRequest({
        recipient_id: person.id,
        topic,
        category,
        message: note || undefined,
        proposed_at: slot,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-requests'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      onClose()
      say(`Sent. ${person.name.split(' ')[0]} can accept, suggest another time, or pass.`)
    },
  })

  return (
    <Modal onClose={onClose} maxWidth={540} zIndex={140} showClose={false}>
      <p className="rx-eyebrow m-0">30 minutes with</p>
      <h2 className="rx-display m-0 mt-2 text-[34px]">{person.name}</h2>

      <p className="m-0 mt-[22px] mb-2 text-[16.5px] font-bold">I'd like to talk about</p>
      <div className="inline-flex rounded-full bg-tint px-[18px] py-[11px] text-base font-bold text-acc-ink">
        {topic}
      </div>

      <p className="m-0 mt-6 mb-2 text-[16.5px] font-bold">What kind of conversation?</p>
      <div className="flex flex-wrap gap-[9px]">
        {CATEGORIES.map((value) => (
          <button
            key={value}
            onClick={() => setCategory(value)}
            className={`rx-pill ${category === value ? 'rx-pill-on' : ''}`}
          >
            {titleCase(value)}
          </button>
        ))}
      </div>

      <p className="m-0 mt-6 mb-2 text-[16.5px] font-bold">What would you like help with?</p>
      <textarea
        className="rx-textarea"
        placeholder="One or two lines is plenty…"
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />

      <p className="m-0 mt-[22px] mb-[10px] text-[16.5px] font-bold">Pick a time</p>
      <TimeSlots slots={slots} value={slot} onChange={setSlot} />

      {mutation.error && (
        <p className="mt-4 text-[15px] font-semibold text-[#B90F33]">{mutation.error.message}</p>
      )}

      <div className="mt-7 flex flex-wrap gap-[10px]">
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="rx-btn rx-btn-acc flex-[1_1_180px] rounded-ctl py-[17px] text-[17px]"
          style={{ minHeight: 54 }}
        >
          {mutation.isPending ? 'Sending…' : 'Send request'}
        </button>
        <button onClick={onClose} className="rx-btn rx-btn-ghost rounded-ctl px-[22px] py-[17px] text-[17px]" style={{ minHeight: 54 }}>
          Cancel
        </button>
      </div>
    </Modal>
  )
}
