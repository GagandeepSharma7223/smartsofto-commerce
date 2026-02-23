import { findBySlug, getAllProducts } from '@/lib/products'
import { fetchProduct } from '@/lib/api'
import ImageWithFallback from '@/components/ImageWithFallback'
import SiteHeader from '@/components/SiteHeader'
import Link from 'next/link'
import type { Metadata } from 'next'

export const revalidate = 60

type Props = { params: { slug: string } }

export async function generateStaticParams() {
  return getAllProducts().map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = findBySlug(params.slug)
  if (!p) return { title: 'Product not found' }
  const url = `https://www.standardpaneer.example/product/${p.slug}`
  return {
    title: p.name,
    description: p.description,
    alternates: { canonical: url },
    openGraph: {
      title: p.name,
      description: p.description,
      url,
      type: 'product'
    }
  }
}

export default async function ProductPage({ params }: Props) {
  let p = findBySlug(params.slug)
  try {
    const api = await fetchProduct(params.slug)
    if (api) {
      const imgFor = (slug: string) => slug === 'malai-paneer' ? '/media/paneer.jpg' : slug === 'white-butter' ? '/media/white_butter.jpg' : slug === 'khoya' ? '/media/khoya.jpg' : undefined
      p = {
        id: api.id,
        slug: api.slug,
        name: api.name,
        description: api.description,
        price: api.price,
        currency: (api.currency as any) ?? 'INR',
        image: imgFor(api.slug),
      } as any
    }
  } catch {}
  if (!p) return <div>Product not found.</div>

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.description,
    sku: p.id,
    offers: {
      '@type': 'Offer',
      priceCurrency: p.currency,
      price: p.price,
      availability: 'https://schema.org/InStock'
    }
  }

  return (
    <div className="landing">

      <main className="max-w-7xl mx-auto px-4 py-8 grid md:grid-cols-2 gap-8">
      <div className="relative aspect-square bg-[#f7f3ea] rounded-2xl overflow-hidden">
        <ImageWithFallback src={p.image || '/media/placeholder.svg'} alt={p.name} fill sizes="(min-width: 768px) 50vw, 100vw" style={{objectFit:'cover'}} />
      </div>
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold">{p.name}</h1>
        <div className="text-slate-700">{p.description}</div>
        <div className="text-2xl font-bold">₹{p.price}</div>
        <button
          className="bg-[#6FAF3D] hover:bg-[#5F9B34] text-white px-4 py-2 rounded-full"
          onClick={() => {
            const cart = JSON.parse(localStorage.getItem('cart') || '[]') as { id: string; qty: number }[]
            const existing = cart.find(i => i.id === p.id)
            if (existing) existing.qty += 1
            else cart.push({ id: p.id, qty: 1 })
            localStorage.setItem('cart', JSON.stringify(cart))
            window.dispatchEvent(new CustomEvent('cart:updated'))
          }}
        >
          Add to Cart
        </button>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </div>
      </main>
    </div>
  )
}
