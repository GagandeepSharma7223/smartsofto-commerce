"use client"
import LoadingState from '@/components/LoadingState'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { apiAdminOrders, apiAdminUpdateOrderStatus, type AdminOrder } from '@/lib/api'
import { useClientUser, getToken } from '@/lib/auth'

const statusOptions = ['All', 'Pending', 'Delivered', 'Cancelled'] as const
const editableStatuses = ['Pending', 'Delivered', 'Cancelled'] as const

type EditableStatus = (typeof editableStatuses)[number]

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<Shell title="Orders"><LoadingState /></Shell>}>
      <AdminOrdersPageContent />
    </Suspense>
  )
}

function AdminOrdersPageContent() {
  const user = useClientUser()
  const [rows, setRows] = useState<AdminOrder[] | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [status, setStatus] = useState<(typeof statusOptions)[number]>('All')
  const sp = useSearchParams()
  const [toast, setToast] = useState<string | null>(null)
  const [toastLink, setToastLink] = useState<string | null>(null)
  const [statusModalOrderId, setStatusModalOrderId] = useState<number | null>(null)
  const [nextStatus, setNextStatus] = useState<EditableStatus>('Pending')
  const [statusSaving, setStatusSaving] = useState(false)
  const token = getToken()

  useEffect(() => {
    const created = sp.get('created')
    if (created) {
      try {
        const raw = sessionStorage.getItem('admin_order_created')
        if (raw) {
          const data = JSON.parse(raw)
          const orderId = data.orderId || data.id
          const invoiceId = data.invoiceId || data.InvoiceId
          setToast(`Order #${orderId} created`)
          setToastLink(invoiceId ? `/invoices?orderId=${orderId}` : '/invoices')
          sessionStorage.removeItem('admin_order_created')
        }
      } catch {}
    }

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
  }, [status, sp])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => {
      setToast(null)
      setToastLink(null)
    }, 5000)
    return () => clearTimeout(timer)
  }, [toast])

  const filtered = useMemo(() => rows || [], [rows])
  const modalOrder = useMemo(
    () => (rows || []).find((o) => o.id === statusModalOrderId) || null,
    [rows, statusModalOrderId]
  )

  const openStatusModal = (order: AdminOrder) => {
    const orderStatus = editableStatuses.includes(order.status as EditableStatus)
      ? (order.status as EditableStatus)
      : 'Pending'
    setNextStatus(orderStatus)
    setStatusModalOrderId(order.id)
  }

  const closeStatusModal = () => {
    if (statusSaving) return
    setStatusModalOrderId(null)
  }

  const saveStatus = async () => {
    if (!modalOrder) return
    try {
      setStatusSaving(true)
      await apiAdminUpdateOrderStatus(modalOrder.id, nextStatus, token || undefined)
      setRows((prev) =>
        prev ? prev.map((r) => (r.id === modalOrder.id ? { ...r, status: nextStatus } : r)) : prev
      )
      setToast(`Order ${modalOrder.orderNumber || `#${modalOrder.id}`} status updated to ${nextStatus}`)
      setToastLink(null)
      setStatusModalOrderId(null)
    } catch (e: any) {
      setErr(e?.message || 'Failed to update order status')
    } finally {
      setStatusSaving(false)
    }
  }

  if (user === undefined) {
    return <Shell title="Admin - Orders"><LoadingState /></Shell>
  }
  if (!user || user.role?.toLowerCase() !== 'admin') {
    return <Shell title="Admin - Orders"><div className="text-red-600">Not authorized.</div></Shell>
  }

  return (
    <Shell title="Orders">
      {toast && (
        <div className="fixed top-4 right-4 z-50 max-w-sm rounded-xl bg-[#6FAF3D] text-white px-4 py-2 shadow-lg">
          <div className="font-medium">{toast}</div>
          {toastLink && <Link href={toastLink} className="text-white underline text-sm">View invoice</Link>}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-slate-600">{filtered.length} orders</div>
        <div className="flex items-center gap-3">
          <Link href="/orders/new" className="bg-[#6FAF3D] hover:bg-[#5F9B34] text-white px-3 py-2 rounded-md text-sm">New Order</Link>
          <select
            className="border rounded-md px-3 py-2"
            value={status}
            onChange={(e) => setStatus(e.target.value as (typeof statusOptions)[number])}
          >
            {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {err && <div className="text-red-600 mb-3">{err}</div>}

      {rows === null ? (
        <LoadingState />
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
                <th className="text-left px-3 py-2">Order Status</th>
                <th className="text-left px-3 py-2">Invoice</th>
                <th className="text-left px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const invoiceUi = getInvoiceUi(o)
                return (
                  <tr key={o.id} className="border-t">
                    <td className="px-3 py-2">
                      <div className="font-semibold">{o.orderNumber || `#${o.id}`}</div>
                      <div className="text-xs text-slate-500">{new Date(o.createdAt || '').toLocaleString()}</div>
                    </td>
                    <td className="px-3 py-2">
                      <div>{o.clientName || '-'}</div>
                    </td>
                    <td className="px-3 py-2">
                      <div>{o.productName || '-'}</div>
                      <div className="text-xs text-slate-500">Qty {o.quantity}</div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="font-semibold">{formatInr(o.totalAmount || 0)}</div>
                      <div className="text-xs text-slate-500">Paid {formatInr(o.amountPaid || 0)}</div>
                    </td>
                    <td className="px-3 py-2">
                      <Badge tone={getOrderStatusTone(o.status)}>{o.status}</Badge>
                    </td>
                    <td className="px-3 py-2">
                      <Badge tone={invoiceUi.tone}>{invoiceUi.label}</Badge>
                      <div className="text-xs text-slate-500">Due {formatInr(invoiceUi.due)}</div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/invoices?orderId=${o.id}`}
                          title="View invoices"
                          aria-label={`View invoices for ${o.orderNumber || `order ${o.id}`}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#cfe8f6] text-[#2B7CBF] hover:bg-[#e8f6fd] transition-colors"
                        >
                          <InvoiceIcon />
                        </Link>
                        <button
                          type="button"
                          onClick={() => openStatusModal(o)}
                          title="Update order status"
                          aria-label={`Update status for ${o.orderNumber || `order ${o.id}`}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          <StatusIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {modalOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 p-4" onClick={closeStatusModal}>
          <div className="mx-auto mt-24 max-w-md rounded-xl border bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Update Order Status</h3>
            <p className="mt-1 text-sm text-slate-600">{modalOrder.orderNumber || `Order #${modalOrder.id}`}</p>

            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                className="w-full border rounded-md px-3 py-2"
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value as EditableStatus)}
                disabled={statusSaving}
              >
                {editableStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeStatusModal}
                disabled={statusSaving}
                className="px-3 py-2 rounded-md border text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveStatus}
                disabled={statusSaving}
                className="px-3 py-2 rounded-md bg-[#6FAF3D] hover:bg-[#5F9B34] text-white text-sm disabled:opacity-60"
              >
                {statusSaving ? 'Saving...' : 'Save status'}
              </button>
            </div>
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

function Badge({ children, tone = 'gray' }: { children: React.ReactNode; tone?: 'gray' | 'green' | 'amber' | 'red' }) {
  const colors =
    tone === 'green'
      ? 'bg-green-100 text-green-800'
      : tone === 'red'
      ? 'bg-red-100 text-red-800'
      : tone === 'amber'
      ? 'bg-amber-100 text-amber-800'
      : 'bg-slate-100 text-slate-700'
  return <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${colors}`}>{children}</span>
}

function formatInr(value: number) {
  return 'INR ' + Number(value || 0).toLocaleString('en-IN')
}

function normalizeInvoiceLabel(raw: string | undefined) {
  const normalized = String(raw || '').trim().toLowerCase()
  if (normalized === 'paid') return 'Paid'
  if (normalized === 'partiallypaid' || normalized === 'partially_paid' || normalized === 'partially paid') return 'Partially Paid'
  if (normalized === 'unpaid') return 'Unpaid'
  return 'Unpaid'
}

function getOrderStatusTone(raw: string | undefined): 'gray' | 'green' | 'red' {
  const status = String(raw || '').trim().toLowerCase()
  if (status === 'delivered') return 'green'
  if (status === 'cancelled' || status === 'canceled') return 'red'
  return 'gray'
}

function getInvoiceUi(order: AdminOrder): { label: string; tone: 'gray' | 'green' | 'amber'; due: number } {
  const total = Number(order.totalAmount || 0)
  const paid = Number(order.amountPaid || 0)
  const due = Math.max(total - paid, 0)

  if (total > 0) {
    if (due <= 0) return { label: 'Paid', tone: 'green', due }
    if (paid > 0) return { label: 'Partially Paid', tone: 'amber', due }
    return { label: 'Unpaid', tone: 'gray', due }
  }

  const label = normalizeInvoiceLabel(order.invoiceStatus)
  const tone = label === 'Paid' ? 'green' : label === 'Partially Paid' ? 'amber' : 'gray'
  return { label, tone, due }
}

function InvoiceIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M7 3h8l4 4v14H7z" />
      <path d="M15 3v5h5" />
      <path d="M10 13h6" />
      <path d="M10 17h6" />
    </svg>
  )
}

function StatusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </svg>
  )
}
