"use client"
import LoadingState from '@/components/LoadingState'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { apiAdminInventory, apiAdminAdjustInventory, type AdminInventoryItem } from '@/lib/api'
import { getToken, useClientUser } from '@/lib/auth'

const reasons = [
  'StockIn',
  'StockOut',
  'OrderPlaced',
  'OrderCancelled',
  'OrderFulfilled',
  'ManualAdjust',
  'Correction',
  'Damage',
  'Expired',
  'Return'
]

export default function AdminInventoryPage() {
  const user = useClientUser()
  const token = getToken() || undefined
  const [items, setItems] = useState<AdminInventoryItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<10 | 20 | 50>(20)
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [adjusting, setAdjusting] = useState(false)
  const [selected, setSelected] = useState<AdminInventoryItem | null>(null)
  const [form, setForm] = useState({ qtyDelta: '', reason: 'ManualAdjust', note: '' })

  const load = useCallback(async () => {
    setError(null)
    try {
      const data = await apiAdminInventory({ q: query, page, pageSize, token })
      setItems(data)
    } catch (e: any) {
      setError(e?.message || 'Failed to load inventory')
      setItems([])
    }
  }, [query, page, pageSize, token])

  useEffect(() => {
    load()
  }, [load])

  const units = useMemo(() => new Map([
    [1, 'Piece'],
    [2, 'Kilogram'],
    [3, 'Gram'],
    [4, 'Liter'],
    [5, 'Other']
  ]), [])

  if (user === undefined) {
    return <Shell title="Admin - Inventory"><LoadingState /></Shell>
  }
  if (!user || user.role?.toLowerCase() !== 'admin') {
    return <Shell title="Admin - Inventory"><div className="text-red-600">Not authorized.</div></Shell>
  }

  const openAdjust = (item: AdminInventoryItem) => {
    setSelected(item)
    setForm({ qtyDelta: '', reason: 'ManualAdjust', note: '' })
    setAdjustOpen(true)
  }

  const submitAdjust = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    setAdjusting(true)
    setError(null)
    try {
      const delta = Number(form.qtyDelta || 0)
      await apiAdminAdjustInventory({
        productId: selected.productId,
        qtyDelta: delta,
        reason: form.reason,
        note: form.note || undefined,
        token
      })
      setItems((prev) => prev ? prev.map((item) =>
        item.productId == selected.productId
          ? { ...item, quantity: item.quantity + delta }
          : item
      ) : prev)
      setToast('Inventory updated')
      setTimeout(() => setToast(null), 2500)
      setAdjustOpen(false)
      await load()
    } catch (e: any) {
      setError(e?.message || 'Failed to adjust inventory')
    } finally {
      setAdjusting(false)
    }
  }

  return (
    <Shell title="Inventory">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <input
            className="border rounded-md px-3 py-2 w-64"
            placeholder="Search by name"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
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
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
          </select>
        </div>
        <Link href="/inventory/transactions" className="text-[#2B7CBF] text-sm">View transactions</Link>
      </div>

      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-xl bg-[#6FAF3D] text-white px-4 py-2 shadow-lg">
          {toast}
        </div>
      )}
      {error && <div className="text-red-600 mb-3">{error}</div>}
      {items === null ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <div className="text-slate-600">No inventory items found.</div>
      ) : (
        <div className="overflow-auto border rounded-xl bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="text-left px-3 py-2">Product</th>
                <th className="text-right px-3 py-2">Stock</th>
                <th className="text-left px-3 py-2">Unit</th>
                <th className="text-left px-3 py-2">Active</th>
                <th className="text-left px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.productId} className="border-t">
                  <td className="px-3 py-2">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-slate-500">ID {item.productId}</div>
                  </td>
                  <td className="px-3 py-2 text-right font-semibold">{item.quantity}</td>
                  <td className="px-3 py-2">{units.get(item.unit) || 'Other'}</td>
                  <td className="px-3 py-2">
                    <Badge tone={item.isActive ? 'green' : 'gray'}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/inventory/transactions?productId=${item.productId}`}
                        className="text-[#2B7CBF] text-sm"
                      >
                        History
                      </Link>
                      <button
                        className="px-2 py-1 border rounded text-slate-700 hover:text-[#4DB6E2] hover:border-[#4DB6E2] transition-colors"
                        onClick={() => openAdjust(item)}
                      >
                        Adjust
                      </button>
                    </div>
                  </td>
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

      {adjustOpen && selected && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div>
                <div className="font-semibold">Adjust stock</div>
                <div className="text-xs text-slate-500">{selected.name}</div>
              </div>
              <button className="text-slate-500 hover:text-slate-800" onClick={() => setAdjustOpen(false)}>
                Close
              </button>
            </div>
            <form className="p-4 space-y-3" onSubmit={submitAdjust}>
              <div>
                <label className="block text-sm mb-1">Qty delta</label>
                <input
                  type="number"
                  className="border rounded-md px-3 py-2 w-full"
                  placeholder="e.g. -2 or 5"
                  value={form.qtyDelta}
                  onChange={(e) => setForm({ ...form, qtyDelta: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Reason</label>
                <select
                  className="border rounded-md px-3 py-2 w-full"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                >
                  {reasons.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Note</label>
                <textarea
                  className="border rounded-md px-3 py-2 w-full"
                  rows={2}
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="px-3 py-2 border rounded-md"
                  onClick={() => setAdjustOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjusting}
                  className="px-4 py-2 rounded-md bg-[#6FAF3D] text-white hover:bg-[#5F9B34] disabled:opacity-60"
                >
                  {adjusting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
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

function Badge({ children, tone = 'gray' }: { children: React.ReactNode; tone?: 'gray' | 'green' | 'amber' }) {
  const colors =
    tone === 'green'
      ? 'bg-green-100 text-green-800'
      : tone === 'amber'
      ? 'bg-amber-100 text-amber-800'
      : 'bg-slate-100 text-slate-700'
  return <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${colors}`}>{children}</span>
}




