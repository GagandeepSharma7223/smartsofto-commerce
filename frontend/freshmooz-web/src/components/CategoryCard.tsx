import RuixenCard from '@/components/ruixen-card-01'
import type { StorefrontCategory } from '@/lib/storefront'

export default function CategoryCard({ category }: { category: StorefrontCategory }) {
  return (
    <RuixenCard
      title={category.name}
      subtitle={category.description}
      image={category.image}
      imageAlt={`${category.name} from the FreshMooz range`}
      href={category.href}
    />
  )
}
