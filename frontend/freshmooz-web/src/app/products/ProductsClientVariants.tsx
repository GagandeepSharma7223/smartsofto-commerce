"use client"
import { useEffect, useState } from 'react'
import { resolveUrl, resolveImagePath } from '@/lib/api'
import ProductCard from '@/components/ProductCard'
import ProductVariantsCard from '@/components/ProductVariantsCard'

type UiProduct = {
  id: string
  slug: string
  name: string
  description: string
  price: number
  currency?: string
  image?: string
}

export default function ProductsClientVariants() {
  const [items, setItems] = useState<UiProduct[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const url = resolveUrl(process.env.NEXT_PUBLIC_PRODUCTS_ENDPOINT || '/api/Products')
    fetch(url, { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        const mapped: UiProduct[] = (data || []).map((p: any) => ({
          id: String(p.id ?? p.Id),
          slug: (p.sku ?? p.SKU)
            ? String(p.sku ?? p.SKU)
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .trim()
                .replace(/\s+/g, '-')
            : `${String(p.name ?? p.Name)
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .trim()
                .replace(/\s+/g, '-')}-${p.id ?? p.Id}`,
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

  // Split a trailing weight (e.g., "250g", "1 kg", "1L") from name for grouping
  const splitBaseVariant = (name: string) => {
    const m = name.trim().match(/^(.*?)[\s-]*((\d+(?:\.\d+)?)\s?(g|kg|gram|kilogram|ml|l|liter|litre))$/i)
    if (m) {
      const unit = m[4].toLowerCase()
      const normUnit = unit.startsWith('kg') ? 'kg' : unit.startsWith('g') ? 'g' : unit.startsWith('l') ? 'L' : unit.startsWith('ml') ? 'ml' : unit
      const qty = m[3]
      return { base: m[1].trim(), label: `${qty}${normUnit}` }
    }
    return { base: name.trim(), label: '' }
  }

  const weightToGrams = (label: string) => {
    const m = label.match(/(\d+(?:\.\d+)?)(kg|g|ml|l)/i)
    if (!m) return Number.MAX_SAFE_INTEGER
    const val = parseFloat(m[1])
    const unit = m[2].toLowerCase()
    if (unit === 'kg') return val * 1000
    if (unit === 'l') return val * 1000 // treat 1L ~ 1000ml for ordering
    if (unit === 'ml') return val
    return val // grams
  }

  const groupsMap = new Map<string, UiProduct[]>()
  for (const it of items) {
    const { base } = splitBaseVariant(it.name)
    const arr = groupsMap.get(base) || []
    arr.push(it)
    groupsMap.set(base, arr)
  }

  const grouped = Array.from(groupsMap.entries())
  return (
    <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {grouped.map(([base, list]) => {
        if (list.length <= 1) {
          return <ProductCard key={list[0].id} product={list[0] as any} />
        }
        const variants = list
          .map((p) => ({
            id: p.id,
            // Use description as label; fallback to parsed weight; else empty
            label: (p.description && p.description.trim()) || splitBaseVariant(p.name).label || '',
            price: p.price,
            currency: p.currency,
            slug: p.slug,
          }))
          .sort((a, b) => weightToGrams(a.label) - weightToGrams(b.label))
        const image = (list as any)[0]?.image
        return <ProductVariantsCard key={base} group={{ baseName: base, image, variants }} />
      })}
    </div>
  )
}
