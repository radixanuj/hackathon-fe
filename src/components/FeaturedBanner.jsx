import { AvatarStack } from './Avatar'

/**
 * The accent slab that leads each Community tab — the busiest group, the next
 * event, the story people are talking about. One shape, so the tabs read as one
 * page rather than four different lists.
 *
 * `children` are the actions; use the Banner* buttons below so they keep the
 * "solid on accent, outlined in current colour" pairing the design uses.
 */
export default function FeaturedBanner({ eyebrow, title, meta, note, stack = [], stackLine, children }) {
  return (
    <article className="relative mb-[18px] grid items-center gap-7 overflow-hidden rounded-[28px] bg-acc p-[clamp(26px,3.4vw,40px)] text-on-acc [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
      <div
        aria-hidden="true"
        className="absolute top-[-80px] right-[-80px] h-[300px] w-[300px] rounded-full border-2 border-current opacity-[.28]"
        style={{ animation: 'floatC 15s ease-in-out infinite' }}
      />

      <div className="relative min-w-0">
        <p className="m-0 mb-3.5 text-[13px] font-bold tracking-[.14em] uppercase opacity-[.78]">
          {eyebrow}
        </p>
        <h3 className="rx-display m-0 text-[clamp(30px,3.8vw,44px)] leading-[1.02] tracking-[-.032em]">
          {title}
        </h3>
        {meta && <p className="m-0 mt-3.5 max-w-[400px] text-[18px] leading-[1.45] opacity-90">{meta}</p>}
      </div>

      <div className="relative min-w-0">
        {(stack.length > 0 || stackLine) && (
          <div className="mb-[18px] flex items-center gap-3">
            {stack.length > 0 && <AvatarStack people={stack.slice(0, 5)} size={42} />}
            {stackLine && <span className="text-[16.5px] font-semibold opacity-90">{stackLine}</span>}
          </div>
        )}

        {note && <p className="m-0 mb-5 text-[16px] opacity-[.82]">{note}</p>}

        <div className="flex flex-wrap gap-2.5">{children}</div>
      </div>
    </article>
  )
}

/** Solid, on the accent — the one thing the banner wants you to do. */
export function BannerPrimary({ children, ...props }) {
  return (
    <button
      {...props}
      className="rx-btn rx-btn-inv min-h-[52px] rounded-[15px] px-[26px] py-4 text-[16.5px]"
    >
      {children}
    </button>
  )
}

/** The same slot once you're already in. */
export function BannerDone({ children }) {
  return (
    <span className="flex min-h-[52px] animate-pop items-center gap-2.5 rounded-[15px] bg-inv px-6 py-4 text-[16.5px] font-bold text-on-inv">
      {children}
    </span>
  )
}

export function BannerGhost({ children, as: Tag = 'button', ...props }) {
  return (
    <Tag
      {...props}
      className="flex min-h-[52px] cursor-pointer items-center rounded-[15px] border-[1.5px] border-current bg-transparent px-6 py-4 text-[16.5px] font-bold text-current no-underline opacity-85 transition-opacity hover:opacity-100"
    >
      {children}
    </Tag>
  )
}
