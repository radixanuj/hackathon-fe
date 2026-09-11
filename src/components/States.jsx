/** The three list states, styled once so every screen agrees. */

export function Loading({ label = 'Loading…' }) {
  return <p className="py-10 text-[16.5px] text-muted">{label}</p>
}

export function ErrorNote({ error, className = '' }) {
  if (!error) return null
  return (
    <div className={`rounded-tile border-[1.5px] border-edge-strong bg-cream p-6 ${className}`}>
      <p className="m-0 text-[16.5px] font-bold">That didn't load.</p>
      <p className="m-0 mt-2 text-[15.5px] text-muted">{error.message}</p>
    </div>
  )
}

export function Empty({ title, hint }) {
  return (
    <div className="animate-fade rounded-tile border-[1.5px] border-dashed border-edge-strong p-[54px] text-center">
      <p className="m-0 text-[19px] font-bold">{title}</p>
      {hint && <p className="m-0 mt-2 text-[16.5px] text-muted">{hint}</p>}
    </div>
  )
}

/** Card-shaped shimmer, so a loading grid keeps the page's rhythm. */
export function SkeletonCards({ count = 6, height = 220 }) {
  return (
    <div className="grid gap-[18px] [grid-template-columns:repeat(auto-fill,minmax(290px,1fr))]">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-tile border border-edge bg-cream"
          style={{ height }}
        />
      ))}
    </div>
  )
}
