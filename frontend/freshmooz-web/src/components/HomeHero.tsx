import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { findBySlug } from '@/lib/products'
import type { StorefrontProduct } from '@/lib/storefront'

function formatHeroPrice(price: number, currency: 'INR' | 'USD') {
  return currency === 'INR' ? `Rs. ${price}` : `$${price}`
}

export default function HomeHero({ masalaProduct }: { masalaProduct?: StorefrontProduct }) {
  const paneer = findBySlug('malai-paneer')
  const masalaHref = masalaProduct ? `/product/${masalaProduct.slug}` : '/products'
  const masalaName = masalaProduct?.name || 'Masala Collection'
  const masalaSize = masalaProduct?.size || 'Daily cooking'
  const masalaPrice = masalaProduct ? formatHeroPrice(masalaProduct.price, masalaProduct.currency) : undefined

  return (
    <section className="home-hero overflow-hidden">
      <div className="storefront-shell grid min-w-0 items-center gap-8 py-9 md:py-11 lg:min-h-[28rem] lg:grid-cols-[0.94fr,1.06fr] lg:py-9">
        <div className="relative z-10 min-w-0 max-w-2xl">
          <div className="storefront-kicker">Pure quality, thoughtfully selected</div>
          <h1 className="hero-heading mt-2 text-[var(--color-primary-strong)]">
            Better everyday products, chosen with care.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-[var(--color-text-muted)] sm:text-lg">
            Explore trusted dairy, masalas, and pantry essentials for everyday cooking.
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

        <div className="hero-showcase relative mx-auto min-w-0 w-full max-w-2xl" aria-label="Featured FreshMooz dairy and masala products">
          <div className="absolute -inset-7 rounded-full bg-[rgba(37,79,61,0.08)] blur-3xl" aria-hidden="true" />
          <div className="hero-floating-stage">
            <div className="hero-floating-swirl hero-floating-swirl-one" aria-hidden="true" />
            <div className="hero-floating-swirl hero-floating-swirl-two" aria-hidden="true" />

            <Link
              href="/products"
              className="hero-floating-product hero-floating-product-main"
              aria-label="Shop products: Cow Ghee, 500 ml and 1 L"
            >
              <span className="hero-product-label hero-floating-badge">Main pick</span>
              <span className="hero-floating-image-wrap">
                <Image
                  src="/media/cow_ghee.png"
                  alt="FreshMooz cow ghee jar"
                  fill
                  priority
                  sizes="(min-width: 1024px) 24vw, 82vw"
                  className="hero-floating-image"
                />
              </span>
              <span className="hero-floating-copy">
                <span>
                  <span className="hero-commerce-category">Ghee & Butter</span>
                  <span className="hero-commerce-name text-xl sm:text-2xl">Cow Ghee</span>
                  <span className="hero-floating-meta">500 ml / 1 L</span>
                </span>
                <span className="hero-commerce-action">
                  <span>Shop products</span>
                  <ArrowRight className="hero-commerce-arrow h-4 w-4" aria-hidden="true" />
                </span>
              </span>
            </Link>

            {paneer ? (
              <Link
                href={`/product/${paneer.slug}`}
                className="hero-floating-product hero-floating-product-paneer"
                aria-label={`View product: ${paneer.name}, 400 g pack, ${formatHeroPrice(paneer.price, paneer.currency)}`}
              >
                <span className="hero-floating-thumb">
                  <Image
                    src={paneer.image || '/media/placeholder.svg'}
                    alt={`FreshMooz ${paneer.name} pack`}
                    fill
                    priority
                    sizes="(min-width: 1024px) 18vw, 82vw"
                    className="hero-floating-image"
                  />
                </span>
                <span className="hero-floating-mini-copy">
                  <span>
                    <span className="hero-commerce-category">Paneer</span>
                    <span className="hero-commerce-name">{paneer.name}</span>
                    <span className="hero-floating-meta">400 g pack · {formatHeroPrice(paneer.price, paneer.currency)}</span>
                  </span>
                  <span className="hero-commerce-action hero-commerce-action-icon">
                    <ArrowRight className="hero-commerce-arrow h-4 w-4" aria-hidden="true" />
                  </span>
                </span>
              </Link>
            ) : null}

            <Link
              href={masalaHref}
              className="hero-floating-product hero-floating-product-masala"
              aria-label={masalaProduct ? `View product: ${masalaName}, ${masalaSize}, ${masalaPrice}` : 'Shop masalas and pantry essentials'}
            >
              <span className="hero-product-label hero-floating-badge">Masala pick</span>
              {masalaProduct?.image ? (
                <span className="hero-floating-thumb">
                  <Image
                    src={masalaProduct.image}
                    alt={`FreshMooz ${masalaName} pack`}
                    fill
                    sizes="(min-width: 1024px) 18vw, 82vw"
                    className="hero-floating-image"
                  />
                </span>
              ) : null}
              <span className={masalaProduct?.image ? 'hero-floating-mini-copy' : 'hero-floating-mini-copy hero-floating-mini-copy-only'}>
                <span>
                  <span className="hero-commerce-category">Masalas</span>
                  <span className="hero-commerce-name">{masalaName}</span>
                  <span className="hero-floating-meta">{masalaSize}{masalaPrice ? ` · ${masalaPrice}` : ''}</span>
                </span>
                <span className="hero-commerce-action hero-commerce-action-icon">
                  <ArrowRight className="hero-commerce-arrow h-4 w-4" aria-hidden="true" />
                </span>
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

