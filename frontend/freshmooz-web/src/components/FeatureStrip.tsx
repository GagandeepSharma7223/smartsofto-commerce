import { Headphones, Info, PackageCheck, Sparkles } from 'lucide-react'

const icons = [Sparkles, Info, PackageCheck, Headphones]

export default function FeatureStrip({ items }: { items: string[] }) {
  return (
    <section className="border-y border-[var(--color-border)] bg-white" aria-label="Why shop FreshMooz">
      <div className="storefront-shell grid grid-cols-2 divide-x divide-y divide-[var(--color-border)] md:grid-cols-4 md:divide-y-0">
        {items.map((item, index) => {
          const Icon = icons[index] || Sparkles
          return (
            <div key={item} className="flex min-h-24 items-center gap-3 px-3 py-4 sm:px-5">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
              </span>
              <span className="text-sm font-semibold leading-5 text-[var(--color-primary-strong)]">{item}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
