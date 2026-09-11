import { useMutation, useQueryClient } from '@tanstack/react-query'
import { sendNudge } from '../api/nudges'
import { useToast } from '../components/Toast'

/**
 * Send a nudge from anywhere — the home card, a profile, a notification.
 *
 * Deliberately does not touch the bell: a nudge notifies the person you nudged,
 * never you, so your own unread count is unchanged. What does change is their
 * profile's button and both of your lists, so those are what gets invalidated.
 *
 * `onNudged` runs after the toast, for whatever the caller wants to celebrate.
 */
export function useNudge({ onNudged } = {}) {
  const queryClient = useQueryClient()
  const say = useToast()

  return useMutation({
    mutationFn: (person) => sendNudge(person.id),
    onSuccess: (payload, person) => {
      queryClient.invalidateQueries({ queryKey: ['nudges'] })
      queryClient.invalidateQueries({ queryKey: ['user', person.id] })
      say(payload?.message ?? `You nudged ${person.name}.`)
      onNudged?.(payload?.data, person)
    },
    // The one you will actually hit: nudging someone who has not nudged back.
    onError: (caught) => say(caught.message),
  })
}

/** How a nudge exchange should be worded, given the state on a profile. */
export function nudgeLabel(state) {
  if (!state) return 'Nudge'
  if (state.waiting_on_them) return 'Nudged · their turn'
  if (state.waiting_on_you) return 'Nudge back'
  return 'Nudge'
}
