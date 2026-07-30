import Link from 'next/link'
import ImageWithFallback from '@/components/ImageWithFallback'
import type { StorefrontProduct } from '@/lib/storefront'
import AddToCartButton from './AddToCartButton'

const localProductImages = [
  { match: ['paneer'], src: '/media/paneer.jpg' },
  { match: ['butter', 'makkhan'], src: '/media/white_butter.jpg' },
  { match: ['khoya', 'mithai', 'sweet'], src: '/media/khoya.jpg' },
  { match: ['ghee'], src: '/media/cow_ghee.png' },
]

export default function PopularProductCard({ product }: { product: StorefrontProduct }) {
  const href = `/product/${product.slug}`
  const image = resolveProductImage(product)
  const price = product.currency === 'INR' ? `Rs. ${product.price}` : `$${product.price}`
  const compareAt = product.compareAtPrice
    ? product.currency === 'INR' ? `Rs. ${product.compareAtPrice}` : `$${product.compareAtPrice}`
    : null
  const availability = product.availability === 'sold_out'
    ? 'Out of stock'
    : product.availability === 'limited'
      ? 'Limited'
      : 'Available'

  return (
    <article className="popular-product-card storefront-surface flex h-full flex-col overflow-hidden">
      <Link
        href={href}
        className="popular-product-card__media group"
        aria-label={`View details for ${product.name}, ${product.size}, ${price}, ${availability}`}
      >
        <ImageWithFallback
          src={image}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 44vw, 92vw"
          style={{ objectFit: 'contain', padding: '0.85rem' }}
        />
        {product.badge ? <span className="popular-product-card__badge">{product.badge}</span> : null}
      </Link>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.09em] text-[var(--color-accent)]">{product.category}</p>
            <Link href={href} className="mt-1 block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2">
              <h3 className="truncate text-lg font-semibold leading-tight text-[var(--color-primary-strong)]">{product.name}</h3>
            </Link>
          </div>
          <span className="storefront-status shrink-0 pt-1" data-status={product.availability}>{availability}</span>
        </div>

        <p className="mt-2 line-clamp-1 text-sm leading-6 text-[var(--color-text-muted)]">{product.blurb}</p>

        <div className="mt-auto pt-4">
          <div className="flex items-end justify-between gap-4 border-t border-[var(--color-border)] pt-3">
            <span className="text-xs font-medium text-[var(--color-text-muted)]">{product.size}</span>
            <span className="flex items-baseline gap-2 text-right">
              <span className="text-xl font-semibold text-[var(--color-primary-strong)]">{price}</span>
              {compareAt ? <span className="text-sm text-[var(--color-text-muted)] line-through">{compareAt}</span> : null}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
            <AddToCartButton
              id={product.id}
              disabled={product.availability === 'sold_out'}
              label={product.availability === 'sold_out' ? 'Sold out' : 'Add to cart'}
              className="min-h-11 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2.5 text-white hover:bg-[var(--color-primary-strong)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
            />
            <Link
              href={href}
              className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border-strong)] px-4 text-sm font-semibold text-[var(--color-primary-strong)] transition hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
            >
              View details
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}

function resolveProductImage(product: StorefrontProduct) {
  const source = `${product.name} ${product.category} ${product.blurb}`.toLowerCase()
  const matchedImage = localProductImages.find((item) => item.match.some((word) => source.includes(word)))?.src

  if (matchedImage) return matchedImage
  if (product.image) return product.image

  const numericId = Number.parseInt(product.id.replace(/\D/g, ''), 10)
  const imageIndex = Number.isFinite(numericId) ? numericId % localProductImages.length : 0
  return localProductImages[imageIndex]?.src || '/media/paneer.jpg'
}
