import { useNavigate } from 'react-router-dom'
import { timeAgo } from '../lib/format'
import { CATEGORY_LABEL } from '../lib/notifications'
import Avatar from './Avatar'

/**
 * One notification.
 *
 * The whole row is the link — clicking it marks the thing read and takes you to
 * wherever it happened. The buttons on the right sit outside that, so tidying up
 * never navigates you away mid-scroll.
 */
export default function NotificationItem({ notification, actions, compact = false }) {
  const navigate = useNavigate()
  const unread = !notification.is_read

  const open = () => {
    if (unread) actions.read.mutate(notification.id)
    if (notification.action_url) navigate(notification.action_url)
  }

  return (
    <article
      className={`flex min-w-0 gap-[14px] rounded-tile border p-[14px] transition-colors ${
        unread ? 'border-acc-soft bg-tint' : 'border-edge bg-white hover:bg-cream'
      }`}
    >
      <button
        onClick={open}
        className="flex min-w-0 flex-1 cursor-pointer items-start gap-[13px] border-none bg-transparent p-0 text-left"
      >
        <span
          aria-hidden="true"
          className="grid h-[42px] w-[42px] flex-none place-items-center rounded-[14px] bg-white text-[19px] shadow-[0_1px_3px_rgb(20_18_15/0.07)]"
        >
          {notification.icon}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span
              className={`min-w-0 flex-1 text-[16px] leading-[1.35] ${unread ? 'font-bold text-ink' : 'font-semibold text-ink'}`}
            >
              {notification.title}
            </span>
            <span className="flex-none text-[13px] whitespace-nowrap text-faint">
              {timeAgo(notification.created_at)}
            </span>
          </span>

          {notification.body && (
            <span className="mt-1 block truncate text-[15px] leading-[1.45] text-muted">
              {notification.body}
            </span>
          )}

          {!compact && (
            <span className="mt-[10px] flex flex-wrap items-center gap-2">
              {notification.actor && (
                <>
                  <Avatar person={notification.actor} size={22} radius={7} />
                  <span className="text-[13.5px] font-semibold text-muted">
                    {notification.actor.name}
                  </span>
                  <span className="text-[13.5px] text-dim">·</span>
                </>
              )}
              <span className="text-[13.5px] font-semibold text-faint">
                {CATEGORY_LABEL[notification.category] ?? notification.category}
              </span>
            </span>
          )}
        </span>
      </button>

      {!compact && (
        <div className="flex flex-none flex-col items-end gap-1.5">
          {notification.is_archived ? (
            <RowButton
              onClick={() => actions.unarchive.mutate(notification.id)}
              disabled={actions.unarchive.isPending}
            >
              Restore
            </RowButton>
          ) : (
            <RowButton
              onClick={() => actions.archive.mutate(notification.id)}
              disabled={actions.archive.isPending}
            >
              Archive
            </RowButton>
          )}
          <RowButton
            onClick={() =>
              unread ? actions.read.mutate(notification.id) : actions.unread.mutate(notification.id)
            }
            disabled={actions.read.isPending || actions.unread.isPending}
          >
            {unread ? 'Mark read' : 'Mark unread'}
          </RowButton>
        </div>
      )}
    </article>
  )
}

function RowButton({ onClick, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="cursor-pointer rounded-[10px] border-none bg-transparent px-2 py-1 text-[13.5px] font-bold text-faint transition-colors hover:bg-sand hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  )
}
