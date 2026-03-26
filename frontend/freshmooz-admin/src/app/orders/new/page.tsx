"use client"
import LoadingState from '@/components/LoadingState'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  apiAdminClients,
  apiAdminProducts,
  apiAdminPriceOrder,
  apiAdminCreateOrder,
  apiGetInvoicesForOrder,
  apiAdminClientAddresses,
  apiAdminCreateClientAddress,
  type AdminClient,
  type AdminProduct,
  type AdminPriceResponse,
  type ClientAddress,
  type ClientAddressInput
} from '@/lib/api'
import { getToken, useClientUser } from '@/lib/auth'
import { FieldError, fieldClass, isBlank } from '@/lib/form-ui'

type OrderLine = {
  productId: number
  name: string
  price: number
  quantity: number
  unitPrice: number
  discountAmount: number
}

type OrderFormErrors = {
  clientId?: string
  selectedAddressId?: string
  orderDate?: string
  notes?: string
  items?: string
  paymentMethod?: string
  paymentAmount?: string
  paymentDate?: string
}

const ORDER_STATUS_OPTIONS = [
  { value: '1', label: 'Placed' },
  { value: '2', label: 'Delivered' }
]

const PAYMENT_METHOD_OPTIONS = [
  { value: '1', label: 'Cash' },
  { value: '2', label: 'UPI' },
  { value: '3', label: 'Cheque' }
]

type AddressErrors = {
  addressLine1?: string
  city?: string
  state?: string
  postalCode?: string
}

type AddressForm = {
  label: string
  name: string
  phone: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  postalCode: string
  country: string
  isDefault: boolean
}

const emptyAddress: AddressForm = {
  label: 'Shipping',
  name: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: 'Gurugram',
  state: 'Haryana',
  postalCode: '',
  country: 'India',
  isDefault: true
}

export default function AdminNewOrderPage() {
  const user = useClientUser()
  const token = getToken() || undefined
  const router = useRouter()

  const [clients, setClients] = useState<AdminClient[]>([])
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [clientId, setClientId] = useState<number | ''>('')
  const [clientQuery, setClientQuery] = useState('')
  const [clientOpen, setClientOpen] = useState(false)
  const [productQuery, setProductQuery] = useState('')
  const [productOpen, setProductOpen] = useState(false)
  const [lines, setLines] = useState<OrderLine[]>([])
  const [notes, setNotes] = useState('')
  const [pricing, setPricing] = useState<AdminPriceResponse | null>(null)
  const [pricingLoading, setPricingLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [orderDate, setOrderDate] = useState(() => todayInput())
  const [initialOrderStatus, setInitialOrderStatus] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('1')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState(() => todayInput())

  const [addresses, setAddresses] = useState<ClientAddress[]>([])
  const [addressLoading, setAddressLoading] = useState(false)
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [addressForm, setAddressForm] = useState<AddressForm>({ ...emptyAddress })
  const [addressError, setAddressError] = useState<string | null>(null)
  const [addressSaving, setAddressSaving] = useState(false)
  const [formErrors, setFormErrors] = useState<OrderFormErrors>({})
  const [addressErrors, setAddressErrors] = useState<AddressErrors>({})

  useEffect(() => {
    Promise.all([apiAdminClients(token), apiAdminProducts(token)])
      .then(([c, p]) => {
        setClients(Array.isArray(c) ? c : [])
        setProducts(Array.isArray(p) ? p : [])
      })
      .catch((e: any) => setError(e?.message || 'Failed to load data'))
  }, [token])

  const loadAddresses = useCallback(async (clientIdValue: number) => {
    setAddressLoading(true)
    try {
      const list = await apiAdminClientAddresses(clientIdValue, token)
      const normalized = Array.isArray(list) ? list : []
      setAddresses(normalized)
      const preferred = normalized.find(a => a.isDefault) || normalized[0]
      setSelectedAddressId(preferred ? String(preferred.id) : '')
    } catch (e: any) {
      setAddresses([])
      setSelectedAddressId('')
      setAddressError(e?.message || 'Failed to load addresses')
    } finally {
      setAddressLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (clientId) {
      loadAddresses(Number(clientId))
    } else {
      setAddresses([])
      setSelectedAddressId('')
    }
  }, [clientId, loadAddresses])

  const recalcPricing = useCallback(async () => {
    if (!lines.length) {
      setPricing(null)
      return
    }
    setPricingLoading(true)
    try {
      const priceLines = lines.map(l => ({
        productId: l.productId,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        discountAmount: l.discountAmount
      }))
      const res = await apiAdminPriceOrder(priceLines, token)
      setPricing(res)
    } catch {
      setPricing(null)
    } finally {
      setPricingLoading(false)
    }
  }, [lines, token])

  useEffect(() => {
    if (!lines.length) {
      setPricing(null)
      return
    }
    const handle = setTimeout(() => {
      recalcPricing().catch(() => null)
    }, 350)
    return () => clearTimeout(handle)
  }, [lines, recalcPricing])

  const isBackdatedOrder = orderDate < todayInput()
  const backdatedOrderDays = isBackdatedOrder ? daysBetween(orderDate, todayInput()) : 0
  const orderDateTooOld = isBackdatedOrder && backdatedOrderDays > 7
  const paymentAmountValue = Number(paymentAmount || 0)
  const hasInitialPayment = Number.isFinite(paymentAmountValue) && paymentAmountValue > 0
  const isBackdatedPayment = paymentDate < todayInput()
  const paymentDateTooOld = isBackdatedPayment && daysBetween(paymentDate, todayInput()) > 7
  const paymentDateBeforeOrder = Boolean(paymentDate && orderDate && paymentDate < orderDate)

  const filteredClients = useMemo(() => {
    const q = clientQuery.trim().toLowerCase()
    if (!q) return clients.slice(0, 8)
    return clients.filter((client) =>
      String(client.name || '').toLowerCase().includes(q) ||
      String(client.email || '').toLowerCase().includes(q) ||
      String(client.phoneNumber || '').toLowerCase().includes(q)
    ).slice(0, 8)
  }, [clientQuery, clients])

  const filteredProducts = useMemo(() => {
    if (!productQuery.trim()) return products.slice(0, 10)
    const q = productQuery.trim().toLowerCase()
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      String(p.sku || '').toLowerCase().includes(q)
    ).slice(0, 10)
  }, [products, productQuery])

  const selectedClient = clients.find(c => c.id === Number(clientId))

  useEffect(() => {
    if (selectedClient) {
      setClientQuery(formatClientOption(selectedClient))
      return
    }
    if (!clientId) {
      setClientQuery('')
    }
  }, [clientId, selectedClient])

  if (user === undefined) {
    return <Shell title="New Order"><LoadingState /></Shell>
  }
  if (!user || user.role?.toLowerCase() !== 'admin') {
    return <Shell title="New Order"><div className="text-red-600">Not authorized.</div></Shell>
  }

  const addProduct = (p: AdminProduct) => {
    setProductQuery('')
    setProductOpen(false)
    setLines(prev => {
      const existing = prev.find(l => l.productId === p.id)
      if (existing) {
        return prev.map(l => l.productId === p.id ? { ...l, quantity: l.quantity + 1 } : l)
      }
      return [
        ...prev,
        {
          productId: p.id,
          name: p.name,
          price: p.price,
          quantity: 1,
          unitPrice: p.price,
          discountAmount: 0
        }
      ]
    })
  }

  const updateLine = (productId: number, patch: Partial<OrderLine>) => {
    setLines(prev => prev.map(l => l.productId === productId ? { ...l, ...patch } : l))
  }

  const updateQty = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      setLines(prev => prev.filter(l => l.productId !== productId))
      return
    }
    updateLine(productId, { quantity })
  }

  const removeLine = (productId: number) => {
    setLines(prev => prev.filter(l => l.productId !== productId))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const nextErrors: OrderFormErrors = {}
    if (!selectedClient) nextErrors.clientId = 'Please select a client.'
    if (!lines.length) nextErrors.items = 'Please add at least one product.'
    if (!selectedAddressId) nextErrors.selectedAddressId = 'Please select a shipping address.'
    if (!orderDate) {
      nextErrors.orderDate = 'Order date is required.'
    } else if (orderDate > todayInput()) {
      nextErrors.orderDate = 'Future-dated orders are not allowed.'
    } else if (orderDateTooOld) {
      nextErrors.orderDate = 'Backdated orders older than 7 days are not allowed.'
    }
    if (isBackdatedOrder && !notes.trim()) nextErrors.notes = 'Backdated orders require a note.'
    if (hasInitialPayment) {
      if (!paymentMethod) nextErrors.paymentMethod = 'Payment method is required.'
      if (!Number.isFinite(paymentAmountValue) || paymentAmountValue <= 0) {
        nextErrors.paymentAmount = 'Payment amount must be greater than 0.'
      } else if (paymentAmountValue > total) {
        nextErrors.paymentAmount = `Payment amount cannot exceed order total of ${formatInr(total)}.`
      }
      if (!paymentDate) {
        nextErrors.paymentDate = 'Payment date is required when recording a payment.'
      } else if (paymentDate > todayInput()) {
        nextErrors.paymentDate = 'Future-dated payments are not allowed.'
      } else if (paymentDateTooOld) {
        nextErrors.paymentDate = 'Backdated payments older than 7 days are not allowed.'
      } else if (paymentDateBeforeOrder) {
        nextErrors.paymentDate = 'Payment date cannot be earlier than the order date.'
      }
      if ((isBackdatedOrder || isBackdatedPayment) && !notes.trim()) {
        nextErrors.notes = 'Backdated orders or payments require a note.'
      }
    }

    setFormErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    const client = selectedClient
    if (!client) return

    const items = lines.map(l => ({
      productId: l.productId,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      discountAmount: l.discountAmount
    }))
    const payload = {
      clientId: client.id,
      name: client.name,
      email: client.email || '',
      phone: client.phoneNumber || '',
      items,
      CustomerName: client.name,
      Email: client.email || '',
      Phone: client.phoneNumber || '',
      ShippingAddressId: Number(selectedAddressId),
      orderDate,
      notes,
      ...(initialOrderStatus ? { initialOrderStatus: Number(initialOrderStatus) } : {}),
      ...(hasInitialPayment ? {
        paymentMethod: Number(paymentMethod),
        paymentAmount: paymentAmountValue,
        paymentDate
      } : {})
    }

    setSaving(true)
    try {
      const res = await apiAdminCreateOrder(payload, token)
      const orderId = res?.orderId ?? res?.OrderId ?? res?.id ?? res?.Id
      let invoiceId = res?.invoiceId ?? res?.InvoiceId
      if (!invoiceId && orderId) {
        try {
          const invoices = await apiGetInvoicesForOrder(Number(orderId), token)
          invoiceId = Array.isArray(invoices) && invoices.length ? invoices[0]?.id ?? invoices[0]?.Id : undefined
        } catch {
          invoiceId = undefined
        }
      }
      sessionStorage.setItem('admin_order_created', JSON.stringify({ orderId, invoiceId }))
      router.push(`/orders?created=1&orderId=${encodeURIComponent(String(orderId || ''))}`)
    } catch (e: any) {
      setError(e?.message || 'Failed to create order')
    } finally {
      setSaving(false)
    }
  }

  const openAddAddress = () => {
    if (!selectedClient) {
      setError('Select a client before adding an address')
      return
    }
    setAddressError(null)
    setAddressErrors({})
    setAddressForm({
      ...emptyAddress,
      name: selectedClient.name || ''
    })
    setShowAddressModal(true)
  }

  const saveAddress = async () => {
    if (!selectedClient) return
    setAddressError(null)
    const nextErrors: AddressErrors = {}
    if (isBlank(addressForm.addressLine1)) nextErrors.addressLine1 = 'Address line 1 is required.'
    if (isBlank(addressForm.city)) nextErrors.city = 'City is required.'
    if (isBlank(addressForm.state)) nextErrors.state = 'State is required.'
    if (isBlank(addressForm.postalCode)) nextErrors.postalCode = 'Postal code is required.'
    setAddressErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setAddressSaving(true)
    try {
      const payload: ClientAddressInput = {
        label: addressForm.label || 'Shipping',
        name: addressForm.name || selectedClient.name || '',
        phone: addressForm.phone || selectedClient.phoneNumber || '',
        addressLine1: addressForm.addressLine1,
        addressLine2: addressForm.addressLine2 || '',
        city: addressForm.city,
        state: addressForm.state,
        postalCode: addressForm.postalCode,
        country: addressForm.country || 'India',
        isDefault: addressForm.isDefault
      }
      await apiAdminCreateClientAddress(selectedClient.id, payload, token)
      await loadAddresses(selectedClient.id)
      setShowAddressModal(false)
    } catch (e: any) {
      setAddressError(e?.message || 'Failed to add address')
    } finally {
      setAddressSaving(false)
    }
  }

  const fallbackSubtotal = lines.reduce((sum, l) => sum + (l.unitPrice * l.quantity - l.discountAmount), 0)
  const fallbackDiscount = lines.reduce((sum, l) => sum + l.discountAmount, 0)
  const subtotal = pricing?.subtotal ?? fallbackSubtotal
  const discountTotal = pricing?.discountTotal ?? fallbackDiscount
  const total = pricing?.total ?? subtotal

  const lineTotals = new Map<number, number>()
  if (pricing?.items) {
    pricing.items.forEach(item => lineTotals.set(item.productId, item.lineTotal))
  }

  return (
    <Shell title="New Order">
      {error && <div className="text-red-600 mb-3">{error}</div>}
      <form onSubmit={submit} noValidate className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="border rounded-xl bg-white p-4 space-y-3">
            <div className="font-semibold">Client</div>
            <div className="relative">
              <input
                className={fieldClass(!!formErrors.clientId)}
                placeholder="Search client by name, email, or phone"
                value={clientQuery}
                onFocus={() => setClientOpen(true)}
                onChange={(e) => {
                  const value = e.target.value
                  setClientQuery(value)
                  setClientOpen(true)
                  if (!selectedClient || value !== formatClientOption(selectedClient)) {
                    setClientId('')
                  }
                  setFormErrors((prev) => ({ ...prev, clientId: undefined }))
                }}
                onBlur={() => {
                  setTimeout(() => {
                    setClientOpen(false)
                    if (!clientId) setClientQuery('')
                  }, 120)
                }}
              />
              {clientOpen && filteredClients.length > 0 && (
                <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-md border border-slate-200 bg-white shadow-lg">
                  {filteredClients.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      className="block w-full border-b border-slate-100 px-3 py-2 text-left last:border-b-0 hover:bg-slate-50"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setClientId(client.id)
                        setClientQuery(formatClientOption(client))
                        setClientOpen(false)
                        setFormErrors((prev) => ({ ...prev, clientId: undefined }))
                      }}
                    >
                      <div className="font-medium text-slate-900">{client.name}</div>
                      <div className="text-xs text-slate-500">{client.email || 'No email'}{client.phoneNumber ? ` - ${client.phoneNumber}` : ''}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <FieldError error={formErrors.clientId} />
            {selectedClient && (
              <div className="text-sm text-slate-600">
                <div>Email: {selectedClient.email || '-'}</div>
                <div>Phone: {selectedClient.phoneNumber || '-'}</div>
              </div>
            )}
          </div>

          <div className="border rounded-xl bg-white p-4 space-y-3">
            <div className="font-semibold">Shipping Address</div>
            {addressLoading ? (
              <div className="text-sm text-slate-500">Loading addresses...</div>
            ) : addresses.length === 0 ? (
              <div className="text-sm text-slate-600">No addresses yet. Add one to place the order.</div>
            ) : (
              <select
                className={fieldClass(!!formErrors.selectedAddressId)}
                value={selectedAddressId}
                onChange={(e) => {
                  const value = e.target.value
                  setSelectedAddressId(value)
                  setFormErrors((prev) => ({ ...prev, selectedAddressId: value ? undefined : prev.selectedAddressId }))
                }}
              >
                <option value="">Select an address</option>
                {addresses.map(addr => (
                  <option key={addr.id} value={String(addr.id)}>
                    {addr.label || addr.addressLine1} - {addr.city}
                  </option>
                ))}
              </select>
            )}
            <FieldError error={formErrors.selectedAddressId} />
            <button
              type="button"
              className="text-sm text-[#2B7CBF] underline"
              onClick={openAddAddress}
            >
              + Add new address
            </button>

            {selectedAddressId && (
              <div className="text-sm text-slate-600 border rounded-lg p-3 bg-slate-50">
                {(() => {
                  const selected = addresses.find(a => String(a.id) === String(selectedAddressId))
                  if (!selected) return <div>Address not found.</div>
                  return (
                    <div className="space-y-1">
                      <div className="font-medium">{selected.label || 'Selected address'}</div>
                      <div>{selected.name || selectedClient?.name}</div>
                      <div>{selected.addressLine1}</div>
                      {selected.addressLine2 && <div>{selected.addressLine2}</div>}
                      <div>{selected.city}, {selected.state} {selected.postalCode}</div>
                      <div>{selected.country || 'India'}</div>
                      {selected.phone && <div className="text-slate-500">{selected.phone}</div>}
                    </div>
                  )
                })()}
              </div>
            )}
          </div>

          <div className="border rounded-xl bg-white p-4 space-y-3">
            <div className="font-semibold">Order Details</div>
            <div>
              <label className="block text-sm mb-1">Order Date</label>
              <input
                type="date"
                className={fieldClass(!!formErrors.orderDate)}
                value={orderDate}
                min={backdateMin()}
                max={todayInput()}
                onChange={(e) => {
                  const value = e.target.value
                  setOrderDate(value)
                  const tooOld = value < todayInput() && daysBetween(value, todayInput()) > 7
                  setFormErrors((prev) => ({
                    ...prev,
                    orderDate: !value ? prev.orderDate : value > todayInput() || tooOld ? prev.orderDate : undefined,
                    notes: value < todayInput() && isBlank(notes) ? prev.notes : undefined
                  }))
                }}
              />
              <FieldError error={formErrors.orderDate} />
            </div>
            {isBackdatedOrder && (
              <div className={`rounded-lg border px-3 py-2 text-sm ${orderDateTooOld ? 'border-red-200 bg-red-50 text-red-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                {orderDateTooOld
                  ? 'Backdated orders older than 7 days are not allowed.'
                  : 'This is a backdated order entry. Please add a note.'}
              </div>
            )}
            <div>
              <label className="block text-sm mb-1">Order Status</label>
              <select
                className="w-full rounded-md border border-slate-300 px-3 py-2"
                value={initialOrderStatus}
                onChange={(e) => setInitialOrderStatus(e.target.value)}
              >
                <option value="">Default (Placed)</option>
                {ORDER_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="font-medium text-slate-900">Payment</div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-sm mb-1">Payment Method</label>
                  <select
                    className={fieldClass(!!formErrors.paymentMethod)}
                    value={paymentMethod}
                    onChange={(e) => {
                      const value = e.target.value
                      setPaymentMethod(value)
                      setFormErrors((prev) => ({ ...prev, paymentMethod: value ? undefined : prev.paymentMethod }))
                    }}
                  >
                    {PAYMENT_METHOD_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <FieldError error={formErrors.paymentMethod} />
                </div>
                <div>
                  <label className="block text-sm mb-1">Payment Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className={fieldClass(!!formErrors.paymentAmount)}
                    placeholder="0.00"
                    value={paymentAmount}
                    onChange={(e) => {
                      const value = e.target.value
                      setPaymentAmount(value)
                      const numeric = Number(value || 0)
                      setFormErrors((prev) => ({
                        ...prev,
                        paymentAmount: !value || (Number.isFinite(numeric) && numeric >= 0 && numeric <= total) ? undefined : prev.paymentAmount
                      }))
                    }}
                  />
                  <FieldError error={formErrors.paymentAmount} />
                </div>
                <div>
                  <label className="block text-sm mb-1">Payment Date</label>
                  <input
                    type="date"
                    className={fieldClass(!!formErrors.paymentDate)}
                    value={paymentDate}
                    min={orderDate < backdateMin() ? orderDate : backdateMin()}
                    max={todayInput()}
                    onChange={(e) => {
                      const value = e.target.value
                      setPaymentDate(value)
                      setFormErrors((prev) => ({
                        ...prev,
                        paymentDate: !value || (value <= todayInput() && value >= orderDate) ? undefined : prev.paymentDate
                      }))
                    }}
                  />
                  <FieldError error={formErrors.paymentDate} />
                </div>
              </div>
              <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                <div>Recorded payment: <span className="font-medium text-slate-900">{formatInr(hasInitialPayment ? paymentAmountValue : 0)}</span></div>
                <div>Calculated invoice status: <span className="font-medium text-slate-900">{paymentAmountValue <= 0 ? 'Unpaid' : paymentAmountValue >= total ? 'Paid' : 'Partially Paid'}</span></div>
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1">Note</label>
              <textarea
                className={fieldClass(!!formErrors.notes)}
                rows={3}
                placeholder="Add context for this order"
                value={notes}
                onChange={(e) => {
                  const value = e.target.value
                  setNotes(value)
                  setFormErrors((prev) => ({ ...prev, notes: value.trim() ? undefined : prev.notes }))
                }}
              />
              <FieldError error={formErrors.notes} />
            </div>
          </div>

          <div className="border rounded-xl bg-white p-4 space-y-3">
            <div className="font-semibold">Add products</div>
            <div className="relative">
              <input
                className="w-full rounded-md border border-slate-300 px-3 py-2"
                placeholder="Search product by name or SKU"
                value={productQuery}
                onFocus={() => setProductOpen(true)}
                onChange={(e) => {
                  setProductQuery(e.target.value)
                  setProductOpen(true)
                }}
                onBlur={() => {
                  setTimeout(() => setProductOpen(false), 120)
                }}
              />
              {productOpen && (
                <div className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-md border border-slate-200 bg-white shadow-lg">
                  {filteredProducts.length === 0 ? (
                    <div className="p-3 text-sm text-slate-600">No products found.</div>
                  ) : (
                    filteredProducts.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="block w-full border-b border-slate-100 px-3 py-2 text-left last:border-b-0 hover:bg-slate-50"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => addProduct(p)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium text-slate-900">{p.name}</div>
                            <div className="text-xs text-slate-500">SKU {p.sku || '-'} ? Stock {p.quantity}</div>
                          </div>
                          <span className="text-xs font-medium text-[#2B7CBF]">Add</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            {lines.length > 0 && (
              <div className="text-xs text-slate-500">Selected items appear in the order table below.</div>
            )}
          </div>

          <div className="border rounded-xl bg-white p-4 space-y-3">
            <div className="font-semibold">Items</div>
            <FieldError error={formErrors.items} />
            {lines.length === 0 ? (
              <div className="text-sm text-slate-600">No items added yet.</div>
            ) : (
              <div className="overflow-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-slate-600">
                    <tr>
                      <th className="text-left py-2">Product</th>
                      <th className="text-right py-2">Unit Price</th>
                      <th className="text-right py-2">Discount</th>
                      <th className="text-right py-2">Qty</th>
                      <th className="text-right py-2">Line Total</th>
                      <th className="text-right py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map(l => {
                      const lineTotal = lineTotals.get(l.productId) ?? (l.unitPrice * l.quantity - l.discountAmount)
                      return (
                        <tr key={l.productId} className="border-t">
                          <td className="py-2">{l.name}</td>
                          <td className="py-2 text-right">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              className="w-24 text-right border rounded-md px-2 py-1"
                              value={l.unitPrice}
                              onChange={(e) => updateLine(l.productId, { unitPrice: Number(e.target.value || 0) })}
                            />
                          </td>
                          <td className="py-2 text-right">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              className="w-24 text-right border rounded-md px-2 py-1"
                              value={l.discountAmount}
                              onChange={(e) => updateLine(l.productId, { discountAmount: Number(e.target.value || 0) })}
                            />
                          </td>
                          <td className="py-2 text-right">
                            <div className="inline-flex items-center border rounded-md overflow-hidden">
                              <button type="button" className="px-2 py-1" onClick={() => updateQty(l.productId, l.quantity - 1)}>-</button>
                              <input
                                className="w-12 text-center border-l border-r"
                                value={l.quantity}
                                onChange={(e) => updateQty(l.productId, Number(e.target.value || 0))}
                              />
                              <button type="button" className="px-2 py-1" onClick={() => updateQty(l.productId, l.quantity + 1)}>+</button>
                            </div>
                          </td>
                          <td className="py-2 text-right">{formatInr(lineTotal)}</td>
                          <td className="py-2 text-right">
                            <button type="button" className="text-red-600 text-sm" onClick={() => removeLine(l.productId)}>Remove</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="border rounded-xl bg-white p-4 space-y-2">
            <div className="font-semibold">Order Summary</div>
            <div className="flex items-center justify-between text-sm"><span>Subtotal</span><span>{formatInr(subtotal)}</span></div>
            <div className="flex items-center justify-between text-sm"><span>Discounts</span><span>{formatInr(discountTotal)}</span></div>
            <div className="flex items-center justify-between font-semibold"><span>Total</span><span>{formatInr(total)}</span></div>
            <button
              type="button"
              className="mt-2 w-full border rounded-md px-3 py-2 text-sm hover:text-[#4DB6E2] hover:border-[#4DB6E2]"
              onClick={() => recalcPricing()}
              disabled={pricingLoading}
            >
              {pricingLoading ? 'Recalculating...' : 'Recalculate'}
            </button>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-[#6FAF3D] hover:bg-[#5F9B34] text-white px-4 py-2 rounded-md w-full disabled:opacity-60"
          >
            {saving ? 'Placing...' : 'Place Order'}
          </button>
          <Link href="/orders" className="text-[#2B7CBF] text-sm block text-center">Back to orders</Link>
        </aside>
      </form>

      {showAddressModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 px-4 py-6">
          <div className="mx-auto w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div className="font-semibold">Add address</div>
              <button className="text-slate-500" onClick={() => setShowAddressModal(false)}>Close</button>
            </div>
            <div className="p-4 space-y-3">
              {addressError && <div className="text-red-600 text-sm">{addressError}</div>}
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="border rounded-md px-3 py-2"
                  placeholder="Label"
                  value={addressForm.label}
                  onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                />
                <input
                  className="border rounded-md px-3 py-2"
                  placeholder="Phone"
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                />
              </div>
              <div>
                <input
                  className={fieldClass(!!addressErrors.addressLine1)}
                  placeholder="Address line 1"
                  value={addressForm.addressLine1}
                  onChange={(e) => {
                    const value = e.target.value
                    setAddressForm({ ...addressForm, addressLine1: value })
                    setAddressErrors((prev) => ({ ...prev, addressLine1: value.trim() ? undefined : prev.addressLine1 }))
                  }}
                />
                <FieldError error={addressErrors.addressLine1} />
              </div>
              <input
                className="border rounded-md px-3 py-2 w-full"
                placeholder="Address line 2"
                value={addressForm.addressLine2}
                onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <input
                    className={fieldClass(!!addressErrors.city)}
                    placeholder="City"
                    value={addressForm.city}
                    onChange={(e) => {
                      const value = e.target.value
                      setAddressForm({ ...addressForm, city: value })
                      setAddressErrors((prev) => ({ ...prev, city: value.trim() ? undefined : prev.city }))
                    }}
                  />
                  <FieldError error={addressErrors.city} />
                </div>
                <div>
                  <input
                    className={fieldClass(!!addressErrors.state)}
                    placeholder="State"
                    value={addressForm.state}
                    onChange={(e) => {
                      const value = e.target.value
                      setAddressForm({ ...addressForm, state: value })
                      setAddressErrors((prev) => ({ ...prev, state: value.trim() ? undefined : prev.state }))
                    }}
                  />
                  <FieldError error={addressErrors.state} />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <input
                    className={fieldClass(!!addressErrors.postalCode)}
                    placeholder="Postal code"
                    value={addressForm.postalCode}
                    onChange={(e) => {
                      const value = e.target.value
                      setAddressForm({ ...addressForm, postalCode: value })
                      setAddressErrors((prev) => ({ ...prev, postalCode: value.trim() ? undefined : prev.postalCode }))
                    }}
                  />
                  <FieldError error={addressErrors.postalCode} />
                </div>
                <input
                  className="border rounded-md px-3 py-2"
                  placeholder="Country"
                  value={addressForm.country}
                  onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                />
              </div>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                />
                Make default
              </label>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
                <button className="px-3 py-2 border rounded-md" onClick={() => setShowAddressModal(false)}>Cancel</button>
                <button
                  className="px-4 py-2 rounded-md bg-[#6FAF3D] text-white hover:bg-[#5F9B34] disabled:opacity-60"
                  onClick={saveAddress}
                  disabled={addressSaving}
                >
                  {addressSaving ? 'Saving...' : 'Save address'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Shell>
  )
}

function todayInput() {
  return new Date().toLocaleDateString('en-CA')
}

function backdateMin() {
  const date = new Date()
  date.setDate(date.getDate() - 7)
  return date.toLocaleDateString('en-CA')
}

function daysBetween(from: string, to: string) {
  const fromDate = new Date(`${from}T00:00:00`)
  const toDate = new Date(`${to}T00:00:00`)
  return Math.floor((toDate.getTime() - fromDate.getTime()) / 86400000)
}

function formatClientOption(client: AdminClient) {
  const details = [client.email, client.phoneNumber].filter(Boolean).join(' - ')
  return details ? `${client.name} (${details})` : client.name
}

function formatInr(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(value)
}


function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="landing">
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">{title}</h1>
          <Link href="/orders" className="text-[#2B7CBF]">Back to orders</Link>
        </div>
        {children}
      </main>
    </div>
  )
}


