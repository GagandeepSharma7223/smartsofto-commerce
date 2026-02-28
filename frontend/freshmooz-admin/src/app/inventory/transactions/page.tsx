"use client"
import LoadingState from '@/components/LoadingState'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { apiAdminInventory, apiAdminInventoryTransactions, type AdminInventoryItem, type AdminInventoryTransaction } from '@/lib/api'
import { getToken, useClientUser } from '@/lib/auth'

export default function AdminInventoryTransactionsPage() {
  const user = useClientUser()
  const token = getToken() || undefined
  const [items, setItems] = useState<AdminInventoryTransaction[] | null>(null)
  const [products, setProducts] = useState<AdminInventoryItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [productId, setProductId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<20 | 50 | 100>(50)

  const loadProducts = useCallback(async () => {
    try {
      const data = await apiAdminInventory({ page: 1, pageSize: 200, token })
      setProducts(data)
    } catch {
      setProducts([])
    }
  }, [token])

  const loadTransactions = useCallback(async () => {
    setError(null)
    try {
      const pid = productId ? Number(productId) : undefined
      const fromIso = from ? `${from}T00:00:00Z` : undefined
      const toIso = to ? `${to}T23:59:59Z` : undefined
      const data = await apiAdminInventoryTransactions({
        productId: Number.isFinite(pid) ? pid : undefined,
        from: fromIso,
        to: toIso,
        page,
        pageSize,
        token
      })
      setItems(data)
    } catch (e: any) {
      setError(e?.message || 'Failed to load transactions')
      setItems([])
    }
  }, [productId, from, to, page, pageSize, token])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

  const productNameById = useMemo(() => {
    const map = new Map<number, string>()
    for (const p of products) map.set(p.productId, p.name)
    return map
  }, [products])

  if (user === undefined) {
    return <Shell title="Admin - Inventory Transactions"><LoadingState /></Shell>
  }
  if (!user || user.role?.toLowerCase() !== 'admin') {
    return <Shell title="Admin - Inventory Transactions"><div className="text-red-600">Not authorized.</div></Shell>
  }

  return (
    <Shell title="Inventory Transactions">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <select
            className="border rounded-md px-3 py-2"
            value={productId}
            onChange={(e) => {
              setProductId(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All products</option>
            {products.map((p) => (
              <option key={p.productId} value={p.productId}>{p.name}</option>
            ))}
          </select>
          <input
            type="date"
            className="border rounded-md px-3 py-2"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value)
              setPage(1)
            }}
          />
          <input
            type="date"
            className="border rounded-md px-3 py-2"
            value={to}
            onChange={(e) => {
              setTo(e.target.value)
              setPage(1)
            }}
          />
          <select
            className="border rounded-md px-3 py-2"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value) as any)
              setPage(1)
            }}
          >
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>
        </div>
        <Link href="/inventory" className="text-[#2B7CBF] text-sm">Back to inventory</Link>
      </div>

      {error && <div className="text-red-600 mb-3">{error}</div>}
      {items === null ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <div className="text-slate-600">No transactions found.</div>
      ) : (
        <div className="overflow-auto border rounded-xl bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="text-left px-3 py-2">Created</th>
                <th className="text-left px-3 py-2">Product</th>
                <th className="text-right px-3 py-2">Qty Delta</th>
                <th className="text-left px-3 py-2">Reason</th>
                <th className="text-left px-3 py-2">Reference</th>
                <th className="text-left px-3 py-2">Note</th>
              </tr>
            </thead>
            <tbody>
              {items.map((t) => (
                <tr key={t.id} className="border-t">
                  <td className="px-3 py-2">
                    {new Date(t.createdUtc).toLocaleString()}
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-medium">{t.productName || productNameById.get(t.productId) || `#${t.productId}`}</div>
                    <div className="text-xs text-slate-500">ID {t.productId}</div>
                  </td>
                  <td className={`px-3 py-2 text-right font-semibold ${t.quantityDelta < 0 ? 'text-red-600' : 'text-green-700'}`}>
                    {t.quantityDelta}
                  </td>
                  <td className="px-3 py-2">{t.reason}</td>
                  <td className="px-3 py-2">
                    <div>{t.referenceType}</div>
                    {t.referenceId && <div className="text-xs text-slate-500">{t.referenceId}</div>}
                  </td>
                  <td className="px-3 py-2">{t.note || '-' }</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {items && items.length > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="text-slate-600">Page {page}</div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              disabled={items.length < pageSize}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </Shell>
  )
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="landing">
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{title}</h1>
          <Link href="/" className="text-[#2B7CBF]">Back to dashboard</Link>
        </div>
        {children}
      </main>
    </div>
  )
}





