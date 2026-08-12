"use client"
import LoadingState from '@/components/LoadingState'
import AdminAlert from '@/components/AdminAlert'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { apiAdminInvoices, apiAdminCreateInvoice, apiAdminDownloadInvoicePdf, type AdminInvoice } from '@/lib/api'
import { useClientUser } from '@/lib/auth'
import { FieldError, fieldClass } from '@/lib/form-ui'

type InvoiceGroup = {
  orderId: number
  orderNumber?: string
  clientName?: string
  paidSoFar: number
  totalAmount?: number
  orderAdjustmentTotal?: number
  orderAdjustedTotalAmount?: number
  orderAdjustmentCount?: number
  orderAmountPaid?: number
  orderAppliedCreditAmount?: number
  orderSettledAmount?: number
  invoiceStatus?: number
  paymentCount: number
  latestInvoiceId?: number
  latestInvoiceNumber?: string
  latestCreatedAt?: string
  latestPaymentMethod?: number
  latestReference?: string
}

export default function AdminInvoicesPage({ searchParams }: { searchParams: { orderId?: string; orderNumber?: string } }) {
  const user = useClientUser()
  const [rows, setRows] = useState<AdminInvoice[] | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [routeOrderId, setRouteOrderId] = useState(searchParams.orderId || '')
  const [orderFilter, setOrderFilter] = useState(searchParams.orderNumber || '')
  const [statusFilter, setStatusFilter] = useState('all')
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
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<number | null>(null)
  const amountRef = useRef<HTMLInputElement>(null)

  const load = async (filters?: { orderId?: number; orderNumber?: string }) => {
    setErr(null)
    try {
      const data = await apiAdminInvoices(filters)
      setRows(data)
    } catch (e: any) {
      setErr(e?.message || 'Failed to load invoices')
      setRows([])
    }
  }

  useEffect(() => {
    const orderNumber = orderFilter.trim()
    if (orderNumber) {
      load({ orderNumber })
      return
    }

    const idNum = routeOrderId ? Number(routeOrderId) : undefined
    load(Number.isFinite(idNum) ? { orderId: idNum } : undefined)
  }, [orderFilter, routeOrderId])

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

  useEffect(() => {
    if (!success) return
    const timer = setTimeout(() => setSuccess(null), 5000)
    return () => clearTimeout(timer)
  }, [success])

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
          orderAdjustmentTotal: inv.orderAdjustmentTotal ?? undefined,
          orderAdjustedTotalAmount: inv.orderAdjustedTotalAmount ?? undefined,
          orderAdjustmentCount: inv.orderAdjustmentCount ?? undefined,
          orderAmountPaid: inv.orderAmountPaid ?? undefined,
          orderAppliedCreditAmount: inv.orderAppliedCreditAmount ?? undefined,
          orderSettledAmount: inv.orderSettledAmount ?? undefined,
          invoiceStatus: inv.orderInvoiceStatus ?? inv.status,
          paymentCount: 1,
          latestInvoiceId: inv.id,
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
        orderAdjustmentTotal: existing.orderAdjustmentTotal ?? inv.orderAdjustmentTotal ?? undefined,
        orderAdjustedTotalAmount: existing.orderAdjustedTotalAmount ?? inv.orderAdjustedTotalAmount ?? undefined,
        orderAdjustmentCount: existing.orderAdjustmentCount ?? inv.orderAdjustmentCount ?? undefined,
        orderAmountPaid: existing.orderAmountPaid ?? inv.orderAmountPaid ?? undefined,
        orderAppliedCreditAmount: existing.orderAppliedCreditAmount ?? inv.orderAppliedCreditAmount ?? undefined,
        orderSettledAmount: existing.orderSettledAmount ?? inv.orderSettledAmount ?? undefined,
        invoiceStatus: inv.orderInvoiceStatus ?? existing.invoiceStatus ?? inv.status,
        paymentCount: existing.paymentCount + 1,
        latestInvoiceId: isLatest ? inv.id : existing.latestInvoiceId,
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

  const statusCounts = useMemo(() => {
    return groupedRows.reduce(
      (acc, group) => {
        const status = getStatusKey(group.invoiceStatus)
        acc[status] += 1
        return acc
      },
      { unpaid: 0, paid: 0, partiallyPaid: 0 }
    )
  }, [groupedRows])

  const filteredRows = useMemo(() => {
    if (statusFilter === 'all') return groupedRows
    return groupedRows.filter((group) => getStatusKey(group.invoiceStatus) === statusFilter)
  }, [groupedRows, statusFilter])

  if (user === undefined) {
    return <Shell title="Payments"><LoadingState /></Shell>
  }
  if (!user || user.role?.toLowerCase() !== 'admin') {
    return <Shell title="Payments"><div className="text-red-600">Not authorized.</div></Shell>
  }

  const openModal = async (group: InvoiceGroup) => {
    const balanceDue = getOutstandingBalance(group)
    setSelected(group)
    setForm({
      orderId: String(group.orderId),
      amount: balanceDue > 0 ? String(balanceDue) : '',
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

  const downloadPdf = async (group: InvoiceGroup) => {
    if (!group.latestInvoiceId) return
    setErr(null)
    setDownloadingInvoiceId(group.latestInvoiceId)
    try {
      const blob = await apiAdminDownloadInvoicePdf(group.latestInvoiceId)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `FreshMooz-Invoice-${group.latestInvoiceNumber || group.latestInvoiceId}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      setErr(e?.message || 'Failed to download invoice PDF')
    } finally {
      setDownloadingInvoiceId(null)
    }
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
      await load(orderFilter.trim() ? { orderNumber: orderFilter.trim() } : routeOrderId ? { orderId: Number(routeOrderId) } : undefined)
      setSuccess(`Payment recorded for order ${selected?.orderNumber || 'selected order'}.`)
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
      {success && <AdminAlert>{success}</AdminAlert>}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          className="w-full rounded-md border px-3 py-2 sm:w-52"
          placeholder="Search order number"
          value={orderFilter}
          onChange={(e) => {
            setRouteOrderId('')
            setOrderFilter(e.target.value)
          }}
        />
        <select
          className="w-full rounded-md border px-3 py-2 sm:w-52"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
          <option value="partiallyPaid">Partially Paid</option>
        </select>
        <button
          className="px-3 py-2 border rounded-md text-sm"
          onClick={() => {
            setRouteOrderId('')
            setOrderFilter('')
            setStatusFilter('all')
          }}
        >
          Clear filter
        </button>
      </div>
      <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
        <span>
          Showing <span className="font-semibold text-slate-900">{filteredRows.length}</span> of{' '}
          <span className="font-semibold text-slate-900">{groupedRows.length}</span> invoices
        </span>
        <span>Paid: <span className="font-semibold text-slate-900">{statusCounts.paid}</span></span>
        <span>Unpaid: <span className="font-semibold text-slate-900">{statusCounts.unpaid}</span></span>
        <span>Partially Paid: <span className="font-semibold text-slate-900">{statusCounts.partiallyPaid}</span></span>
      </div>
      {err && <div className="text-red-600 mb-3">{err}</div>}
      {rows === null ? (
        <LoadingState />
      ) : filteredRows.length === 0 ? (
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
              {filteredRows.map((group) => {
                const statusValue = group.invoiceStatus ?? 1
                const cashPaidDisplay = group.orderAmountPaid ?? group.paidSoFar
                const creditAppliedDisplay = group.orderAppliedCreditAmount ?? 0
                const settledDisplay = group.orderSettledAmount ?? (cashPaidDisplay + creditAppliedDisplay)
                const totalDisplay = group.orderAdjustedTotalAmount ?? group.totalAmount
                const balance = totalDisplay != null ? totalDisplay - settledDisplay : null
                const hasOutstandingBalance = balance != null && balance > 0
                return (
                  <tr key={group.orderId} className={`border-t transition-colors ${getInvoiceRowClass(statusValue, balance)}`}>
                    <td className="px-3 py-2">
                      <div className="font-semibold">{group.latestInvoiceNumber || '-'}</div>
                      <div className="text-xs text-slate-500">
                        {group.latestCreatedAt ? new Date(group.latestCreatedAt).toLocaleString() : ''}
                      </div>
                      <div className="text-xs text-slate-500">{group.paymentCount} payment{group.paymentCount === 1 ? '' : 's'}</div>
                    </td>
                    <td className="px-3 py-2">
                      <div>Order {group.orderNumber || '-'}</div>
                      <div className="text-xs text-slate-500">{group.clientName || '-'}</div>
                    </td>
                    <td className="px-3 py-2 text-right font-semibold">
                      {formatInr(settledDisplay)}
                      {totalDisplay != null && (
                        <>
                          <div className="text-xs text-slate-500">Cash {formatInr(cashPaidDisplay)}</div>
                          {creditAppliedDisplay > 0 && <div className="text-xs text-slate-500">Credit {formatInr(creditAppliedDisplay)}</div>}
                          <div className="text-xs text-slate-500">of {formatInr(totalDisplay)}</div>
                        </>
                      )}
                      {balance != null && <div className={getBalanceClass(balance)}>Balance {formatInr(balance)}</div>}
                      {(group.orderAdjustmentCount ?? 0) > 0 && (
                        <div className="text-xs text-slate-500">{group.orderAdjustmentCount} adjustment{group.orderAdjustmentCount === 1 ? '' : 's'}</div>
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
                      <div className="flex flex-wrap items-center gap-2">
                        {hasOutstandingBalance && (
                          <button
                            className="inline-flex h-8 items-center justify-center rounded-md bg-[#6FAF3D] px-3 text-xs font-medium text-white transition-colors hover:bg-[#5F9B34]"
                            onClick={() => openModal(group)}
                          >
                            Record Payment
                          </button>
                        )}
                        {group.latestInvoiceId && (
                          <button
                            className="inline-flex h-8 items-center justify-center rounded-md bg-[#2B7CBF] px-3 text-xs font-medium text-white transition-colors hover:bg-[#236aa3] disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={downloadingInvoiceId === group.latestInvoiceId}
                            onClick={() => downloadPdf(group)}
                          >
                            {downloadingInvoiceId === group.latestInvoiceId ? 'Downloading...' : 'Download PDF'}
                          </button>
                        )}
                      </div>
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
          className="fixed inset-0 z-50 overflow-y-auto bg-black/40 px-4 py-6"
          onMouseDown={closeModal}
        >
          <div
            className="mx-auto w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Record payment</h2>
                <p className="text-sm text-slate-500">Order {selected.orderNumber || '-'} · {selected.clientName || '-'}</p>
              </div>
              <button aria-label="Close" className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700" onClick={closeModal}>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M6 6l12 12" />
                  <path d="M18 6L6 18" />
                </svg>
              </button>
            </div>
            <div className="mb-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3">
              <div className="text-xs font-medium uppercase tracking-wide text-rose-700">Balance due</div>
              <div className="mt-1 text-2xl font-bold text-rose-800">{formatInr(getOutstandingBalance(selected))}</div>
            </div>

            <form onSubmit={submit} noValidate className="space-y-3">
              <div>
                <label className="block text-sm mb-1">Amount</label>
                <input
                  ref={amountRef}
                  type="number"
                  step="0.01"
                  className={fieldClass(!!amountError)}
                  value={form.amount}
                  onChange={(e) => {
                    const value = e.target.value
                    setForm({ ...form, amount: value })
                    setAmountError(Number(value) > 0 ? null : amountError)
                  }}
                />
                <FieldError error={amountError} />
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
              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:items-center sm:justify-end">
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

function getOutstandingBalance(group: InvoiceGroup) {
  const cashPaid = group.orderAmountPaid ?? group.paidSoFar
  const creditApplied = group.orderAppliedCreditAmount ?? 0
  const settled = group.orderSettledAmount ?? (cashPaid + creditApplied)
  const total = group.orderAdjustedTotalAmount ?? group.totalAmount

  return total != null ? Math.max(total - settled, 0) : 0
}

function getInvoiceRowClass(status?: number, balance?: number | null) {
  if (balance != null && balance <= 0) return 'bg-green-50/60 hover:bg-green-50'
  if (getStatusKey(status) === 'partiallyPaid') return 'bg-amber-50/60 hover:bg-amber-50'
  if (getStatusKey(status) === 'unpaid' || (balance != null && balance > 0)) return 'bg-rose-50/60 hover:bg-rose-50'
  return 'bg-white hover:bg-slate-50'
}

function getBalanceClass(balance: number) {
  if (balance > 0) {
    return 'mt-1 inline-flex rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-100'
  }

  return 'text-xs text-slate-500'
}

function renderStatus(status?: number) {
  switch (status) {
    case 2:
      return 'Paid'
    case 3:
      return 'Partially Paid'
    default:
      return 'Unpaid'
  }
}

function getStatusKey(status?: number): 'paid' | 'unpaid' | 'partiallyPaid' {
  switch (status) {
    case 2:
      return 'paid'
    case 3:
      return 'partiallyPaid'
    default:
      return 'unpaid'
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

