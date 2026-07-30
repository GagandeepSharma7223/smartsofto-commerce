"use client"

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import LoadingState from '@/components/LoadingState'
import { useClientUser, getToken } from '@/lib/auth'
import { apiAdminCreateOrderAdjustment, apiAdminOrderDetails, type AdminOrderDetail } from '@/lib/api'
import { showError, showSuccess } from '@/lib/alert'
import { FieldError, fieldClass } from '@/lib/form-ui'

const adjustmentTypes = [
  { value: '1', label: 'Discount' },
  { value: '2', label: 'Credit Note' },
  { value: '3', label: 'Adjustment' },
] as const

type AdjustmentForm = {
  amount: string
  type: string
  reason: string
  note: string
}

type AdjustmentErrors = {
  amount?: string
  reason?: string
}

const emptyAdjustmentForm: AdjustmentForm = {
  amount: '',
  type: '1',
  reason: '',
  note: '',
}

export default function AdminOrderDetailsPage({ params }: { params: { id: string } }) {
  const user = useClientUser()
  const [order, setOrder] = useState<AdminOrderDetail | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [adjustmentOpen, setAdjustmentOpen] = useState(false)
  const [adjustmentSaving, setAdjustmentSaving] = useState(false)
  const [adjustmentForm, setAdjustmentForm] = useState<AdjustmentForm>(emptyAdjustmentForm)
  const [adjustmentErrors, setAdjustmentErrors] = useState<AdjustmentErrors>({})

  const loadOrder = useCallback(async () => {
    try {
      setErr(null)
      const data = await apiAdminOrderDetails(Number(params.id), getToken() || undefined)
      setOrder(data)
    } catch (e: any) {
      setErr(e?.message || 'Failed to load order details')
      setOrder(null)
    }
  }, [params.id])

  useEffect(() => {
    let active = true
    async function load() {
      try {
        setErr(null)
        const data = await apiAdminOrderDetails(Number(params.id), getToken() || undefined)
        if (active) setOrder(data)
      } catch (e: any) {
        if (active) {
          setErr(e?.message || 'Failed to load order details')
          setOrder(null)
        }
      }
    }
    if (user && user.role?.toLowerCase() === 'admin') {
      load()
    }
    return () => {
      active = false
    }
  }, [params.id, user])

  if (user === undefined) {
    return <Shell><LoadingState /></Shell>
  }

  if (!user || user.role?.toLowerCase() !== 'admin') {
    return <Shell><div className="text-red-600">Not authorized.</div></Shell>
  }

  if (err) {
    return <Shell><div className="text-red-600">{err}</div></Shell>
  }

  if (!order) {
    return <Shell><LoadingState /></Shell>
  }

  const syntheticOrderPayment = !order.payments.length && order.amountPaid > 0
    ? [{
        invoiceId: order.invoiceId || 0,
        invoiceNumber: order.invoiceNumber || '',
        amount: order.amountPaid,
        paymentMethod: order.paymentMethod,
        status: order.invoiceStatus,
        referenceNumber: '',
        note: 'Captured at order creation.',
        invoiceDate: order.orderDate,
        createdAt: order.createdAt,
      }]
    : []
  const paymentList = order.payments.length > 0 ? order.payments : syntheticOrderPayment
  const hasPayments = paymentList.length > 0
  const settledWithoutPayments = !hasPayments && order.settledAmount > 0
  const itemCount = order.items.length
  const totalQty = order.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)


  const openAdjustmentModal = () => {
    if (order.status !== 'Delivered') return
    setAdjustmentForm(emptyAdjustmentForm)
    setAdjustmentErrors({})
    setAdjustmentOpen(true)
  }

  const closeAdjustmentModal = () => {
    if (adjustmentSaving) return
    setAdjustmentOpen(false)
    setAdjustmentErrors({})
  }

  const saveAdjustment = async () => {
    const amount = Number(adjustmentForm.amount)
    const nextErrors: AdjustmentErrors = {}
    if (!Number.isFinite(amount) || amount <= 0) {
      nextErrors.amount = 'Amount must be greater than 0.'
    }
    if (!adjustmentForm.reason.trim()) {
      nextErrors.reason = 'Reason is required.'
    }
    setAdjustmentErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    try {
      setAdjustmentSaving(true)
      await apiAdminCreateOrderAdjustment(
        order.id,
        {
          amount,
          type: Number(adjustmentForm.type),
          reason: adjustmentForm.reason.trim(),
          note: adjustmentForm.note.trim() || undefined,
        },
        getToken() || undefined
      )
      await loadOrder()
      setAdjustmentOpen(false)
      setAdjustmentForm(emptyAdjustmentForm)
      setAdjustmentErrors({})
      await showSuccess('Adjustment recorded successfully')
    } catch (e: any) {
      await showError(e?.message || 'Failed to create adjustment', 'Adjustment failed')
    } finally {
      setAdjustmentSaving(false)
    }
  }

  return (
    <Shell>
      <div className="space-y-5">
        <div className="rounded-xl border bg-white px-5 py-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="text-sm font-medium uppercase tracking-wide text-slate-500">Order</div>
              <div className="mt-1 text-3xl font-bold tracking-tight text-slate-950">{order.orderNumber || `#${order.id}`}</div>
              <div className="mt-2 flex flex-col gap-1 text-sm text-slate-600 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                <span><strong className="text-slate-900">Client:</strong> {order.clientName || '-'}</span>
                <span><strong className="text-slate-900">Business date:</strong> {formatDate(order.orderDate)}</span>
                <span><strong className="text-slate-900">Created:</strong> {formatDateTime(order.createdAt)}</span>
              </div>
            </div>

            <div className="flex flex-col items-stretch gap-3 lg:items-end">
              <div className="flex flex-wrap gap-2 lg:justify-end">
                <Badge tone={getOrderTone(order.status)}>{order.status}</Badge>
                <Badge tone={getInvoiceTone(order.invoiceStatus)}>{order.invoiceStatus}</Badge>
              </div>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                <Link href={`/invoices?orderId=${order.id}`} className="inline-flex items-center justify-center rounded-lg border border-[#cfe8f6] px-3 py-2 text-sm font-medium text-[#2B7CBF] hover:bg-[#e8f6fd]">
                  Add Payment
                </Link>
                <Link href={`/orders/new?duplicate=${order.id}`} className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Edit Order
                </Link>
                <button type="button" className="inline-flex items-center justify-center rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50">
                  Cancel Order
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <SummaryCard title="Order Summary">
            <StatRow label="Items" value={`${itemCount} lines`} />
            <StatRow label="Total quantity" value={formatQty(totalQty)} />
            <StatRow label="Original total" value={formatInr(order.totalAmount)} strong />
            <StatRow label="Discount / adjustments" value={formatInr(order.adjustmentTotal)} />
            <StatRow label="Adjusted total" value={formatInr(order.adjustedTotalAmount)} strong />
          </SummaryCard>

          <SummaryCard title="Payment Summary">
            <StatRow label="Cash paid" value={formatInr(order.amountPaid)} />
            <StatRow label="Credit applied" value={formatInr(order.appliedCreditAmount)} />
            <StatRow label="Settled" value={formatInr(order.settledAmount)} strong />
            <StatRow label="Balance" value={formatInr(order.balanceDue)} strong />
          </SummaryCard>

          <SummaryCard title="Client Summary">
            <StatRow label="Name" value={order.clientName || '-'} />
            <StatRow label="Phone" value={order.clientPhone || '-'} />
            <StatRow label="Email" value={order.clientEmail || '-'} />
            <StatRow label="Notes" value={order.notes || '-'} multiline />
          </SummaryCard>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.7fr,1fr]">
          <Section title="Items">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">Product</th>
                    <th className="px-3 py-2 text-left font-semibold">SKU</th>
                    <th className="px-3 py-2 text-right font-semibold">Qty</th>
                    <th className="px-3 py-2 text-right font-semibold">Unit Price</th>
                    <th className="px-3 py-2 text-right font-semibold">Discount</th>
                    <th className="px-3 py-2 text-right font-semibold">Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100 align-top">
                      <td className="px-3 py-3 font-medium text-slate-900">{item.productName || `Product #${item.productId}`}</td>
                      <td className="px-3 py-3 text-slate-500">{item.sku || '-'}</td>
                      <td className="px-3 py-3 text-right font-medium tabular-nums">{formatQty(item.quantity)}</td>
                      <td className="px-3 py-3 text-right font-medium tabular-nums">{formatInr(item.unitPrice)}</td>
                      <td className="px-3 py-3 text-right text-slate-600 tabular-nums">{formatInr(item.discountAmount)}</td>
                      <td className="px-3 py-3 text-right font-semibold text-slate-950 tabular-nums">{formatInr(item.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <Section title="Shipping Address" compact>
                <AddressBlock address={order.shippingAddress} />
              </Section>
              <Section title="Billing Address" compact>
                <AddressBlock address={order.billingAddress} />
              </Section>
            </div>

            <Section title="Invoice Summary" compact>
              <StatRow label="Invoice" value={order.invoiceNumber || '-'} />
              <StatRow label="Invoice date" value={formatDate(order.invoiceDate)} />
              <StatRow label="Invoice total" value={formatInr(order.adjustedTotalAmount)} strong />
              <StatRow label="Paid amount" value={formatInr(order.settledAmount)} />
              <StatRow label="Balance" value={formatInr(order.balanceDue)} strong />
            </Section>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Section title="Payments">
            {hasPayments ? (
              <div className="space-y-3">
                {paymentList.map((payment) => (
                  <div key={payment.invoiceId} className="rounded-lg border border-slate-200 px-3 py-3 text-sm">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div className="font-semibold text-slate-900">{formatInr(payment.amount)} via {renderPayment(payment.paymentMethod)}</div>
                      <div className="text-xs text-slate-500">{formatDateTime(payment.createdAt)}</div>
                    </div>
                    <div className="mt-1 text-slate-600">Invoice {payment.invoiceNumber || payment.invoiceId}</div>
                    <div className="mt-1 text-slate-500">Business date {formatDate(payment.invoiceDate)}</div>
                    {payment.referenceNumber && <div className="mt-1 text-slate-500">Reference {payment.referenceNumber}</div>}
                    {payment.note && <div className="mt-1 text-slate-500">{payment.note}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                <div>No payment records found for this order.</div>
                {settledWithoutPayments && (
                  <div className="mt-2 text-slate-500">Settled via credit or cash captured at order time.</div>
                )}
                <div className="mt-3">
                  <Link href={`/invoices?orderId=${order.id}`} className="inline-flex rounded-lg border border-[#cfe8f6] px-3 py-2 text-sm font-medium text-[#2B7CBF] hover:bg-[#e8f6fd]">
                    Add Payment
                  </Link>
                </div>
              </div>
            )}
          </Section>

          <Section title="Adjustments">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="text-sm text-slate-500">Discounts, credit notes, and manual invoice/order adjustments.</div>
              <button type="button" onClick={openAdjustmentModal} disabled={order.status !== 'Delivered'} className="inline-flex rounded-lg border border-amber-300 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50">
                Add Adjustment
              </button>
            </div>
            {order.adjustments.length === 0 ? (
              <div className="text-sm text-slate-500">No adjustments recorded.</div>
            ) : (
              <div className="space-y-3">
                {order.adjustments.map((adjustment) => (
                  <div key={adjustment.id} className="rounded-lg border border-slate-200 px-3 py-3 text-sm">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div className="font-semibold text-slate-900">{adjustment.type} {formatInr(adjustment.amount)}</div>
                      <div className="text-xs text-slate-500">{formatDateTime(adjustment.createdUtc)}</div>
                    </div>
                    <div className="mt-1 text-slate-600">{adjustment.reason}</div>
                    {adjustment.note && <div className="mt-1 text-slate-500">{adjustment.note}</div>}
                    {adjustment.invoiceNumber && <div className="mt-1 text-slate-500">Invoice {adjustment.invoiceNumber}</div>}
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>


        {adjustmentOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 px-4 py-6" onClick={closeAdjustmentModal}>
            <div className="mx-auto mt-10 w-full max-w-xl rounded-xl border bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold text-slate-950">Add adjustment</div>
                  <p className="mt-1 text-sm text-slate-600">{order.orderNumber || `Order #${order.id}`}</p>
                </div>
                <button type="button" aria-label="Close" onClick={closeAdjustmentModal} className="text-slate-500 hover:text-slate-700 text-2xl leading-none">&times;</button>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
                  <select
                    className="w-full rounded-md border px-3 py-2"
                    value={adjustmentForm.type}
                    onChange={(e) => setAdjustmentForm((prev) => ({ ...prev, type: e.target.value }))}
                    disabled={adjustmentSaving}
                  >
                    {adjustmentTypes.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    className={fieldClass(!!adjustmentErrors.amount)}
                    value={adjustmentForm.amount}
                    onChange={(e) => setAdjustmentForm((prev) => ({ ...prev, amount: e.target.value }))}
                    disabled={adjustmentSaving}
                  />
                  <FieldError error={adjustmentErrors.amount} />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">Reason</label>
                  <input
                    className={fieldClass(!!adjustmentErrors.reason)}
                    value={adjustmentForm.reason}
                    onChange={(e) => setAdjustmentForm((prev) => ({ ...prev, reason: e.target.value }))}
                    disabled={adjustmentSaving}
                  />
                  <FieldError error={adjustmentErrors.reason} />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">Note</label>
                  <textarea
                    rows={3}
                    className="w-full rounded-md border px-3 py-2"
                    value={adjustmentForm.note}
                    onChange={(e) => setAdjustmentForm((prev) => ({ ...prev, note: e.target.value }))}
                    disabled={adjustmentSaving}
                  />
                </div>
              </div>

              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button type="button" onClick={closeAdjustmentModal} disabled={adjustmentSaving} className="rounded-md border px-4 py-2 text-sm text-slate-700">Cancel</button>
                <button type="button" onClick={saveAdjustment} disabled={adjustmentSaving} className="rounded-md bg-[#6FAF3D] px-4 py-2 text-sm text-white hover:bg-[#5F9B34] disabled:opacity-60">{adjustmentSaving ? 'Saving...' : 'Save adjustment'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="landing">
      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm text-slate-500">Admin order details</div>
          </div>
          <Link href="/orders" className="text-[#2B7CBF]">Back to orders</Link>
        </div>
        {children}
      </main>
    </div>
  )
}

function Section({ title, children, compact = false }: { title: string; children: React.ReactNode; compact?: boolean }) {
  return (
    <section className={`rounded-xl border bg-white shadow-sm ${compact ? 'p-4' : 'p-5'}`}>
      <div className={`font-semibold leading-tight text-slate-950 ${compact ? 'mb-3 text-base' : 'mb-4 text-lg'}`}>{title}</div>
      {children}
    </section>
  )
}

function SummaryCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="mb-3 text-sm font-semibold text-slate-950">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function StatRow({ label, value, strong = false, multiline = false }: { label: string; value: React.ReactNode; strong?: boolean; multiline?: boolean }) {
  return (
    <div className={`flex gap-3 ${multiline ? 'flex-col items-start' : 'items-start justify-between'}`}>
      <span className="text-sm text-slate-500">{label}</span>
      <div className={`text-sm tabular-nums ${strong ? 'font-semibold text-slate-950' : 'font-medium text-slate-900'} ${multiline ? 'w-full text-left' : 'text-right'}`}>{value}</div>
    </div>
  )
}

function AddressBlock({ address }: { address?: any | null }) {
  if (!address) return <div className="text-sm text-slate-500">Not available.</div>
  return (
    <div className="space-y-1 text-sm text-slate-700">
      {address.name && <div className="font-medium text-slate-900">{address.name}</div>}
      {address.phone && <div>{address.phone}</div>}
      {address.addressLine1 || address.line1 ? <div>{address.addressLine1 || address.line1}</div> : null}
      {address.addressLine2 || address.line2 ? <div>{address.addressLine2 || address.line2}</div> : null}
      <div>{[address.city, address.state].filter(Boolean).join(', ') || [address.City, address.State].filter(Boolean).join(', ')}</div>
      <div>{address.postalCode || address.PostalCode || '-'}</div>
      {(address.country || address.Country) && <div>{address.country || address.Country}</div>}
    </div>
  )
}

function Badge({ children, tone = 'gray' }: { children: React.ReactNode; tone?: 'gray' | 'green' | 'amber' | 'red' }) {
  const colors = tone === 'green' ? 'bg-green-100 text-green-800' : tone === 'red' ? 'bg-red-100 text-red-800' : tone === 'amber' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${colors}`}>{children}</span>
}

function getOrderTone(status?: string) {
  const value = String(status || '').toLowerCase()
  if (value === 'delivered') return 'green'
  if (value === 'cancelled' || value === 'canceled') return 'red'
  return 'gray'
}

function getInvoiceTone(status?: string) {
  const value = String(status || '').toLowerCase()
  if (value === 'paid') return 'green'
  if (value === 'partially paid' || value === 'partiallypaid') return 'amber'
  return 'gray'
}

function renderPayment(method?: string | number) {
  const value = typeof method === 'string' ? Number(method) : method
  switch (value) {
    case 2:
      return 'UPI'
    case 3:
      return 'Cheque'
    default:
      return 'Cash'
  }
}

function formatInr(value: number) {
  return 'INR ' + Number(value || 0).toLocaleString('en-IN')
}

function formatDate(value?: string) {
  if (!value) return '-'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? '-' : parsed.toLocaleDateString()
}

function formatDateTime(value?: string) {
  if (!value) return '-'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? '-' : parsed.toLocaleString()
}

function formatQty(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(3).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1')
}
