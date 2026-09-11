import { useMutation, useQueryClient } from '@tanstack/react-query'
import { archive, markRead, markUnread, unarchive } from '../api/notifications'
import { useToast } from '../components/Toast'

/** The pillar each notification belongs to, worded as the nav words it. */
export const CATEGORY_LABEL = {
  people: 'People',
  connect: 'Connect',
  communities: 'Communities',
  learn: 'Learn & Share',
  do_together: 'Do Together',
  celebrate: 'Celebrate',
}

/**
 * The four things you can do to a notification, shared by the bell and the page.
 *
 * Every one invalidates both the lists and the bell's count, so the badge and
 * whichever list is on screen can never disagree.
 */
export function useNotificationActions() {
  const queryClient = useQueryClient()
  const say = useToast()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] })
    queryClient.invalidateQueries({ queryKey: ['notification-summary'] })
  }

  const settle = (message) => ({
    onSuccess: () => {
      invalidate()
      if (message) say(message)
    },
    onError: (caught) => say(caught.message),
  })

  // Spelled out rather than generated in a loop: useMutation is a hook, and
  // hooks have to be called directly and in a fixed order.
  const read = useMutation({ mutationFn: markRead, ...settle() })
  const unread = useMutation({ mutationFn: markUnread, ...settle('Marked as unread.') })
  // Nothing is ever deleted — the wording should not imply otherwise.
  const toArchive = useMutation({
    mutationFn: archive,
    ...settle('Archived. Still there under Archived.'),
  })
  const fromArchive = useMutation({ mutationFn: unarchive, ...settle('Back in your inbox.') })

  return { read, unread, archive: toArchive, unarchive: fromArchive, invalidate }
}
