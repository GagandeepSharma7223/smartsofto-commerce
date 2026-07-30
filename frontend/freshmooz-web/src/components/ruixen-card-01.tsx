import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export interface RuixenCardProps {
  title: string
  subtitle: string
  image: string
  imageAlt: string
  href: string
}

// Adapted from 21st.dev's RuixenCard-01 for compact category navigation.
export default function RuixenCard({ title, subtitle, image, imageAlt, href }: RuixenCardProps) {
  return (
    <Link href={href} className="category-card group" aria-label={`Shop ${title} category`}>
      <span className="category-card-media">
        <Image
          src={image}
          alt={imageAlt}
          fill
          sizes="(min-width: 1024px) 130px, (min-width: 640px) 38vw, 132px"
          className="category-card-image"
        />
      </span>

      <span className="category-card-content">
        <span className="category-card-name">{title}</span>
        <span className="category-card-description">{subtitle}</span>
        <span className="category-card-cta" aria-hidden="true">
          <span>Shop category</span>
          <ArrowRight className="category-card-arrow" />
        </span>
      </span>
    </Link>
  )
}
