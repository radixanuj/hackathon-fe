import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSummary, listNotifications, readAll } from '../api/notifications'
import { useNotificationActions } from '../lib/notifications'
import NotificationItem from './NotificationItem'
import { useToast } from './Toast'

const PANEL_SIZE = 6

/** Poll often enough that the badge feels live, rarely enough to stay cheap. */
const POLL_MS = 30_000

/**
 * The header bell: an unread count that keeps itself up to date, and a peek at
 * the most recent few without leaving the page you are on.
 */
export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const wrapper = useRef(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const say = useToast()
  const actions = useNotificationActions()

  const { data: summary } = useQuery({
    queryKey: ['notification-summary'],
    queryFn: getSummary,
    refetchInterval: POLL_MS,
    refetchOnWindowFocus: true,
  })

  // Only fetched while the panel is open — the badge alone does not need rows.
  const { data, isPending } = useQuery({
    queryKey: ['notifications', { scope: 'inbox', per_page: PANEL_SIZE }],
    queryFn: () => listNotifications({ scope: 'inbox', per_page: PANEL_SIZE }),
    enabled: open,
  })

  const readEverything = useMutation({
    mutationFn: readAll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notification-summary'] })
      say('All caught up.')
    },
    onError: (caught) => say(caught.message),
  })

  // Close on an outside click or Escape, the way the profile sheet does.
  useEffect(() => {
    if (!open) return
    const onDown = (event) => {
      if (!wrapper.current?.contains(event.target)) setOpen(false)
    }
    const onKey = (event) => event.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const unread = summary?.unread ?? 0
  const items = data?.items ?? []

  return (
    <div ref={wrapper} className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={open}
        className={`relative grid h-[42px] w-[42px] cursor-pointer place-items-center rounded-full border-[1.5px] text-[17px] transition-colors ${
          open ? 'border-ink bg-sand' : 'border-edge bg-white hover:border-ink'
        }`}
      >
        <span aria-hidden="true" className={unread ? 'animate-wiggle' : undefined}>
          🔔
        </span>
        {unread > 0 && (
          <span className="absolute -top-[3px] -right-[3px] grid h-[21px] min-w-[21px] animate-pop place-items-center rounded-full bg-acc px-[5px] text-[11.5px] font-extrabold text-on-acc">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute top-[52px] right-0 z-[80] max-h-[min(74vh,620px)] w-[min(92vw,420px)] animate-bump overflow-auto rounded-panel border border-edge bg-white p-[14px] shadow-[0_28px_70px_rgb(20_18_15/0.22)]"
        >
          <div className="flex items-center justify-between gap-3 px-1 pb-3">
            <h2 className="rx-title m-0 text-[19px]">Notifications</h2>
            {unread > 0 && (
              <button
                onClick={() => readEverything.mutate()}
                disabled={readEverything.isPending}
                className="rx-link text-[14px] disabled:opacity-50"
              >
                Mark all read
              </button>
            )}
          </div>

          {isPending && <p className="px-1 py-6 text-[15.5px] text-muted">Loading…</p>}

          {!isPending && items.length === 0 && (
            <p className="px-1 py-8 text-center text-[15.5px] text-muted">
              Nothing new. Anything that happens to you or your plans turns up here.
            </p>
          )}

          {/* grid-cols-1 rather than a bare grid: an auto track sizes to the
              widest row, and a long single-line body would push the panel wide. */}
          <div className="grid grid-cols-1 gap-2">
            {items.map((notification) => (
              <div key={notification.id} className="min-w-0" onClick={() => setOpen(false)}>
                <NotificationItem notification={notification} actions={actions} compact />
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              setOpen(false)
              navigate('/notifications')
            }}
            className="rx-btn rx-btn-ghost mt-3 w-full text-[15px]"
          >
            See all notifications
          </button>
        </div>
      )}
    </div>
  )
}
