"use client"
import Link from 'next/link'
import ImageWithFallback from '@/components/ImageWithFallback'

type Variant = { id: string; label: string; price: number; currency?: string; slug?: string; availability?: 'available' | 'limited' | 'sold_out' }
type Group = { baseName: string; image?: string; category?: string; variants: Variant[] }

export default function ProductVariantsCard({ group }: { group: Group }) {
  const firstAvailable = group.variants.find((variant) => variant.availability !== 'sold_out') || group.variants[0]
  const href = firstAvailable?.slug ? `/product/${firstAvailable.slug}` : '/products'
  const prices = group.variants.map((variant) => variant.price).filter((price) => Number.isFinite(price))
  const minPrice = prices.length ? Math.min(...prices) : 0
  const maxPrice = prices.length ? Math.max(...prices) : 0
  const currency = firstAvailable?.currency === 'USD' ? '$' : 'Rs. '
  const price = minPrice === maxPrice ? `${currency}${minPrice}` : `${currency}${minPrice} - ${currency}${maxPrice}`
  const sizeLabel = group.variants
    .map((variant) => variant.label)
    .filter(Boolean)
    .slice(0, 2)
    .join(' / ')
  const allSoldOut = group.variants.every((variant) => variant.availability === 'sold_out')
  const availability = allSoldOut
    ? 'Out of stock'
    : group.variants.some((variant) => variant.availability === 'limited')
      ? 'Limited'
      : 'Available'

  return (
    <article className="product-card catalog-product-card storefront-surface">
      <Link href={href} className="catalog-product-card__media" aria-label={`View options for ${group.baseName}`}>
        <ImageWithFallback
          src={group.image || '/media/placeholder.svg'}
          alt={group.baseName}
          fill
          sizes="(min-width: 1280px) 20vw, (min-width: 768px) 42vw, 92vw"
          style={{ objectFit: 'contain', padding: '0.95rem' }}
        />
        <span className="catalog-product-card__badge">{group.variants.length} options</span>
      </Link>

      <div className="catalog-product-card__body">
        <div className="min-w-0">
          <div className="catalog-product-card__meta-row">
            <p className="catalog-product-card__category">{group.category || 'Options'}</p>
            <span className="storefront-status" data-status={allSoldOut ? 'sold_out' : 'available'}>{availability}</span>
          </div>
          <Link href={href} className="catalog-product-card__title-link">
            <h3 className="catalog-product-card__title">{group.baseName}</h3>
          </Link>
          <p className="catalog-product-card__blurb">{group.variants.length} pack options available.</p>
        </div>

        <div className="catalog-product-card__footer">
          <div className="catalog-product-card__price-row">
            <span className="catalog-product-card__size">{sizeLabel || 'Multiple sizes'}</span>
            <span className="catalog-product-card__prices">
              <span className="catalog-product-card__price">{price}</span>
            </span>
          </div>
          <div className="catalog-product-card__actions">
            <Link href={href} className="catalog-product-card__button catalog-product-card__button--primary">
              Choose options
            </Link>
            <span className="catalog-product-card__option-note">{group.variants.length} sizes</span>
          </div>
        </div>
      </div>
    </article>
  )
}
