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
    <div ref={wrapper} className="relative flex-none">
      <button
        onClick={() => setOpen((value) => !value)}
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={open}
        className={`relative grid h-10 w-10 cursor-pointer place-items-center rounded-full border-[1.5px] bg-white text-[17px] hover:-translate-y-0.5 hover:border-ink ${
          open ? 'border-ink' : 'border-edge'
        }`}
        style={{ transition: 'translate .22s cubic-bezier(.2,1.4,.3,1), border-color .2s' }}
      >
        <span aria-hidden="true">🔔</span>
        {unread > 0 && (
          <span
            className="absolute -top-[3px] -right-[3px] grid h-5 min-w-5 place-items-center rounded-full border-2 border-white bg-acc px-[5px] text-[11.5px] font-extrabold text-on-acc"
            style={{ animation: 'pop .45s cubic-bezier(.2,1.6,.3,1) both' }}
          >
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute top-[52px] right-0 z-[80] w-[min(384px,calc(100vw-44px))] overflow-hidden rounded-[22px] border border-edge bg-white shadow-[0_28px_64px_rgb(20_18_15/0.18)]"
          style={{ animation: 'springIn .4s cubic-bezier(.2,1.25,.3,1) both' }}
        >
          <div className="flex items-center gap-3 px-[22px] pt-5 pb-3.5">
            <h2 className="m-0 font-display text-[22px] font-extrabold tracking-[-.026em]">
              Happening
            </h2>
            {unread > 0 && (
              <button
                onClick={() => readEverything.mutate()}
                disabled={readEverything.isPending}
                className="ml-auto cursor-pointer border-none bg-transparent p-0 text-[14.5px] font-bold whitespace-nowrap text-acc-ink disabled:opacity-50"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* The canvas scrolls the list inside the panel so the heading and
              "Mark all read" stay put; grid-cols-1 keeps a long single-line
              body from sizing an auto track and widening the whole panel. */}
          <div className="max-h-[56vh] overflow-auto px-2.5 pb-2.5">
            {isPending && <p className="px-1 py-6 text-[15.5px] text-muted">Loading…</p>}

            {!isPending && items.length === 0 && (
              <p className="px-1 py-8 text-center text-[15.5px] text-muted">
                Nothing new. Anything that happens to you or your plans turns up here.
              </p>
            )}

            <div className="grid grid-cols-1 gap-1">
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
              className="rx-btn rx-btn-ghost mt-2 w-full text-[15px]"
            >
              See all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
