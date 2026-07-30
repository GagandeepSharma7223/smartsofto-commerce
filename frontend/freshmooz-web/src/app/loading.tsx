import ProductCardSkeleton from '@/components/ProductCardSkeleton'

export default function Loading() {
  return (
    <main id="main-content" className="storefront-section">
      <div className="storefront-shell">
        <div className="mb-8 h-10 w-64 animate-pulse rounded bg-[var(--color-primary-soft)]" />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => <ProductCardSkeleton key={index} />)}
        </div>
      </div>
    </main>
  )
}
