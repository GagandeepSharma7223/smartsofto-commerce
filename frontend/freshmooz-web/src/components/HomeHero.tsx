import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { HeroProductCard } from '@/components/product-card-2'
import { findBySlug } from '@/lib/products'

export default function HomeHero() {
  const paneer = findBySlug('malai-paneer')
  const butter = findBySlug('white-butter')

  return (
    <section className="home-hero overflow-hidden">
      <div className="storefront-shell grid min-w-0 items-center gap-8 py-10 md:py-12 lg:min-h-[29rem] lg:grid-cols-[0.94fr,1.06fr] lg:py-10">
        <div className="relative z-10 min-w-0 max-w-2xl">
          <div className="storefront-kicker">Pure quality, thoughtfully selected</div>
          <h1 className="hero-heading mt-2 text-[var(--color-primary-strong)]">
            Better everyday products, chosen with care.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-[var(--color-text-muted)] sm:text-lg">
            Explore trusted dairy and pantry essentials for your home.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/products" className="hero-cta storefront-button-primary">
              Shop products <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="#categories" className="hero-cta storefront-button-secondary">Explore categories</Link>
          </div>
          <div className="mt-5 flex flex-col gap-2 text-sm font-medium text-[var(--color-primary-strong)] sm:flex-row sm:flex-wrap sm:gap-x-5">
            <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[var(--color-primary)]" aria-hidden="true" /> Clear product details</span>
            <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[var(--color-primary)]" aria-hidden="true" /> Easy online ordering</span>
          </div>
        </div>

        <div className="hero-showcase relative mx-auto min-w-0 w-full max-w-2xl" aria-label="Featured FreshMooz products">
          <div className="absolute -inset-7 rounded-full bg-[rgba(37,79,61,0.08)] blur-3xl" aria-hidden="true" />
          <div className="relative grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] sm:gap-4">
            <HeroProductCard
              href="/products"
              name="Danedaar Cow Ghee"
              image="/media/cow_ghee.png"
              imageAlt="FreshMooz Danedaar Cow Ghee jar"
              category="Ghee & Butter"
              badge="Kitchen essential"
              actionLabel="Shop ghee"
              variant="featured"
              priority
            />
            {paneer ? (
              <HeroProductCard
                href={`/product/${paneer.slug}`}
                name={paneer.name}
                image={paneer.image || '/media/placeholder.svg'}
                imageAlt={`FreshMooz ${paneer.name} pack`}
                category="Paneer"
                size="400 g pack"
                price={formatPrice(paneer.price, paneer.currency)}
                priority
              />
            ) : null}
            {butter ? (
              <HeroProductCard
                href={`/product/${butter.slug}`}
                name={butter.name}
                image={butter.image || '/media/placeholder.svg'}
                imageAlt={`FreshMooz ${butter.name} packs`}
                category="Ghee & Butter"
                size="200 g pack"
                price={formatPrice(butter.price, butter.currency)}
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}

function formatPrice(price: number, currency: 'INR' | 'USD') {
  return currency === 'INR' ? `₹${price}` : `$${price}`
}
