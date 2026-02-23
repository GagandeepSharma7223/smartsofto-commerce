"use client"
import { useEffect, useState } from 'react'
import { resolveUrl, resolveImagePath } from '@/lib/api'
import ProductCard from '@/components/ProductCard'

type UiProduct = {
  id: string
  slug: string
  name: string
  description: string
  price: number
  currency?: string
}

export default function ProductsClient() {
  const [items, setItems] = useState<UiProduct[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const url = resolveUrl(process.env.NEXT_PUBLIC_PRODUCTS_ENDPOINT || '/api/Products')
    console.log('[products-client] fetching', url)
    fetch(url, { cache: 'no-store' })
      .then(async (res) => {
        console.log('[products-client] status', res.status)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        const mapped: UiProduct[] = (data || []).map((p: any) => ({
          id: String(p.id ?? p.Id),
          slug: (p.sku ?? p.SKU) ? String(p.sku ?? p.SKU).toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-') : `${String(p.name ?? p.Name).toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')}-${p.id ?? p.Id}`,
          name: String(p.name ?? p.Name),
          description: String(p.description ?? p.Description ?? ''),
          price: Number(p.price ?? p.Price ?? 0),
          currency: 'INR',
          image: resolveImagePath(p.image ?? p.imageUrl ?? p.imageFileName ?? p.ImageFileName),
        }))
        setItems(mapped)
      })
      .catch((e) => setError(e?.message || 'Failed to fetch products'))
  }, [])

  if (error) return <div className="text-center text-red-600 py-12">{error}</div>
  if (!items) return <div className="text-center text-slate-600 py-12">Loading products...</div>
  if (!items.length) return <div className="text-center text-slate-600 py-12">No products found.</div>

  return (
    <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {items.map(p => (
        <ProductCard key={p.id} product={p as any} />
      ))}
    </div>
  )
}

