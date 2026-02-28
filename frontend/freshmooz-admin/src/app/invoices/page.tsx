"use client"
import LoadingState from '@/components/LoadingState'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { apiAdminInvoices, apiAdminCreateInvoice, type AdminInvoice } from '@/lib/api'
import { useClientUser } from '@/lib/auth'

type InvoiceGroup = {
  orderId: number
  orderNumber?: string
  clientName?: string
  paidSoFar: number
  totalAmount?: number
  orderAmountPaid?: number
  invoiceStatus?: number
  paymentCount: number
  latestInvoiceNumber?: string
  latestCreatedAt?: string
  latestPaymentMethod?: number
  latestReference?: string
}

export default function AdminInvoicesPage({ searchParams }: { searchParams: { orderId?: string } }) {
  const user = useClientUser()
  const [rows, setRows] = useState<AdminInvoice[] | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [orderFilter, setOrderFilter] = useState(searchParams.orderId || '')
  const [form, setForm] = useState({
    orderId: searchParams.orderId || '',
    amount: '',
    paymentMethod: '1',
    referenceNumber: '',
    notes: ''
  })
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState<InvoiceGroup | null>(null)
  const [amountError, setAmountError] = useState<string | null>(null)
  const amountRef = useRef<HTMLInputElement>(null)

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

  useEffect(() => {
    if (!showModal) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowModal(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showModal])

  useEffect(() => {
    if (!showModal) return
    const timer = setTimeout(() => amountRef.current?.focus(), 0)
    return () => clearTimeout(timer)
  }, [showModal])

  const groupedRows = useMemo(() => {
    if (!rows) return [] as InvoiceGroup[]
    const map = new Map<number, InvoiceGroup>()
    for (const inv of rows) {
      const amount = Number(inv.amount || 0)
      const createdAtMs = inv.createdAt ? Date.parse(inv.createdAt) : 0
      const existing = map.get(inv.orderId)
      if (!existing) {
        map.set(inv.orderId, {
          orderId: inv.orderId,
          orderNumber: inv.orderNumber,
          clientName: inv.clientName,
          paidSoFar: amount,
          totalAmount: inv.orderTotalAmount ?? undefined,
          orderAmountPaid: inv.orderAmountPaid ?? undefined,
          invoiceStatus: inv.orderInvoiceStatus ?? inv.status,
          paymentCount: 1,
          latestInvoiceNumber: inv.invoiceNumber,
          latestCreatedAt: inv.createdAt,
          latestPaymentMethod: inv.paymentMethod,
          latestReference: inv.referenceNumber
        })
        continue
      }
      const latestMs = existing.latestCreatedAt ? Date.parse(existing.latestCreatedAt) : 0
      const isLatest = createdAtMs >= latestMs
      map.set(inv.orderId, {
        orderId: existing.orderId,
        orderNumber: existing.orderNumber ?? inv.orderNumber,
        clientName: existing.clientName ?? inv.clientName,
        paidSoFar: existing.paidSoFar + amount,
        totalAmount: existing.totalAmount ?? inv.orderTotalAmount ?? undefined,
        orderAmountPaid: existing.orderAmountPaid ?? inv.orderAmountPaid ?? undefined,
        invoiceStatus: inv.orderInvoiceStatus ?? existing.invoiceStatus ?? inv.status,
        paymentCount: existing.paymentCount + 1,
        latestInvoiceNumber: isLatest ? inv.invoiceNumber : existing.latestInvoiceNumber,
        latestCreatedAt: isLatest ? inv.createdAt : existing.latestCreatedAt,
        latestPaymentMethod: isLatest ? inv.paymentMethod : existing.latestPaymentMethod,
        latestReference: isLatest ? inv.referenceNumber : existing.latestReference
      })
    }
    return Array.from(map.values()).sort((a, b) => {
      const aMs = a.latestCreatedAt ? Date.parse(a.latestCreatedAt) : 0
      const bMs = b.latestCreatedAt ? Date.parse(b.latestCreatedAt) : 0
      return bMs - aMs
    })
  }, [rows])

  if (user === undefined) {
    return <Shell title="Payments"><LoadingState /></Shell>
  }
  if (!user || user.role?.toLowerCase() !== 'admin') {
    return <Shell title="Payments"><div className="text-red-600">Not authorized.</div></Shell>
  }

  const openModal = (group: InvoiceGroup) => {
    setSelected(group)
    setForm({
      orderId: String(group.orderId),
      amount: '',
      paymentMethod: '1',
      referenceNumber: '',
      notes: ''
    })
    setAmountError(null)
    setErr(null)
    setSuccess(null)
    setShowModal(true)
  }

  const closeModal = () => {
    if (saving) return
    setShowModal(false)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    setSuccess(null)
    setAmountError(null)

    const amountNum = Number(form.amount)
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setAmountError('Amount must be greater than 0.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        orderId: Number(form.orderId),
        amount: amountNum,
        paymentMethod: Number(form.paymentMethod),
        referenceNumber: form.referenceNumber || undefined,
        notes: form.notes || undefined
      }
      await apiAdminCreateInvoice(payload)
      await load(orderFilter ? Number(orderFilter) : undefined)
      setSuccess(`Payment recorded for order ${payload.orderId}.`)
      setShowModal(false)
    } catch (e: any) {
      setErr(e?.message || 'Failed to create invoice')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Shell title="Payments">
      <p className="text-slate-600 mb-6">Record payments against orders and track balances.</p>
      <div className="flex items-center gap-3 mb-4">
        <input
          type="number"
          className="border rounded-md px-3 py-2 w-40"
          placeholder="e.g., 6"
          value={orderFilter}
          onChange={(e) => setOrderFilter(e.target.value)}
        />
        <button
          className="px-3 py-2 border rounded-md text-sm"
          onClick={() => {
            setOrderFilter('')
            load(undefined)
          }}
        >
          Clear filter
        </button>
      </div>
      {success && <div className="text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-md mb-3">{success}</div>}
      {err && <div className="text-red-600 mb-3">{err}</div>}
      {rows === null ? (
        <LoadingState />
      ) : groupedRows.length === 0 ? (
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
                <th className="text-left px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {groupedRows.map((group) => {
                const statusValue = group.invoiceStatus ?? 1
                const paidDisplay = group.orderAmountPaid ?? group.paidSoFar
                const totalDisplay = group.totalAmount
                const balance = totalDisplay != null ? totalDisplay - paidDisplay : null
                return (
                  <tr key={group.orderId} className="border-t">
                    <td className="px-3 py-2">
                      <div className="font-semibold">{group.latestInvoiceNumber || '-'}</div>
                      <div className="text-xs text-slate-500">
                        {group.latestCreatedAt ? new Date(group.latestCreatedAt).toLocaleString() : ''}
                      </div>
                      <div className="text-xs text-slate-500">{group.paymentCount} payment{group.paymentCount === 1 ? '' : 's'}</div>
                    </td>
                    <td className="px-3 py-2">
                      <div>Order {group.orderNumber || group.orderId}</div>
                      <div className="text-xs text-slate-500">{group.clientName || '-'}</div>
                    </td>
                    <td className="px-3 py-2 text-right font-semibold">
                      {formatInr(paidDisplay)}
                      {totalDisplay != null && (
                        <div className="text-xs text-slate-500">of {formatInr(totalDisplay)}</div>
                      )}
                      {balance != null && (
                        <div className="text-xs text-slate-500">Balance {formatInr(balance)}</div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-sm">{renderPayment(group.latestPaymentMethod)}</td>
                    <td className="px-3 py-2">
                      <Badge tone={statusValue === 2 ? 'green' : statusValue === 3 ? 'amber' : 'gray'}>
                        {renderStatus(statusValue)}
                      </Badge>
                      {group.latestReference && (
                        <div className="text-xs text-slate-500 mt-1">Ref: {group.latestReference}</div>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        className="text-sm text-[#2B7CBF] hover:underline"
                        onClick={() => openModal(group)}
                      >
                        Record payment
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onMouseDown={closeModal}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-5"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Record payment</h2>
                <p className="text-sm text-slate-500">Order {selected.orderNumber || selected.orderId}</p>
              </div>
              <button className="text-slate-500 hover:text-slate-700" onClick={closeModal}>
                ?
              </button>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-sm mb-4">
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Client</span>
                <span className="font-medium">{selected.clientName || '-'}</span>
              </div>
              {selected.totalAmount != null && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Order total</span>
                  <span className="font-medium">{formatInr(selected.totalAmount)}</span>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Paid so far</span>
                <span className="font-medium">{formatInr(selected.orderAmountPaid ?? selected.paidSoFar)}</span>
              </div>
              {selected.totalAmount != null && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Balance</span>
                  <span className="font-medium">{formatInr(Math.max(selected.totalAmount - (selected.orderAmountPaid ?? selected.paidSoFar), 0))}</span>
                </div>
              )}
            </div>
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="block text-sm mb-1">Order ID</label>
                <input
                  className="border rounded-md px-3 py-2 w-full bg-slate-50"
                  value={form.orderId}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Amount</label>
                <input
                  ref={amountRef}
                  type="number"
                  step="0.01"
                  className="border rounded-md px-3 py-2 w-full"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                />
                {amountError && <div className="text-xs text-red-600 mt-1">{amountError}</div>}
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
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 border rounded-md text-sm"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#6FAF3D] hover:bg-[#5F9B34] text-white px-4 py-2 rounded-md text-sm transition-colors disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save payment'}
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
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold">{title}</h1>
          <Link href="/" className="text-[#2B7CBF]">Back to dashboard</Link>
        </div>
        {children}
      </main>
    </div>
  )
}

function formatInr(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value)
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

