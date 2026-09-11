import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { createRequest } from '../api/sessions'
import { titleCase } from '../lib/format'
import { buildDays, buildTimes, slotLabel } from '../lib/slots'
import Modal from './Modal'
import SlotPicker from './SlotPicker'
import { useToast } from './Toast'

const CATEGORIES = ['work_knowledge', 'career', 'leadership', 'people', 'technical', 'personal_experience']

/**
 * The three ways into a session read differently, so each one gets its own
 * copy, default length and starting category. They all post the same row.
 */
const KINDS = {
  knowledge: {
    eyebrow: '30 minutes with',
    intent: 'One topic, one half hour. They can accept, move it, or pass.',
    category: 'work_knowledge',
    durations: [30, 45],
    topicLabel: "I'd like to talk about",
    // The topic came off a skill tag, so it is not the asker's to rewrite.
    topicLocked: true,
    submit: 'Send request',
    sent: (name) => `Sent. ${name} can accept, suggest another time, or pass.`,
  },
  mentoring: {
    eyebrow: 'Ask for mentoring from',
    intent: 'A standing conversation about your work and where you want it to go.',
    category: 'career',
    durations: [30, 45, 60],
    topicLabel: 'What would you like mentoring on?',
    topicLocked: false,
    suggestions: [
      'Career direction',
      'Growing into a lead role',
      'Getting better at my craft',
      'Finding my next move',
    ],
    submit: 'Ask for a mentor',
    sent: (name) => `Asked. ${name} can accept, suggest another time, or pass.`,
  },
  coaching: {
    eyebrow: 'Set up coaching with',
    intent: 'A handful of focused sessions on one thing. The first one starts here.',
    category: 'leadership',
    durations: [45, 60, 90],
    topicLabel: 'What do you want to work on?',
    topicLocked: false,
    suggestions: [
      'Leading a team',
      'Speaking up in rooms',
      'Managing my time',
      'A hard conversation coming up',
    ],
    submit: 'Request coaching',
    sent: (name) => `Sent. ${name} can accept, suggest another time, or pass.`,
  },
}

export default function SessionRequestModal({ person, topic, kind = 'knowledge', onClose }) {
  const say = useToast()
  const queryClient = useQueryClient()
  const config = KINDS[kind] ?? KINDS.knowledge

  // First working day, mid-morning: the least surprising default, and one the
  // recipient can move if it doesn't suit.
  const firstSlot = useMemo(() => buildTimes(buildDays(1)[0])[1].value, [])

  const [subject, setSubject] = useState(topic ?? '')
  const [note, setNote] = useState('')
  const [slot, setSlot] = useState(firstSlot)
  const [category, setCategory] = useState(config.category)
  const [duration, setDuration] = useState(config.durations[0])

  const mutation = useMutation({
    mutationFn: () =>
      createRequest({
        recipient_id: person.id,
        kind,
        topic: subject.trim(),
        category,
        message: note || undefined,
        duration_minutes: duration,
        proposed_at: slot,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-requests'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      onClose()
      say(config.sent(person.name.split(' ')[0]))
    },
  })

  return (
    <Modal onClose={onClose} maxWidth={560} zIndex={140} showClose={false}>
      <p className="rx-eyebrow m-0">{config.eyebrow}</p>
      <h2 className="rx-display m-0 mt-2 text-[34px]">{person.name}</h2>
      <p className="m-0 mt-2 text-[16px] text-muted">{config.intent}</p>

      <p className="m-0 mt-[22px] mb-2 text-[16.5px] font-bold">{config.topicLabel}</p>
      {config.topicLocked ? (
        <div className="inline-flex rounded-full bg-tint px-[18px] py-[11px] text-base font-bold text-acc-ink">
          {subject}
        </div>
      ) : (
        <>
          <input
            className="rx-input"
            placeholder="One line is plenty…"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
          />
          <div className="mt-[10px] flex flex-wrap gap-2">
            {config.suggestions.map((value) => (
              <button
                key={value}
                onClick={() => setSubject(value)}
                className={`rx-pill ${subject === value ? 'rx-pill-on' : ''}`}
              >
                {value}
              </button>
            ))}
          </div>
        </>
      )}

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

      <p className="m-0 mt-6 mb-2 text-[16.5px] font-bold">How long?</p>
      <div className="flex flex-wrap gap-[9px]">
        {config.durations.map((value) => (
          <button
            key={value}
            onClick={() => setDuration(value)}
            className={`rx-pill ${duration === value ? 'rx-pill-on' : ''}`}
          >
            {value} min
          </button>
        ))}
      </div>

      <p className="m-0 mt-[22px] mb-[10px] text-[16.5px] font-bold">Pick a time</p>
      <SlotPicker value={slot} onChange={setSlot} />
      <p className="m-0 mt-3 text-[15px] text-muted">
        Proposing <strong className="font-bold text-ink">{slotLabel(slot)}</strong> · {duration} minutes.
        They can suggest another time.
      </p>

      {mutation.error && (
        <p className="mt-4 text-[15px] font-semibold text-[#B90F33]">{mutation.error.message}</p>
      )}

      <div className="mt-7 flex flex-wrap gap-[10px]">
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !subject.trim()}
          className="rx-btn rx-btn-acc flex-[1_1_180px] rounded-ctl py-[17px] text-[17px]"
          style={{ minHeight: 54 }}
        >
          {mutation.isPending ? 'Sending…' : config.submit}
        </button>
        <button
          onClick={onClose}
          className="rx-btn rx-btn-ghost rounded-ctl px-[22px] py-[17px] text-[17px]"
          style={{ minHeight: 54 }}
        >
          Cancel
        </button>
      </div>
    </Modal>
  )
}
