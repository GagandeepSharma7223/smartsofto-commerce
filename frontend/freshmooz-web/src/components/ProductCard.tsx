import Link from 'next/link'
import ImageWithFallback from '@/components/ImageWithFallback'
import type { StorefrontProduct } from '@/lib/storefront'
import AddToCartButton from './AddToCartButton'

export default function ProductCard({ product }: { product: StorefrontProduct }) {
  const href = `/product/${product.slug}`
  const currentPrice = product.currency === 'INR' ? `Rs. ${product.price}` : `$${product.price}`
  const compareAt = product.compareAtPrice
    ? product.currency === 'INR' ? `Rs. ${product.compareAtPrice}` : `$${product.compareAtPrice}`
    : null
  const availability = product.availability === 'sold_out'
    ? 'Out of stock'
    : product.availability === 'limited'
      ? 'Limited'
      : 'Available'

  return (
    <article className="product-card catalog-product-card storefront-surface">
      <Link href={href} className="catalog-product-card__media" aria-label={`View ${product.name}`}>
        <ImageWithFallback
          src={product.image || '/media/placeholder.svg'}
          alt={product.name}
          fill
          sizes="(min-width: 1280px) 20vw, (min-width: 768px) 42vw, 92vw"
          style={{ objectFit: 'contain', padding: '0.95rem' }}
        />
        {product.badge ? <span className="catalog-product-card__badge">{product.badge}</span> : null}
      </Link>

      <div className="catalog-product-card__body">
        <div className="min-w-0">
          <div className="catalog-product-card__meta-row">
            <p className="catalog-product-card__category">{product.category}</p>
            <span className="storefront-status" data-status={product.availability}>{availability}</span>
          </div>
          <Link href={href} className="catalog-product-card__title-link">
            <h3 className="catalog-product-card__title">{product.name}</h3>
          </Link>
          <p className="catalog-product-card__blurb">{product.blurb}</p>
        </div>

        <div className="catalog-product-card__footer">
          <div className="catalog-product-card__price-row">
            <span className="catalog-product-card__size">{product.size}</span>
            <span className="catalog-product-card__prices">
              <span className="catalog-product-card__price">{currentPrice}</span>
              {compareAt ? <span className="catalog-product-card__compare">{compareAt}</span> : null}
            </span>
          </div>
          <div className="catalog-product-card__actions">
            <AddToCartButton
              id={product.id}
              disabled={product.availability === 'sold_out'}
              label={product.availability === 'sold_out' ? 'Sold out' : 'Add to cart'}
              className="catalog-product-card__button catalog-product-card__button--primary"
            />
            <Link href={href} className="catalog-product-card__details-link" aria-label={`Open ${product.name} details`}>
              Details <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}

function LegacyProductCard({ product }: { product: StorefrontProduct }) {
  const currentPrice = product.currency === 'INR' ? `₹${product.price}` : `$${product.price}`
  const compareAt = product.compareAtPrice
    ? product.currency === 'INR' ? `₹${product.compareAtPrice}` : `$${product.compareAtPrice}`
    : null

  return (
    <article className="product-card storefront-surface flex h-full flex-col overflow-hidden">
      <Link href={`/product/${product.slug}`} className="group relative block aspect-[4/3] overflow-hidden bg-[var(--color-surface-muted)]">
        <ImageWithFallback src={product.image || '/media/placeholder.svg'} alt={product.name} fill sizes="(min-width: 1280px) 28vw, (min-width: 768px) 45vw, 92vw" style={{ objectFit: 'contain', padding: '1.5rem' }} />
        {product.badge ? <span className="absolute left-4 top-4 rounded-full border border-white/70 bg-white/90 px-3 py-1 text-xs font-semibold text-[var(--color-primary-strong)] shadow-sm">{product.badge}</span> : null}
      </Link>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.09em] text-[var(--color-accent)]">{product.category}</p>
        <Link href={`/product/${product.slug}`} className="mt-1"><h3 className="text-xl font-semibold leading-tight text-[var(--color-primary-strong)]">{product.name}</h3></Link>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--color-text-muted)]">{product.blurb}</p>
        <div className="mt-auto pt-5">
          <div className="flex items-end justify-between gap-4 border-t border-[var(--color-border)] pt-4">
            <div>
              <span className="block text-xs font-medium text-[var(--color-text-muted)]">{product.size}</span>
              <span className="mt-1 flex items-center gap-2">
                <span className="text-2xl font-semibold text-[var(--color-primary-strong)]">{currentPrice}</span>
                {compareAt ? <span className="text-sm text-[var(--color-text-muted)] line-through">{compareAt}</span> : null}
              </span>
            </div>
            <span className="storefront-status" data-status={product.availability}>
              {product.availability === 'sold_out' ? 'Out of stock' : product.availability === 'limited' ? 'Limited' : 'Available'}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <AddToCartButton id={product.id} disabled={product.availability === 'sold_out'} label={product.availability === 'sold_out' ? 'Sold out' : 'Add to cart'} className="bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-strong)]" />
            <Link href={`/product/${product.slug}`} className="storefront-button-secondary">View details</Link>
          </div>
        </div>
      </div>
    </article>
  )
}


