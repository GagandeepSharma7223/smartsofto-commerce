import { getAllProducts, type Product } from '@/lib/products'

export type StorefrontProduct = Product & {
  category: string
  size: string
  compareAtPrice?: number
  availability: 'available' | 'limited' | 'sold_out'
  badge?: string
  blurb: string
}

type ProductLike = {
  id: string
  slug: string
  name: string
  description: string
  price: number
  currency: 'INR' | 'USD' | string
  image?: string
  tags?: string[]
}

export type StorefrontCategory = {
  name: string
  description: string
  image: string
  href: string
}

export const storefrontCategories: StorefrontCategory[] = [
  {
    name: 'Dairy Essentials',
    description: 'Everyday staples for cooking, serving, and snacking.',
    image: '/media/paneer.jpg',
    href: '/products'
  },
  {
    name: 'Ghee & Butter',
    description: 'Rich essentials for cooking, finishing, and serving.',
    image: '/media/cow_ghee.png',
    href: '/products'
  },
  {
    name: 'Paneer',
    description: 'Versatile favourites for curries, grills, and quick meals.',
    image: '/media/paneer.jpg',
    href: '/products'
  },
  {
    name: 'Khoya & Ingredients',
    description: 'Traditional ingredients for sweets and festive recipes.',
    image: '/media/khoya.jpg',
    href: '/products'
  },
  {
    name: 'Traditional Favourites',
    description: 'Familiar staples for family recipes and shared occasions.',
    image: '/media/white_butter.jpg',
    href: '/products'
  },
  {
    name: 'Pantry Essentials',
    description: 'Useful picks selected for flavour and everyday convenience.',
    image: '/media/cow_ghee.png',
    href: '/products'
  }
]

export const trustPoints = [
  'Carefully selected products',
  'Clear product information',
  'Careful packaging',
  'Reliable customer support'
]

export const qualityPrinciples = [
  {
    title: 'Thoughtful product selection',
    text: 'FreshMooz focuses on dependable essentials and traditional favourites people buy repeatedly.'
  },
  {
    title: 'Clear information',
    text: 'The storefront keeps pricing, pack details, and product links easy to compare before checkout.'
  },
  {
    title: 'Careful packaging',
    text: 'Product presentation and checkout flows are designed to reduce confusion and improve order confidence.'
  },
  {
    title: 'Customer-first support',
    text: 'Account access, order history, and cart updates remain part of the live experience.'
  }
]

export const shoppingSteps = [
  'Browse products',
  'Add favourites to cart',
  'Place your order online'
]

export const confidencePoints = [
  'Focused assortment built around everyday usefulness',
  'Simple cart flow with instant quantity and count updates',
  'Product pages for more detail before purchase',
  'Account access for order history and repeat shopping'
]

export const footerGroups = {
  shop: [
    { label: 'All Products', href: '/products' },
    { label: 'Categories', href: '/#categories' },
    { label: 'Popular Picks', href: '/#popular-products' },
    { label: 'Masalas', href: '/#everyday-essentials' }
  ],
  freshmooz: [
    { label: 'Our Quality', href: '/#quality' },
    { label: 'How Shopping Works', href: '/#shopping-steps' },
    { label: 'Shop Online', href: '/#online-shopping' },
    { label: 'Updates', href: '/#newsletter' }
  ],
  help: [
    { label: 'Cart', href: '/cart' },
    { label: 'Checkout', href: '/checkout' },
    { label: 'Newsletter', href: '/#newsletter' }
  ],
  account: [
    { label: 'Sign In', href: '/login' },
    { label: 'Create Account', href: '/register' },
    { label: 'Reset Password', href: '/reset-password' },
    { label: 'My Orders', href: '/orders' }
  ]
}

export function normalizeStorefrontProducts(items: ProductLike[]): StorefrontProduct[] {
  return items.map((item, index) => {
    const source = `${item.name} ${item.description} ${(item.tags || []).join(' ')}`.toLowerCase()
    const category =
      source.includes('paneer') ? 'Paneer' :
      source.includes('butter') || source.includes('ghee') ? 'Ghee & Butter' :
      source.includes('khoya') || source.includes('mithai') || source.includes('sweet') ? 'Traditional Foods' :
      'Dairy'

    const size = inferSize(source, category, index)
    const compareAtPrice = index % 2 === 0 ? item.price + 20 : undefined
    const badge =
      category === 'Paneer' ? 'Kitchen favourite' :
      category === 'Ghee & Butter' ? 'Everyday essential' :
      category === 'Traditional Foods' ? 'Festive pick' :
      'FreshMooz pick'

    return {
      ...item,
      currency: item.currency === 'USD' ? 'USD' : 'INR',
      category,
      size,
      compareAtPrice,
      availability: 'available',
      badge,
      blurb: buildBlurb(item.description, category)
    }
  })
}

export function getFallbackStorefrontProducts(): StorefrontProduct[] {
  return normalizeStorefrontProducts(getAllProducts())
}

export function getPopularProducts(products: StorefrontProduct[]) {
  return products.slice(0, 3)
}

export function getSecondaryCollection(products: StorefrontProduct[]) {
  if (products.length <= 1) return []
  return products
    .filter((product) => product.category !== 'Paneer')
    .slice(0, 2)
}

export function getMasalaCollection(products: StorefrontProduct[]) {
  const masalaProducts = products.filter((product) => {
    const source = `${product.name} ${product.description} ${product.category} ${product.blurb} ${(product.tags || []).join(' ')}`.toLowerCase()
    return /\b(masala|spice|spices|haldi|turmeric|mirch|chilli|chili|cumin|jeera|dhaniya|coriander|garam|chaat|tandoori|biryani|sambar|sabji)\b/.test(source)
  })

  return (masalaProducts.length ? masalaProducts : products).slice(0, 6)
}

function inferSize(source: string, category: string, index: number) {
  const explicit = source.match(/(\d+(?:\.\d+)?)\s?(kg|g|ml|l|litre|liter)/i)
  if (explicit) return `${explicit[1]} ${explicit[2].toLowerCase()}`
  if (category === 'Paneer') return index % 2 === 0 ? '400 g pack' : '250 g pack'
  if (category === 'Ghee & Butter') return '200 g pack'
  if (category === 'Traditional Foods') return '500 g pack'
  return 'Fresh pack'
}

function buildBlurb(description: string, category: string) {
  if (description.trim()) return description
  if (category === 'Paneer') return 'A reliable cooking staple for savoury meals and quick weekday recipes.'
  if (category === 'Ghee & Butter') return 'Rich texture and everyday versatility for breakfast, cooking, and finishing.'
  if (category === 'Traditional Foods') return 'Classic ingredients for sweets, gifting, and festive preparation.'
  return 'Selected for everyday usefulness and straightforward online ordering.'
}
