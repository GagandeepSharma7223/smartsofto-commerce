import Link from 'next/link'
import ImageWithFallback from '@/components/ImageWithFallback'
import type { StorefrontProduct } from '@/lib/storefront'
import AddToCartButton from './AddToCartButton'

export default function MasalaCollectionCard({ product }: { product: StorefrontProduct }) {
  const href = `/product/${product.slug}`
  const price = product.currency === 'INR' ? `Rs. ${product.price}` : `$${product.price}`

  return (
    <article className="masala-card">
      <Link href={href} className="masala-card-media" aria-label={`View ${product.name}`}>
        {product.image ? (
          <ImageWithFallback
            src={product.image}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 12vw, (min-width: 640px) 22vw, 38vw"
            style={{ objectFit: 'contain', padding: '0.75rem' }}
          />
        ) : (
          <span className="masala-card-placeholder" aria-hidden="true">
            <span className="masala-card-placeholder-mark">FM</span>
          </span>
        )}
      </Link>

      <div className="masala-card-content">
        <div className="min-w-0">
          <p className="masala-card-kicker">Masala essential</p>
          <Link href={href} className="block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2">
            <h3 className="masala-card-title">{product.name}</h3>
          </Link>
          <p className="masala-card-meta">{product.size}</p>
        </div>

        <div className="masala-card-actions">
          <span className="masala-card-price">{price}</span>
          <AddToCartButton
            id={product.id}
            disabled={product.availability === 'sold_out'}
            label={product.availability === 'sold_out' ? 'Sold out' : 'Add'}
            className="min-h-10 rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-4 py-2 text-white hover:bg-[var(--color-primary-strong)]"
          />
        </div>
      </div>
    </article>
  )
}
