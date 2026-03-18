"use client"
import LoadingState from '@/components/LoadingState'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { resolveUrl, resolveImagePath, apiArchiveProduct, apiRestoreProduct, apiDeleteProduct } from '@/lib/api'
import { useClientUser, getToken } from '@/lib/auth'
import { confirmAction, showError, showSuccess } from '@/lib/alert'

type UiProduct = {
  id: string
  name: string
  sku?: string
  description?: string
  price: number
  quantity?: number
  image?: string
  isActive?: boolean
}

export default function AdminProductsPage() {
  const user = useClientUser()
  const [items, setItems] = useState<UiProduct[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const token = getToken() || undefined
  const [showInactive, setShowInactive] = useState(false)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'qty_desc' | 'qty_asc'>('name_asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<10 | 20 | 50>(20)

  useEffect(() => {
    const load = async () => {
      try {
        const url = resolveUrl(`${process.env.NEXT_PUBLIC_PRODUCTS_ENDPOINT || '/api/Products'}?includeInactive=${showInactive}`)
        const res = await fetch(url, {
          cache: 'no-store',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        })
        if (!res.ok) throw new Error('Failed to fetch products')
        const data = await res.json()
        const mapped: UiProduct[] = (data || []).map((p: any) => ({
          id: String(p.id ?? p.Id),
          name: String(p.name ?? p.Name),
          sku: String(p.sku ?? p.SKU ?? ''),
          description: String(p.description ?? p.Description ?? ''),
          price: Number(p.price ?? p.Price ?? 0),
          quantity: Number(p.quantity ?? p.Quantity ?? 0),
          image: resolveImagePath(p.image ?? p.imageUrl ?? p.imageFileName ?? p.ImageFileName),
          isActive: Boolean(p.isActive ?? p.IsActive ?? true),
        }))
        setItems(mapped)
      } catch (e: any) {
        setError(e?.message || 'Failed to load products')
        setItems([])
      }
    }
    load()
  }, [showInactive, token])

  if (user === undefined) {
    return (
      <div className="landing">
        <main className="max-w-6xl mx-auto px-4 py-10">
          <h1 className="text-2xl font-bold mb-4">Admin - Products</h1>
          <div>Loading…</div>
        </main>
      </div>
    )
  }

  if (!user || user.role?.toLowerCase() !== 'admin') {
    return (
      <div className="landing">
        <main className="max-w-6xl mx-auto px-4 py-10">
          <h1 className="text-2xl font-bold mb-4">Admin - Products</h1>
          <div className="text-red-600">Not authorized. Please sign in with an Admin account.</div>
        </main>
      </div>
    )
  }

  return (
    <div className="landing">
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">Products</h1>
          <Link
            href="/products/new"
            className="bg-[#6FAF3D] hover:bg-[#5F9B34] text-white px-4 py-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4DB6E2]"
          >
            Add New Product
          </Link>
        </div>
        {error && <div className="text-red-600 mb-4">{error}</div>}
        {items === null ? (
          <div>Loading…</div>
        ) : items.length === 0 ? (
          <div className="text-slate-600">No products found.</div>
        ) : (
          <>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
                Show inactive
              </label>
              <input
                className="border rounded-md px-3 py-2 w-full max-w-xs"
                placeholder="Search name or SKU"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setPage(1)
                }}
              />
              <select
                className="border rounded-md px-3 py-2"
                value={sort}
                onChange={(e) => setSort(e.target.value as any)}
              >
                <option value="name_asc">Name ↑</option>
                <option value="name_desc">Name ↓</option>
                <option value="price_asc">Price ↑</option>
                <option value="price_desc">Price ↓</option>
                <option value="qty_desc">Qty ↓</option>
                <option value="qty_asc">Qty ↑</option>
              </select>
              <select
                className="border rounded-md px-3 py-2"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value) as any)
                  setPage(1)
                }}
              >
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>
            <div className="overflow-auto border rounded-xl bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="text-left px-3 py-2">Image</th>
                    <th className="text-left px-3 py-2">Name</th>
                    <th className="text-left px-3 py-2">SKU</th>
                    <th className="text-right px-3 py-2">Price (₹)</th>
                    <th className="text-right px-3 py-2">Qty</th>
                    <th className="text-left px-3 py-2">Status</th>
                    <th className="text-left px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items
                    .filter((p) => {
                      const q = query.trim().toLowerCase()
                      if (!q) return true
                      return p.name.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q)
                    })
                    .sort((a, b) => {
                      switch (sort) {
                        case 'name_desc':
                          return b.name.localeCompare(a.name)
                        case 'price_asc':
                          return a.price - b.price
                        case 'price_desc':
                          return b.price - a.price
                        case 'qty_asc':
                          return (a.quantity || 0) - (b.quantity || 0)
                        case 'qty_desc':
                          return (b.quantity || 0) - (a.quantity || 0)
                        default:
                          return a.name.localeCompare(b.name)
                      }
                    })
                    .slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize)
                    .map((p) => (
                      <tr key={p.id} className="border-t">
                        <td className="px-3 py-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {p.image ? (
                            <img src={p.image} alt="" className="h-12 w-16 object-cover rounded" />
                          ) : (
                            <div className="h-12 w-16 bg-slate-100 rounded grid place-items-center text-slate-400">—</div>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-medium">{p.name}</div>
                          <div className="text-slate-500 line-clamp-1 max-w-[420px]">{p.description}</div>
                        </td>
                        <td className="px-3 py-2">{p.sku || '—'}</td>
                        <td className="px-3 py-2 text-right">{p.price}</td>
                        <td className="px-3 py-2 text-right">{p.quantity ?? '—'}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/products/${p.id}/edit`}
                              className="px-2 py-1 border border-slate-300 rounded text-slate-700 hover:text-[#4DB6E2] hover:border-[#4DB6E2] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#4DB6E2]"
                            >
                              Edit
                            </Link>
                            <button
                              className="px-2 py-1 border rounded text-red-600 border-red-200 hover:text-red-700 hover:border-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500"
                              disabled={deleting === p.id}
                              onClick={async () => {
                                const confirmed = await confirmAction({
                                  title: 'Delete product',
                                  text: 'Historical products cannot be removed once used. If this product is referenced, deletion will be blocked and you should archive it instead.',
                                  confirmText: 'Delete',
                                  cancelText: 'Cancel',
                                })
                                if (!confirmed) return
                                try {
                                  setError(null)
                                  setDeleting(p.id)
                                  await apiDeleteProduct(p.id, token)
                                  setItems((prev) => (prev ? prev.filter((x) => x.id !== p.id) : prev))
                                  await showSuccess('Operation completed successfully')
                                } catch (e: any) {
                                  const message = e?.message || 'Something went wrong'
                                  setError(message)
                                  await showError(message, message.toLowerCase().includes('cannot be deleted') ? 'Cannot delete' : 'Delete failed')
                                } finally {
                                  setDeleting(null)
                                }
                              }}
                            >
                              {deleting === p.id ? 'Deleting?' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {(() => {
              const total = items
                .filter((p) => {
                  const q = query.trim().toLowerCase()
                  if (!q) return true
                  return p.name.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q)
                })
                .length
              const totalPages = Math.max(1, Math.ceil(total / pageSize))
              const canPrev = page > 1
              const canNext = page < totalPages
              const start = (page - 1) * pageSize + 1
              const end = Math.min(page * pageSize, total)
              return (
                <div className="mt-4 flex items-center justify-between text-sm">
                  <div className="text-slate-600">Showing {total === 0 ? 0 : start}–{end} of {total}</div>
                  <div className="flex items-center gap-2">
                    <button
                      className="px-3 py-1 border rounded disabled:opacity-50"
                      disabled={!canPrev}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Prev
                    </button>
                    <span>
                      Page {page} of {totalPages}
                    </span>
                    <button
                      className="px-3 py-1 border rounded disabled:opacity-50"
                      disabled={!canNext}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )
            })()}
          </>
        )}
    </main>
    </div>
  )
}


