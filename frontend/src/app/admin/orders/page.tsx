"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { apiAdminOrders, apiAdminUpdateOrderStatus, type AdminOrder } from '@/lib/api'
import { useClientUser } from '@/lib/auth'

const statusOptions = ['All', 'Pending', 'Delivered', 'Cancelled']

export default function AdminOrdersPage() {
  const user = useClientUser()
  const [rows, setRows] = useState<AdminOrder[] | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [status, setStatus] = useState('All')
  const [updating, setUpdating] = useState<number | null>(null)

  useEffect(() => {
    const load = async () => {
      setErr(null)
      try {
        const data = await apiAdminOrders(status === 'All' ? undefined : status)
        setRows(data)
      } catch (e: any) {
        setErr(e?.message || 'Failed to load orders')
        setRows([])
      }
    }
    load()
  }, [status])

  const filtered = useMemo(() => rows || [], [rows])

  if (user === null) {
    return <Shell title="Admin — Orders"><div>Loading…</div></Shell>
  }
  if (!user || user.role?.toLowerCase() !== 'admin') {
    return <Shell title="Admin — Orders"><div className="text-red-600">Not authorized.</div></Shell>
  }

  return (
    <Shell title="Orders">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-slate-600">{filtered.length} orders</div>
        <select
          className="border rounded-md px-3 py-2"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      {err && <div className="text-red-600 mb-3">{err}</div>}
      {rows === null ? (
        <div>Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-slate-600">No orders found.</div>
      ) : (
        <div className="overflow-auto border rounded-xl bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="text-left px-3 py-2">Order</th>
                <th className="text-left px-3 py-2">Client</th>
                <th className="text-left px-3 py-2">Product</th>
                <th className="text-right px-3 py-2">Amount</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-left px-3 py-2">Invoice</th>
                <th className="text-left px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-t">
                  <td className="px-3 py-2">
                    <div className="font-semibold">{o.orderNumber || `#${o.id}`}</div>
                    <div className="text-xs text-slate-500">{new Date(o.createdAt || '').toLocaleString()}</div>
                  </td>
                  <td className="px-3 py-2">
                    <div>{o.clientName || '—'}</div>
                  </td>
                  <td className="px-3 py-2">
                    <div>{o.productName || '—'}</div>
                    <div className="text-xs text-slate-500">Qty {o.quantity}</div>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="font-semibold">₹{Number(o.totalAmount || 0).toLocaleString('en-IN')}</div>
                    <div className="text-xs text-slate-500">Paid ₹{Number(o.amountPaid || 0).toLocaleString('en-IN')}</div>
                  </td>
                  <td className="px-3 py-2">
                    <Badge>{o.status}</Badge>
                  </td>
                  <td className="px-3 py-2">
                    <Badge tone={o.invoiceStatus === 'Paid' ? 'green' : o.invoiceStatus === 'PartiallyPaid' ? 'amber' : 'gray'}>
                      {o.invoiceStatus || '—'}
                    </Badge>
                    <div className="text-xs text-slate-500">Due ₹{Number(o.remainingAmount || 0).toLocaleString('en-IN')}</div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/invoices?orderId=${o.id}`} className="text-[#d9138a] text-sm">Invoices</Link>
                      <select
                        className="border rounded px-2 py-1 text-sm"
                        value={o.status}
                        disabled={updating === o.id}
                        onChange={async (e) => {
                          const val = e.target.value
                          try {
                            setUpdating(o.id)
                            await apiAdminUpdateOrderStatus(o.id, val)
                            setRows(rows => rows ? rows.map(r => r.id === o.id ? { ...r, status: val as any } : r) : rows)
                          } catch (err: any) {
                            alert(err?.message || 'Update failed')
                          } finally {
                            setUpdating(null)
                          }
                        }}
                      >
                        {['Pending', 'Delivered', 'Cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
          <Link href="/admin" className="text-[#d9138a]">Back to dashboard</Link>
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
