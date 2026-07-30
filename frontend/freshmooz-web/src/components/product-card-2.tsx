import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export type HeroProductCardProps = {
  href: string
  name: string
  image: string
  imageAlt: string
  category: string
  variant?: 'featured' | 'supporting'
  badge?: string
  size?: string
  price?: string
  actionLabel?: string
  priority?: boolean
  className?: string
}

export function HeroProductCard({
  href,
  name,
  image,
  imageAlt,
  category,
  variant = 'supporting',
  badge,
  size,
  price,
  actionLabel = 'View product',
  priority = false,
  className,
}: HeroProductCardProps) {
  const featured = variant === 'featured'
  const details = [size, price].filter(Boolean).join(', ')

  return (
    <Link
      href={href}
      className={cn(
        'hero-commerce-card group',
        featured ? 'hero-commerce-card-featured col-span-2 bg-[#f4c928] sm:col-span-1 sm:row-span-2' : 'hero-commerce-card-supporting bg-white',
        className,
      )}
      aria-label={`${actionLabel}: ${name}${details ? `, ${details}` : ''}`}
    >
      <span className={featured ? 'hero-featured-media' : 'hero-supporting-media'}>
        {badge ? <span className="hero-product-label absolute left-4 top-4 z-10 sm:left-5 sm:top-5">{badge}</span> : null}
        <Image
          src={image}
          alt={imageAlt}
          fill
          priority={priority}
          sizes={featured ? '(min-width: 1024px) 29vw, 92vw' : '(min-width: 1024px) 19vw, 44vw'}
          className={cn('hero-commerce-image', featured ? 'object-cover' : 'object-contain p-3 sm:p-4')}
        />
      </span>
      <span className="hero-commerce-content">
        <span className="min-w-0">
          <span className="hero-commerce-category">{category}</span>
          <span className={cn('hero-commerce-name', featured ? 'text-xl sm:text-2xl' : 'truncate')}>{name}</span>
          {size || price ? (
            <span className="mt-1 flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
              {size ? <span>{size}</span> : null}
              {size && price ? <span aria-hidden="true">·</span> : null}
              {price ? <span className="font-bold tabular-nums text-[var(--color-primary-strong)]">{price}</span> : null}
            </span>
          ) : null}
        </span>
        <span className={cn('hero-commerce-action', featured ? '' : 'hero-commerce-action-icon')}>
          {featured ? <span>{actionLabel}</span> : <span className="sr-only">{actionLabel}</span>}
          <ArrowRight className="hero-commerce-arrow h-4 w-4" aria-hidden="true" />
        </span>
      </span>
    </Link>
  )
}
