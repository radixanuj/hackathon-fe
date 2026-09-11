import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { updatePair } from '../api/meetups'
import { personMeta, tenureLabel } from '../lib/format'
import { buildSlots } from '../lib/slots'
import Avatar from './Avatar'
import Modal from './Modal'
import { useOverlays } from './Overlays'
import TimeSlots from './TimeSlots'
import { useToast } from './Toast'

/** The full-screen "finding someone" moment, held while matching runs. */
export function MatchingOverlay({ label = 'Finding someone outside your circle…' }) {
  return createPortal(
    <div className="fixed inset-0 z-[120] grid animate-fade place-items-center bg-white">
      <div className="p-6 text-center">
        <div className="relative flex h-[230px] items-center justify-center gap-2">
          <div className="absolute h-[170px] w-[170px] rounded-full border-2 border-acc-soft" style={{ animation: 'ring 2.4s ease-out infinite' }} />
          <div className="h-[150px] w-[118px] rounded-[22px] bg-acc shadow-[0_18px_38px_rgb(20_18_15/0.14)]" style={{ animation: 'driftL 1.6s ease-in-out infinite' }} />
          <div className="h-[150px] w-[118px] rounded-[22px] bg-[#EFE6D8] shadow-[0_18px_38px_rgb(20_18_15/0.14)]" style={{ animation: 'driftR 1.6s ease-in-out infinite' }} />
        </div>
        <p className="rx-title m-0 mt-[34px] text-[clamp(24px,3.4vw,34px)]">{label}</p>
      </div>
    </div>,
    document.body,
  )
}

const STARTERS = [
  'What was the last thing you did outside work that genuinely surprised you?',
  'What does your team actually argue about?',
  'What do you know now that you wish someone had told you in month one?',
]

/** The reveal: who you got, why, and two ways to act on it. */
export function MatchRevealModal({ pair, onClose }) {
  const { openProfile } = useOverlays()
  const say = useToast()
  const queryClient = useQueryClient()
  const slots = useMemo(() => buildSlots(), [])
  const [slot, setSlot] = useState(null)

  // A blind meetup is scheduled on the pairing itself — it isn't a mentoring
  // request, and routing it through /session-requests would be refused for
  // anyone who has session requests turned off.
  const schedule = useMutation({
    mutationFn: (scheduledAt) => updatePair(pair.id, { status: 'scheduled', scheduled_at: scheduledAt }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetup-round'] })
      queryClient.invalidateQueries({ queryKey: ['meetup-pairs'] })
      onClose()
      say("Locked in. You'll both see it on Connect.")
    },
    onError: (caught) => say(caught.message),
  })

  const partner = pair?.partner
  if (!partner) return null

  return (
    <Modal onClose={onClose} maxWidth={600} zIndex={130} showClose={false}>
      <div className="mb-1.5 flex justify-center">
        <span className="relative z-[2] h-[106px] w-[86px] rounded-[20px] bg-acc" style={{ animation: 'joinL .7s cubic-bezier(.2,1.2,.3,1) both' }} />
        <span style={{ animation: 'joinR .7s cubic-bezier(.2,1.2,.3,1) both' }}>
          <Avatar person={partner} size={86} radius={20} style={{ height: 106 }} />
        </span>
      </div>

      <h2 className="rx-display m-0 mt-[18px] text-center text-[clamp(32px,4.6vw,46px)]">
        Meet {partner.name.split(' ')[0]} 👋
      </h2>
      <p className="m-0 mt-3 text-center text-[19px] text-muted">
        {partner.name} · {personMeta(partner)} · {tenureLabel(partner)}
      </p>
      {pair.match_reason && (
        <p className="mx-auto mt-5 mb-6 max-w-[440px] text-center text-[18px] leading-[1.5]">
          {pair.match_reason}
        </p>
      )}

      <div className="rounded-[20px] bg-cream p-[22px]">
        <p className="rx-eyebrow m-0 mb-3">If you get stuck</p>
        {STARTERS.map((line) => (
          <p key={line} className="m-0 mb-[10px] text-[16.5px] leading-[1.45]">
            — {line}
          </p>
        ))}
      </div>

      <p className="rx-eyebrow m-0 mt-6 mb-2">Pick a time</p>
      <TimeSlots size="sm" slots={slots} value={slot} onChange={setSlot} />

      <div className="mt-5 flex flex-wrap gap-[10px]">
        <button
          onClick={() => schedule.mutate(slot)}
          disabled={!slot || schedule.isPending}
          className="rx-btn rx-btn-acc flex-[1_1_190px] rounded-ctl py-[17px] text-[17px]"
          style={{ minHeight: 54 }}
        >
          {schedule.isPending ? 'Scheduling…' : slot ? 'Lock it in' : 'Pick a time above'}
        </button>
        <button
          onClick={() => {
            onClose()
            openProfile(partner.id)
          }}
          className="rx-btn rx-btn-ghost flex-[1_1_190px] rounded-ctl py-[17px] text-[17px]"
          style={{ minHeight: 54 }}
        >
          View {partner.name.split(' ')[0]}'s profile
        </button>
      </div>
    </Modal>
  )
}
