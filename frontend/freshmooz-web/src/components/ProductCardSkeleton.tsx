export default function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white" aria-hidden="true">
      <div className="aspect-square animate-pulse bg-[var(--color-surface-muted)]" />
      <div className="space-y-4 p-5">
        <div className="h-3 w-24 animate-pulse rounded-full bg-[var(--color-primary-soft)]" />
        <div className="h-6 w-3/4 animate-pulse rounded bg-[var(--color-surface-muted)]" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-[var(--color-surface-muted)]" />
        <div className="h-12 animate-pulse rounded-full bg-[var(--color-primary-soft)]" />
      </div>
    </div>
  )
}
