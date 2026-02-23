import { getValidTokenOrLogout, isJwtExpired, logout } from '@/lib/auth'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5079'
const STORE_API_BASE = process.env.NEXT_PUBLIC_STORE_API_BASE || ''
const PRODUCTS_ENDPOINT = process.env.NEXT_PUBLIC_PRODUCTS_ENDPOINT || '/api/Products'
const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_BASE || '/media'
const DEBUG_FETCH = process.env.NEXT_DEBUG_FETCH === '1'
const CHECKOUT_ENDPOINT = process.env.NEXT_PUBLIC_CHECKOUT_ENDPOINT || '/api/Orders'
const CART_PRICE_ENDPOINT = process.env.NEXT_PUBLIC_CART_PRICE_ENDPOINT || '/api/Orders/price'

export function resolveUrl(path: string) {
  if (/^https?:/i.test(path)) return path
  const base = API_BASE.replace(/\/+$/, '')
  return base + (path.startsWith('/') ? '' : '/') + path
}

function authHeaders(token?: string) {
  const t = token || getValidTokenOrLogout()
  if (!t) throw new Error('Not authenticated')
  if (token && isJwtExpired(token)) {
    if (typeof window !== 'undefined') logout()
    throw new Error('Not authenticated')
  }
  return { Authorization: `Bearer ${t}` }
}

function resolveStoreUrl(path: string) {
  if (/^https?:/i.test(path)) return path
  const base = (STORE_API_BASE || API_BASE).replace(/\/+$/, '')
  return base + (path.startsWith('/') ? '' : '/') + path
}

export function resolveImagePath(fileName?: string | null): string | undefined {
  if (!fileName) return undefined
  if (/^https?:/i.test(fileName)) return fileName
  const base = (IMAGE_BASE || '').replace(/\/+$/, '')
  const file = String(fileName).replace(/^\/+/, '')
  if (!base) return '/' + file
  return base + '/' + file
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export type ApiProduct = {
  id: string
  slug: string
  name: string
  price: number
  currency: string
  description: string
  image?: string
}

export async function fetchProducts(): Promise<ApiProduct[]> {
  const url = resolveUrl(PRODUCTS_ENDPOINT)
  if (DEBUG_FETCH) console.log('[products] fetching', url)
  const res = await fetch(url, DEBUG_FETCH ? { cache: 'no-store' } : { next: { revalidate: 60 } })
  if (!res.ok) throw new Error('Failed to fetch products from ' + url)
  const data = await res.json()
  if (Array.isArray(data) && data.length && (data[0].slug || data[0].Slug)) {
    return data.map((p: any) => ({
      id: p.id ?? p.Id,
      slug: p.slug ?? p.Slug,
      name: p.name ?? p.Name,
      price: Number(p.price ?? p.Price ?? 0),
      currency: (p.currency ?? p.Currency) || 'INR',
      description: p.description ?? p.Description ?? '',
      image: resolveImagePath(p.image ?? p.imageUrl ?? p.imageFileName ?? p.ImageFileName)
    }))
  }
  return (data || []).map((p: any) => ({
    id: String(p.id ?? p.Id),
    slug: (p.sku ?? p.SKU) ? slugify(String(p.sku ?? p.SKU)) : slugify(String(p.name ?? p.Name)) + '-' + (p.id ?? p.Id),
    name: String(p.name ?? p.Name),
    price: Number(p.price ?? p.Price ?? 0),
    currency: 'INR',
    description: String(p.description ?? p.Description ?? ''),
    image: resolveImagePath(p.image ?? p.imageUrl ?? p.imageFileName ?? p.ImageFileName)
  }))
}

export async function fetchProduct(slug: string): Promise<ApiProduct | null> {
  try {
    const list = await fetchProducts()
    return list.find(p => p.slug === slug) || null
  } catch (e) {
    const url = resolveUrl('/products/' + slug)
    const res = await fetch(url, DEBUG_FETCH ? { cache: 'no-store' } : { next: { revalidate: 60 } })
    if (res.status === 404) return null
    if (!res.ok) throw new Error('Failed to fetch product')
    return res.json()
  }
}

export type CartLine = { productId: string | number; qty: number }

export async function priceCart(items: CartLine[]) {
  const url = resolveStoreUrl(CART_PRICE_ENDPOINT)
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items })
  })
  if (!res.ok) throw new Error('Failed to price cart')
  return res.json()
}

export async function checkout(payload: { email?: string; name?: string; address?: string; items: CartLine[] }) {
  const url = resolveStoreUrl(CHECKOUT_ENDPOINT)
  const request = (() => {
    const items = (payload && Array.isArray(payload.items) ? payload.items : []).map((i: any) => ({
      productId: Number(i.productId ?? i.id ?? 0),
      quantity: Number(i.qty ?? i.quantity ?? 0)
    }))
    const shipping = (payload as any).shippingAddress
    const billing = (payload as any).billingAddress
    return {
      name: (payload as any).name,
      email: (payload as any).email,
      phone: (payload as any).phone,
      address: (payload as any).address,
      items, // single array for products
      CustomerName: (payload as any).name,
      Email: (payload as any).email,
      Phone: (payload as any).phone,
      Address: (payload as any).address,
      ShippingAddressId: (payload as any).shippingAddressId,
      ShippingAddress: shipping,
      BillingAddress: billing
    }
  })()
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  })
  if (res.status === 404) throw new Error('Checkout endpoint not found. Set NEXT_PUBLIC_CHECKOUT_ENDPOINT to your API route, e.g. /api/Orders')
  if (!res.ok) throw new Error('Checkout failed')
  return res.json()
}

export async function apiLogin(username: string, password: string) {
  const url = resolveUrl('/api/Auth/login')
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  if (!res.ok) throw new Error('Invalid username or password')
  return res.json()
}

export async function apiRegister(input: { username: string; email: string; password: string; firstName?: string; lastName?: string }) {
  const url = resolveUrl('/api/Auth/register')
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: input.username,
      email: input.email,
      password: input.password,
      firstName: input.firstName || '',
      lastName: input.lastName || '',
      role: 'User'
    })
  })
  if (!res.ok) throw new Error('Registration failed')
  return res.json()
}

export async function apiForgotPassword(email: string) {
  const url = resolveUrl('/api/Auth/forgot-password')
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || 'Failed to send reset link')
  }
  return res.json()
}



export async function apiResetPassword(input: { email: string; token: string; newPassword: string }) {
  const url = resolveUrl('/api/Auth/reset-password')
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: input.email,
      token: input.token,
      newPassword: input.newPassword
    })
  })
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    const message = data?.message || 'Reset failed'
    const errors = Array.isArray(data?.errors) ? data.errors.join(', ') : ''
    throw new Error(errors ? `${message}: ${errors}` : message)
  }
  return res.json()
}
// Admin: create product in InventoryManagement.API
export async function apiCreateProduct(payload: {
  name: string
  description?: string
  sku: string
  price: number
  costPrice: number
  quantity: number
  type: number
  unit: number
  imageFileName?: string
}, token?: string) {
  const url = resolveUrl('/api/Products')
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(token)
    },
    body: JSON.stringify({
      name: payload.name,
      description: payload.description || '',
      sku: payload.sku,
      price: payload.price,
      costPrice: payload.costPrice,
      quantity: payload.quantity,
      type: payload.type,
      unit: payload.unit,
      imageFileName: payload.imageFileName || null
    })
  })
  if (!res.ok) throw new Error('Failed to create product')
  return res.json()
}

export async function apiGetProduct(id: string | number) {
  const url = resolveUrl(`/api/Products/${id}`)
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch product')
  return res.json()
}

export async function apiUpdateProduct(id: string | number, payload: any, token?: string) {
  const url = resolveUrl(`/api/Products/${id}`)
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(token)
    },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error('Failed to update product')
  return true
}

export async function apiDeleteProduct(id: string | number, token?: string) {
  const url = resolveUrl(`/api/Products/${id}`)
  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      ...authHeaders(token)
    }
  })
  if (!res.ok) throw new Error('Failed to delete product')
  return true
}

// --- Admin APIs (separate admin routes) ---

export type AdminDashboardSummary = {
  productsCount: number
  ordersCount: number
  revenue7d: number
  revenue30d: number
  unpaidInvoices: number
  partiallyPaidInvoices: number
}

export async function apiAdminDashboard(): Promise<AdminDashboardSummary> {
  const res = await fetch(resolveUrl('/api/admin/dashboard'), { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to load dashboard')
  return res.json()
}

export type AdminOrder = {
  id: number
  orderNumber?: string
  clientId?: number
  clientName?: string
  productId?: number
  productName?: string
  quantity: number
  unitPrice: number
  totalAmount: number
  status: string
  paymentMethod?: string
  invoiceStatus?: string
  amountPaid?: number
  createdAt?: string
  updatedAt?: string
  remainingAmount?: number
}

export async function apiAdminOrders(status?: string): Promise<AdminOrder[]> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : ''
  const res = await fetch(resolveUrl(`/api/admin/orders${qs}`), { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to load orders')
  return res.json()
}

export async function apiAdminUpdateOrderStatus(id: number, status: string) {
  const res = await fetch(resolveUrl(`/api/admin/orders/${id}/status`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(status)
  })
  if (!res.ok) throw new Error('Failed to update order status')
  return res.json()
}

export type AdminInvoice = {
  id: number
  invoiceNumber: string
  orderId: number
  orderNumber?: string
  clientName?: string
  amount: number
  paymentMethod: number
  referenceNumber?: string
  status: number
  notes?: string
  createdAt?: string
  updatedAt?: string
}

export async function apiAdminInvoices(orderId?: number): Promise<AdminInvoice[]> {
  const qs = orderId ? `?orderId=${orderId}` : ''
  const res = await fetch(resolveUrl(`/api/admin/invoices${qs}`), { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to load invoices')
  return res.json()
}

export async function apiAdminCreateInvoice(input: {
  orderId: number
  amount: number
  paymentMethod: number
  referenceNumber?: string
  notes?: string
}): Promise<AdminInvoice> {
  const res = await fetch(resolveUrl('/api/admin/invoices'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })
  if (!res.ok) throw new Error('Failed to create invoice')
  return res.json()
}

export type AdminMonthlyPoint = { month: number; total: number }

export async function apiAdminMonthlyRevenue(year: number): Promise<AdminMonthlyPoint[]> {
  const res = await fetch(resolveUrl(`/api/admin/analytics/monthly/${year}`), { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to load monthly revenue')
  return res.json()
}

export async function apiAdminTotalForRange(startDate: string, endDate: string): Promise<number> {
  const res = await fetch(resolveUrl(`/api/admin/analytics/total?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`), { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to load totals')
  const data = await res.json()
  return data.total ?? 0
}

// Client profile (linked to AspNetUsers)
export type ClientProfile = {
  id?: string
  userId?: string
  name?: string
  email?: string
  phone?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
}

export async function apiGetMyClientProfile(token: string): Promise<ClientProfile | null> {
  const url = resolveUrl('/api/Clients/me')
  const res = await fetch(url, { headers: authHeaders(token), cache: 'no-store' })
  if (res.status === 404) return null
  if (!res.ok) throw new Error('Failed to fetch client profile')
  return res.json()
}

export async function apiUpsertMyClientProfile(payload: ClientProfile, token: string): Promise<ClientProfile> {
  const url = resolveUrl('/api/Clients/me')
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(token)
    },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error('Failed to save client profile')
  return res.json()
}

// Multiple saved addresses (optional extension)
export type ClientAddress = {
  id: string | number
  clientId?: number
  label?: string
  isDefault?: boolean
  name?: string
  phone?: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postalCode: string
  country?: string
}

export async function apiListMyAddresses(token: string): Promise<ClientAddress[]> {
  const url = resolveUrl('/api/Clients/addresses')
  const res = await fetch(url, { headers: authHeaders(token), cache: 'no-store' })
  if (res.status === 404) return []
  if (!res.ok) throw new Error('Failed to fetch addresses')
  return res.json()
}

export type ClientAddressInput = {
  label?: string
  isDefault?: boolean
  name?: string
  phone?: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postalCode: string
  country?: string
}

export async function apiAddMyAddress(payload: ClientAddressInput, token: string): Promise<ClientAddress> {
  const url = resolveUrl('/api/Clients/addresses')
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(token)
    },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error('Failed to add address')
  return res.json()
}

export async function apiUpdateMyAddress(id: string | number, payload: ClientAddressInput, token: string): Promise<ClientAddress> {
  const url = resolveUrl(`/api/Clients/addresses/${id}`)
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(token)
    },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error('Failed to update address')
  return res.json()
}

export async function apiDeleteMyAddress(id: string | number, token: string): Promise<boolean> {
  const url = resolveUrl(`/api/Clients/addresses/${id}`)
  const res = await fetch(url, { method: 'DELETE', headers: authHeaders(token) })
  if (res.status === 204) return true
  if (!res.ok) throw new Error('Failed to delete address')
  return true
}

// Orders
export type StoreOrderItem = {
  productId?: string | number
  name?: string
  quantity: number
  unitPrice?: number
  lineTotal?: number
}

export type StoreOrder = {
  id: string | number
  orderId?: string | number
  status?: string
  subtotal?: number
  taxes?: number
  total?: number
  createdAt?: string
  paymentMethod?: string
  shippingAddress?: any
  billingAddress?: any
  items?: StoreOrderItem[]
}

export async function apiGetOrder(id: string | number, token?: string): Promise<StoreOrder> {
  const url = `${STORE_API_BASE}/orders/${id}`
  const res = await fetch(url, {
    headers: {
      ...authHeaders(token)
    },
    cache: 'no-store'
  })
  if (!res.ok) throw new Error('Failed to fetch order')
  const o = await res.json()
  // normalize properties defensively
  const items = (o.items || o.Lines || o.lines || []).map((l: any) => ({
    productId: l.productId ?? l.ProductId ?? l.id ?? l.Id,
    name: l.name ?? l.Name,
    quantity: Number(l.qty ?? l.quantity ?? l.Qty ?? l.Quantity ?? 0),
    unitPrice: Number(l.unitPrice ?? l.UnitPrice ?? l.price ?? l.Price ?? 0),
    lineTotal: Number(l.lineTotal ?? l.LineTotal ?? l.total ?? l.Total ?? 0),
  }))
  return {
    id: o.id ?? o.Id ?? id,
    orderId: o.orderId ?? o.OrderId ?? o.id ?? o.Id ?? id,
    status: o.status ?? o.Status ?? 'Placed',
    subtotal: Number(o.subtotal ?? o.Subtotal ?? 0),
    taxes: Number(o.taxes ?? o.Taxes ?? 0),
    total: Number(o.total ?? o.Total ?? 0),
    createdAt: o.createdAt ?? o.CreatedAt ?? o.created ?? o.Created,
    paymentMethod: o.paymentMethod ?? o.PaymentMethod ?? undefined,
    shippingAddress: o.shippingAddress ?? o.ShippingAddress ?? null,
    billingAddress: o.billingAddress ?? o.BillingAddress ?? null,
    items
  }
}










