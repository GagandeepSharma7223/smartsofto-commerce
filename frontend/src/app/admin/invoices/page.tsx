"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiAdminInvoices, apiAdminCreateInvoice, type AdminInvoice } from '@/lib/api'
import { useClientUser } from '@/lib/auth'

export default function AdminInvoicesPage({ searchParams }: { searchParams: { orderId?: string } }) {
  const user = useClientUser()
  const [rows, setRows] = useState<AdminInvoice[] | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [orderFilter, setOrderFilter] = useState(searchParams.orderId || '')
  const [form, setForm] = useState({ orderId: searchParams.orderId || '', amount: '', paymentMethod: '1', referenceNumber: '', notes: '' })
  const [saving, setSaving] = useState(false)

  const load = async (orderId?: number) => {
    setErr(null)
    try {
      const data = await apiAdminInvoices(orderId)
      setRows(data)
    } catch (e: any) {
      setErr(e?.message || 'Failed to load invoices')
      setRows([])
    }
  }

  useEffect(() => {
    const idNum = orderFilter ? Number(orderFilter) : undefined
    load(Number.isFinite(idNum) ? idNum : undefined)
  }, [orderFilter])

  if (user === null) {
    return <Shell title="Admin — Invoices"><div>Loading…</div></Shell>
  }
  if (!user || user.role?.toLowerCase() !== 'admin') {
    return <Shell title="Admin — Invoices"><div className="text-red-600">Not authorized.</div></Shell>
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    setSaving(true)
    try {
      const payload = {
        orderId: Number(form.orderId),
        amount: Number(form.amount),
        paymentMethod: Number(form.paymentMethod),
        referenceNumber: form.referenceNumber || undefined,
        notes: form.notes || undefined
      }
      await apiAdminCreateInvoice(payload)
      setForm({ ...form, amount: '', referenceNumber: '', notes: '' })
      await load(payload.orderId)
    } catch (e: any) {
      setErr(e?.message || 'Failed to create invoice')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Shell title="Invoices & Payments">
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <input
              className="border rounded-md px-3 py-2 w-40"
              placeholder="Filter by Order ID"
              value={orderFilter}
              onChange={(e) => setOrderFilter(e.target.value)}
            />
            <button
              className="px-3 py-2 border rounded-md text-sm"
              onClick={() => load(undefined)}
            >
              Clear filter
            </button>
          </div>
          {err && <div className="text-red-600 mb-3">{err}</div>}
          {rows === null ? (
            <div>Loading…</div>
          ) : rows.length === 0 ? (
            <div className="text-slate-600">No invoices found.</div>
          ) : (
            <div className="overflow-auto border rounded-xl bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="text-left px-3 py-2">Invoice</th>
                    <th className="text-left px-3 py-2">Order</th>
                    <th className="text-right px-3 py-2">Amount</th>
                    <th className="text-left px-3 py-2">Method</th>
                    <th className="text-left px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((inv) => (
                    <tr key={inv.id} className="border-t">
                      <td className="px-3 py-2">
                        <div className="font-semibold">{inv.invoiceNumber}</div>
                        <div className="text-xs text-slate-500">{new Date(inv.createdAt || '').toLocaleString()}</div>
                      </td>
                      <td className="px-3 py-2">
                        <div>Order {inv.orderNumber || inv.orderId}</div>
                        <div className="text-xs text-slate-500">{inv.clientName || '—'}</div>
                      </td>
                      <td className="px-3 py-2 text-right font-semibold">₹{Number(inv.amount || 0).toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2 text-sm">{renderPayment(inv.paymentMethod)}</td>
                      <td className="px-3 py-2">
                        <Badge tone={inv.status === 2 ? 'green' : inv.status === 3 ? 'amber' : 'gray'}>
                          {renderStatus(inv.status)}
                        </Badge>
                        {inv.referenceNumber && (
                          <div className="text-xs text-slate-500 mt-1">Ref: {inv.referenceNumber}</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="border rounded-xl bg-white shadow-sm p-4 h-fit">
          <h2 className="text-lg font-semibold mb-3">Add payment / invoice</h2>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="block text-sm mb-1">Order ID</label>
              <input
                className="border rounded-md px-3 py-2 w-full"
                value={form.orderId}
                onChange={(e) => setForm({ ...form, orderId: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Amount</label>
              <input
                type="number"
                step="0.01"
                className="border rounded-md px-3 py-2 w-full"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Payment method</label>
              <select
                className="border rounded-md px-3 py-2 w-full"
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
              >
                <option value="1">Cash</option>
                <option value="2">UPI</option>
                <option value="3">Cheque</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Reference #</label>
              <input
                className="border rounded-md px-3 py-2 w-full"
                value={form.referenceNumber}
                onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Notes</label>
              <textarea
                className="border rounded-md px-3 py-2 w-full"
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-[#d9138a] hover:bg-[#c2107c] text-white px-4 py-2 rounded-md transition-colors disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save payment'}
            </button>
          </form>
        </div>
      </div>
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

function renderStatus(status?: number) {
  switch (status) {
    case 2:
      return 'Paid'
    case 3:
      return 'PartiallyPaid'
    default:
      return 'Unpaid'
  }
}

function renderPayment(method?: number) {
  switch (method) {
    case 2:
      return 'UPI'
    case 3:
      return 'Cheque'
    default:
      return 'Cash'
  }
}
