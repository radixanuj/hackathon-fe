import { BoopMark, useBoop } from './Boop'
import { useNudge, nudgeLabel } from '../lib/nudges'

/**
 * The Nudge button, wherever a whole person is on screen.
 *
 * Reads `person.nudge` — the state `GET /users/{id}` ships alongside the
 * profile — so it knows whether this is a nudge, a nudge *back*, or a turn you
 * have already taken. After a tap the profile query is refetched, so the state
 * it draws is always the server's rather than a guess.
 */
export default function NudgeButton({ person, className = '' }) {
  const [poking, poke] = useBoop()
  const nudge = useNudge({ onNudged: poke })

  const state = person?.nudge

  // No state means the payload came from a list rather than a profile; assume
  // it is allowed and let the 422 correct us, which is cheaper than a lookup.
  const waiting = Boolean(state?.waiting_on_them)
  const streak = state?.streak ?? 0

  return (
    <div className={`flex flex-col items-end gap-1.5 ${className}`}>
      <button
        onClick={() => nudge.mutate(person)}
        disabled={waiting || nudge.isPending}
        title={waiting ? `Waiting for ${person.name} to nudge you back.` : undefined}
        className={`rx-btn ${state?.waiting_on_you ? 'rx-btn-acc' : 'rx-btn-ghost'} hover:rotate-[-2deg]`}
      >
        <BoopMark size={15} poking={poking} loop={nudge.isPending} />
        {nudge.isPending ? 'Nudging…' : nudgeLabel(state)}
      </button>

      {streak > 1 && (
        <span className="text-[13px] font-semibold text-faint">
          {streak} nudges between you
        </span>
      )}
    </div>
  )
}
