"use client"

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

type OrderLine = {
  productId: number
  name: string
  price: number
  quantity: number
  unitPrice: number
  discountAmount: number
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
  const [query, setQuery] = useState('')
  const [lines, setLines] = useState<OrderLine[]>([])
  const [pricing, setPricing] = useState<AdminPriceResponse | null>(null)
  const [pricingLoading, setPricingLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [addresses, setAddresses] = useState<ClientAddress[]>([])
  const [addressLoading, setAddressLoading] = useState(false)
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [addressForm, setAddressForm] = useState<AddressForm>({ ...emptyAddress })
  const [addressError, setAddressError] = useState<string | null>(null)
  const [addressSaving, setAddressSaving] = useState(false)

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

  const filteredProducts = useMemo(() => {
    if (!query.trim()) return products
    const q = query.trim().toLowerCase()
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      String(p.sku || '').toLowerCase().includes(q)
    )
  }, [products, query])

  if (user === null) {
    return <Shell title="New Order"><div>Loading...</div></Shell>
  }
  if (!user || user.role?.toLowerCase() !== 'admin') {
    return <Shell title="New Order"><div className="text-red-600">Not authorized.</div></Shell>
  }

  const selectedClient = clients.find(c => c.id === Number(clientId))

  const addProduct = (p: AdminProduct) => {
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
    if (!selectedClient) {
      setError('Please select a client')
      return
    }
    if (!lines.length) {
      setError('Please add at least one product')
      return
    }
    if (!selectedAddressId) {
      setError('Please select a shipping address')
      return
    }
    const items = lines.map(l => ({
      productId: l.productId,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      discountAmount: l.discountAmount
    }))
    const payload = {
      clientId: selectedClient.id,
      name: selectedClient.name,
      email: selectedClient.email || '',
      phone: selectedClient.phoneNumber || '',
      items,
      CustomerName: selectedClient.name,
      Email: selectedClient.email || '',
      Phone: selectedClient.phoneNumber || '',
      ShippingAddressId: Number(selectedAddressId)
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
    setAddressForm({
      ...emptyAddress,
      name: selectedClient.name || ''
    })
    setShowAddressModal(true)
  }

  const saveAddress = async () => {
    if (!selectedClient) return
    setAddressError(null)
    const requiredMissing = !addressForm.addressLine1.trim() || !addressForm.city.trim() || !addressForm.state.trim() || !addressForm.postalCode.trim()
    if (requiredMissing) {
      setAddressError('Address line 1, city, state, and postal code are required')
      return
    }
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
      <form onSubmit={submit} className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="border rounded-xl bg-white p-4 space-y-3">
            <div className="font-semibold">Client</div>
            <select
              className="border rounded-md px-3 py-2 w-full"
              value={clientId}
              onChange={(e) => setClientId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">Select a client</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name} {c.email ? `(${c.email})` : ''}</option>
              ))}
            </select>
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
                className="border rounded-md px-3 py-2 w-full"
                value={selectedAddressId}
                onChange={(e) => setSelectedAddressId(e.target.value)}
              >
                <option value="">Select an address</option>
                {addresses.map(addr => (
                  <option key={addr.id} value={String(addr.id)}>
                    {addr.label || addr.addressLine1} - {addr.city}
                  </option>
                ))}
              </select>
            )}
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
            <div className="font-semibold">Add products</div>
            <input
              className="border rounded-md px-3 py-2 w-full"
              placeholder="Search product by name or SKU"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="max-h-64 overflow-auto border rounded-md">
              {filteredProducts.length === 0 ? (
                <div className="p-3 text-sm text-slate-600">No products found.</div>
              ) : (
                filteredProducts.map(p => (
                  <div key={p.id} className="flex items-center justify-between px-3 py-2 border-b last:border-b-0">
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-slate-500">SKU {p.sku || '-'} - Stock {p.quantity}</div>
                    </div>
                    <button
                      type="button"
                      className="px-3 py-1 border rounded text-sm hover:text-[#4DB6E2] hover:border-[#4DB6E2]"
                      onClick={() => addProduct(p)}
                    >
                      Add
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border rounded-xl bg-white p-4 space-y-3">
            <div className="font-semibold">Items</div>
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
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div className="font-semibold">Add address</div>
              <button className="text-slate-500" onClick={() => setShowAddressModal(false)}>Close</button>
            </div>
            <div className="p-4 space-y-3">
              {addressError && <div className="text-red-600 text-sm">{addressError}</div>}
              <div className="grid grid-cols-2 gap-3">
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
              <input
                className="border rounded-md px-3 py-2 w-full"
                placeholder="Address line 1"
                value={addressForm.addressLine1}
                onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
              />
              <input
                className="border rounded-md px-3 py-2 w-full"
                placeholder="Address line 2"
                value={addressForm.addressLine2}
                onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="border rounded-md px-3 py-2"
                  placeholder="City"
                  value={addressForm.city}
                  onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                />
                <input
                  className="border rounded-md px-3 py-2"
                  placeholder="State"
                  value={addressForm.state}
                  onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="border rounded-md px-3 py-2"
                  placeholder="Postal code"
                  value={addressForm.postalCode}
                  onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                />
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
              <div className="flex items-center justify-end gap-2">
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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{title}</h1>
          <Link href="/orders" className="text-[#2B7CBF]">Back to orders</Link>
        </div>
        {children}
      </main>
    </div>
  )
}
