"use client"
import { useEffect, useState } from 'react'
import { resolveUrl } from '@/lib/api'
import { getToken } from '@/lib/auth'

export default function OrdersPage() {
  const [rows, setRows] = useState<any[] | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setErr(null)
      try {
        const url = resolveUrl('/api/Orders')
        const token = getToken()
        const res = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          cache: 'no-store'
        })
        if (res.status === 401 || res.status === 403) {
          setErr('Please sign in to view your orders.')
          setRows([])
          return
        }
        if (!res.ok) throw new Error('Failed to load orders')
        const data = await res.json()
        setRows(Array.isArray(data) ? data : [])
      } catch (e: any) {
        setErr(e?.message || 'Failed to load orders')
      }
    }
    load()
  }, [])

  return (
    <div className="landing">
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">My Orders</h1>
        {err && <div className="text-red-600 mb-4">{err}</div>}
        {rows === null ? (
          <div>Loading…</div>
        ) : rows.length === 0 ? (
          <div className="text-slate-600">No orders to display.</div>
        ) : (
          <div className="divide-y">
            {rows.map((o: any) => (
              <div key={o.id ?? o.Id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">Order #{o.orderNumber ?? o.OrderNumber ?? o.id ?? o.Id}</div>
                  <div className="text-sm text-slate-600">{new Date(o.createdAt ?? o.CreatedAt ?? Date.now()).toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">₹{o.totalAmount ?? o.TotalAmount ?? '—'}</div>
                  <div className="text-sm">{o.status ?? o.Status ?? ''}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
