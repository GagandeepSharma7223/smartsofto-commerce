"use client"
import { useEffect, useMemo, useState } from 'react'
import { resolveUrl, resolveImagePath } from '@/lib/api'
import ProductCard from '@/components/ProductCard'
import ProductVariantsCard from '@/components/ProductVariantsCard'
import { getFallbackStorefrontProducts, normalizeStorefrontProducts, type StorefrontProduct } from '@/lib/storefront'

type UiProduct = {
  id: string
  slug: string
  name: string
  description: string
  price: number
  currency?: string
  image?: string
}

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
  if (unit === 'l') return val * 1000
  if (unit === 'ml') return val
  return val
}

export default function ProductsClientVariants() {
  const [items, setItems] = useState<StorefrontProduct[] | null>(null)
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState('featured')
  const [query, setQuery] = useState('')

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
        setItems(normalizeStorefrontProducts(mapped as any))
      })
      .catch(() => setItems(getFallbackStorefrontProducts()))
  }, [])

  const catalogueItems = useMemo(() => items || [], [items])

  const categories = useMemo(() => {
    return ['All', ...Array.from(new Set(catalogueItems.map((item) => item.category))).sort((a, b) => a.localeCompare(b))]
  }, [catalogueItems])

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const filtered = catalogueItems.filter((item) => {
      const matchesCategory = category === 'All' || item.category === category
      const searchable = `${item.name} ${item.category} ${item.size} ${item.blurb} ${item.description}`.toLowerCase()
      return matchesCategory && (!normalizedQuery || searchable.includes(normalizedQuery))
    })

    return [...filtered].sort((a, b) => {
      if (sort === 'price-low') return a.price - b.price
      if (sort === 'price-high') return b.price - a.price
      if (sort === 'name') return a.name.localeCompare(b.name)
      return 0
    })
  }, [catalogueItems, category, query, sort])

  const grouped = useMemo(() => {
    const groupsMap = new Map<string, StorefrontProduct[]>()
    for (const it of filteredItems) {
      const { base } = splitBaseVariant(it.name)
      const arr = groupsMap.get(base) || []
      arr.push(it)
      groupsMap.set(base, arr)
    }

    return Array.from(groupsMap.entries())
  }, [filteredItems])

  if (!items) return <div className="py-12 text-center text-slate-600">Loading products...</div>
  if (!items.length) return <div className="py-12 text-center text-slate-600">No products found.</div>

  return (
    <section className="catalog-main-area" aria-label="Product catalogue">
      <div className="catalog-toolbar">
        <p className="catalog-toolbar__count">
          {filteredItems.length} {filteredItems.length === 1 ? 'product' : 'products'}
        </p>

        <div className="catalog-toolbar__controls">
          <label className="catalog-toolbar__field">
            <span>Search</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products"
              className="catalog-toolbar__input"
              type="search"
            />
          </label>

          <label className="catalog-toolbar__field">
            <span>Category</span>
            <select className="catalog-toolbar__select" value={category} onChange={(event) => setCategory(event.target.value)}>
              {categories.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>

          <label className="catalog-toolbar__field">
            <span>Sort</span>
            <select className="catalog-toolbar__select" value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="featured">Featured</option>
              <option value="name">Name A-Z</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
            </select>
          </label>
        </div>
      </div>

      {grouped.length ? (
        <div className="catalog-product-grid">
          {grouped.map(([base, list]) => {
            if (list.length <= 1) {
              return <ProductCard key={list[0].id} product={list[0]} />
            }
            const variants = list
              .map((p) => ({
                id: p.id,
                label: p.size || (p.description && p.description.trim()) || splitBaseVariant(p.name).label || '',
                price: p.price,
                currency: p.currency,
                slug: p.slug,
                availability: p.availability,
              }))
              .sort((a, b) => weightToGrams(a.label) - weightToGrams(b.label))
            const image = list[0]?.image
            return <ProductVariantsCard key={base} group={{ baseName: base, image, category: list[0]?.category, variants }} />
          })}
        </div>
      ) : (
        <div className="catalog-empty-state">
          <p>No products match the current filters.</p>
          <button type="button" onClick={() => { setCategory('All'); setSort('featured'); setQuery('') }}>
            Reset filters
          </button>
        </div>
      )}
    </section>
  )
}
