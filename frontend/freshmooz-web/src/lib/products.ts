export type Product = {
  id: string
  slug: string
  name: string
  description: string
  price: number
  currency: 'INR' | 'USD'
  image?: string
  tags?: string[]
}

export const products: Product[] = [
  {
    id: 'p1',
    slug: 'malai-paneer',
    name: 'Malai Paneer',
    description: 'Soft, creamy bite — perfect for curries and grills.',
    price: 220,
    currency: 'INR',
    image: '/media/paneer.jpg',
    tags: ['paneer', 'fresh']
  },
  {
    id: 'p2',
    slug: 'white-butter',
    name: 'White Butter (Makkhan)',
    description: 'Unsalted, traditionally churned purity.',
    price: 200,
    currency: 'INR',
    image: '/media/white_butter.jpg',
    tags: ['butter']
  },
  {
    id: 'p3',
    slug: 'khoya',
    name: 'Khoya',
    description: 'Rich and granular — ideal for classic mithai.',
    price: 180,
    currency: 'INR',
    image: '/media/khoya.jpg',
    tags: ['khoya']
  }
]

export function getAllProducts(): Product[] {
  return products
}

export function findBySlug(slug: string): Product | undefined {
  return products.find(p => p.slug === slug)
}
