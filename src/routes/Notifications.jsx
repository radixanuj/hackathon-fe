import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { archiveAll, listNotifications, readAll } from '../api/notifications'
import NotificationItem from '../components/NotificationItem'
import { Empty, ErrorNote, Loading } from '../components/States'
import { useToast } from '../components/Toast'
import { CATEGORY_LABEL, useNotificationActions } from '../lib/notifications'

const SCOPES = [
  { key: 'inbox', label: 'Inbox' },
  { key: 'archived', label: 'Archived' },
]

const CATEGORIES = ['people', 'connect', 'communities', 'learn', 'do_together', 'celebrate']

/**
 * Everything that has happened to you, in one place.
 *
 * Archived is a full second view rather than a bin: nothing is ever deleted, so
 * anything filed away stays readable here for as long as the account exists.
 */
export default function Notifications() {
  const [scope, setScope] = useState('inbox')
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [category, setCategory] = useState(null)
  const queryClient = useQueryClient()
  const say = useToast()
  const actions = useNotificationActions()

  // Unread is a property of the inbox; the archive is read by definition.
  const status = scope === 'inbox' && unreadOnly ? 'unread' : undefined
  const params = { scope, status, category: category ?? undefined, per_page: 50 }

  const { data, isPending, error } = useQuery({
    queryKey: ['notifications', params],
    queryFn: () => listNotifications(params),
  })

  const bulk = (mutationFn, message) => ({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notification-summary'] })
      say(message)
    },
    onError: (caught) => say(caught.message),
  })

  const readEverything = useMutation(bulk(readAll, 'All caught up.'))
  const archiveRead = useMutation(
    // Deliberately only the read ones: clearing something you have not looked
    // at yet is how people lose things.
    bulk(() => archiveAll(true), 'Filed away. Still under Archived.'),
  )

  const items = data?.items ?? []
  const summary = data?.summary
  const counts = summary?.by_category ?? {}

  return (
    <section className="animate-rise pt-[52px]">
      <h1 className="rx-display m-0 text-[clamp(36px,5vw,58px)]">Keeping Up</h1>
      <p className="m-0 mt-4 mb-[26px] max-w-[640px] text-[18.5px] leading-[1.5] text-muted text-pretty">
        Who replied, who is coming, who wants to learn what you know. Nothing here is ever thrown
        away — archive what you are done with and it stays readable under Archived.
      </p>

      <div className="mb-6 flex flex-wrap items-center gap-1.5 border-b border-line pb-0.5">
        {SCOPES.map((tab) => {
          const on = tab.key === scope
          const badge = tab.key === 'inbox' ? summary?.unread : summary?.archived
          return (
            <button
              key={tab.key}
              onClick={() => setScope(tab.key)}
              className="relative cursor-pointer rounded-t-xl border-none bg-transparent px-4 pt-3 pb-4 text-[17px] transition-colors hover:bg-cream"
            >
              <span className={on ? 'font-bold text-ink' : 'font-semibold text-faint'}>
                {tab.label}
                {badge ? <span className="ml-1.5 font-bold text-acc-ink">{badge}</span> : null}
              </span>
              {on && (
                <span className="absolute right-4 -bottom-0.5 left-4 h-[3px] animate-bump rounded-[3px] bg-acc" />
              )}
            </button>
          )
        })}

        <div className="ml-auto flex flex-wrap gap-2 pb-2">
          {scope === 'inbox' && (
            <>
              <button
                onClick={() => readEverything.mutate()}
                disabled={readEverything.isPending || !summary?.unread}
                className="rx-btn rx-btn-ghost min-h-[42px] px-4 text-[14.5px]"
              >
                Mark all read
              </button>
              <button
                onClick={() => archiveRead.mutate()}
                disabled={archiveRead.isPending || !summary?.inbox}
                className="rx-btn rx-btn-ghost min-h-[42px] px-4 text-[14.5px]"
              >
                Archive read
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setCategory(null)}
          className={`rx-pill ${category === null ? 'rx-pill-on' : ''}`}
        >
          Everything
        </button>
        {CATEGORIES.map((key) => (
          <button
            key={key}
            onClick={() => setCategory(category === key ? null : key)}
            className={`rx-pill ${category === key ? 'rx-pill-on' : ''}`}
          >
            {CATEGORY_LABEL[key]}
            {counts[key]?.unread ? (
              <span className="ml-1.5 font-extrabold">{counts[key].unread}</span>
            ) : null}
          </button>
        ))}

        {scope === 'inbox' && (
          <label className="ml-auto flex cursor-pointer items-center gap-2 text-[15px] font-semibold text-muted">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(event) => setUnreadOnly(event.target.checked)}
              className="h-[18px] w-[18px] accent-[var(--acc)]"
            />
            Unread only
          </label>
        )}
      </div>

      <ErrorNote error={error} />
      {isPending && <Loading />}

      {!isPending && !error && items.length === 0 && (
        <Empty
          title={
            scope === 'archived'
              ? 'Nothing archived yet.'
              : unreadOnly
                ? 'No unread notifications.'
                : 'Your inbox is clear.'
          }
          hint={
            scope === 'archived'
              ? 'Anything you archive from your inbox will be kept here.'
              : 'When someone replies, RSVPs or asks you something, it turns up here.'
          }
        />
      )}

      {/* grid-cols-1 clamps the track to the container — see NotificationBell. */}
      <div className="grid grid-cols-1 gap-2.5">
        {items.map((notification) => (
          <NotificationItem key={notification.id} notification={notification} actions={actions} />
        ))}
      </div>
    </section>
  )
}
