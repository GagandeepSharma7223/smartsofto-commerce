"use client"
import { useEffect, useMemo, useState } from 'react'
import { priceCart, checkout as apiCheckout, resolveUrl, apiListMyAddresses } from '@/lib/api'
import SiteHeader from '@/components/SiteHeader'
import { readCart, setQty as setQtyUtil, removeFromCart as removeFromCartUtil } from '@/lib/cart'
import { useClientUser, getToken } from '@/lib/auth'

type CartItem = { id: string; qty: number }

export default function CartPage() {
  const user = useClientUser()
  const [items, setItems] = useState<CartItem[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [addresses, setAddresses] = useState<any[]>([])
  const [addrLoading, setAddrLoading] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('cart') || '[]'
      setItems(JSON.parse(raw))
    } catch {}
    // fetch products from API so cart has correct names/prices
    const url = resolveUrl(process.env.NEXT_PUBLIC_PRODUCTS_ENDPOINT || '/api/Products')
    fetch(url, { cache: 'no-store' })
      .then(res => (res.ok ? res.json() : Promise.reject(new Error('products fetch failed'))))
      .then(data => {
        const mapped = (data || []).map((p: any) => ({
          id: String(p.id ?? p.Id),
          name: String(p.name ?? p.Name),
          description: String(p.description ?? p.Description ?? ''),
          price: Number(p.price ?? p.Price ?? 0),
        }))
        setProducts(mapped)
      })
      .catch(() => setProducts([]))
  }, [])

  // Load saved addresses preview
  useEffect(() => {
    if (user === null) return
    if (!user) return
    const token = getToken()
    if (!token) return
    setAddrLoading(true)
    apiListMyAddresses(token)
      .then(list => setAddresses(Array.isArray(list) ? list : []))
      .catch(() => setAddresses([]))
      .finally(() => setAddrLoading(false))
  }, [user])

  const merged = useMemo(() => {
    return items
      .map(i => ({ ...i, product: products.find(p => String(p.id) === String(i.id)) }))
      .filter(i => !!i.product)
  }, [items, products])

  const total = merged.reduce((sum, i: any) => sum + i.product.price * i.qty, 0)

  const [flash, setFlash] = useState<{ id: string; mode: 'add' | 'remove' } | null>(null)

  const syncFromStorage = () => {
    setItems(readCart())
  }

  const update = (id: string, qty: number) => {
    setQtyUtil(String(id), Math.max(1, qty))
    syncFromStorage()
  }

  const inc = (id: string) => {
    setFlash({ id, mode: 'add' })
    setTimeout(() => setFlash(null), 500)
    update(id, (items.find(i => i.id === id)?.qty || 1) + 1)
  }
  const dec = (id: string) => {
    const current = items.find(i => i.id === id)?.qty || 1
    if (current <= 1) return
    setFlash({ id, mode: 'remove' })
    setTimeout(() => setFlash(null), 500)
    update(id, current - 1)
  }

  const removeItem = (id: string) => {
    setFlash({ id, mode: 'remove' })
    setTimeout(() => {
      removeFromCartUtil(String(id))
      syncFromStorage()
    }, 200)
  }

  const [pricing, setPricing] = useState<any | null>(null)

  const priceWithApi = async () => {
    try {
      const payload = items.map(i => ({ productId: i.id, qty: i.qty }))
      const res = await priceCart(payload)
      setPricing(res)
    } catch {
      alert('Pricing failed. Ensure API is running.')
    }
  }

  const checkout = async () => {
    try {
      const payload = items.map(i => ({ productId: i.id, qty: i.qty }))
      const res = await apiCheckout({ items: payload })
      alert(`Order placed: ${res.orderId}`)
    } catch {
      alert('Checkout failed. Ensure API is running.')
    }
  }

  return (
    <div className="landing">
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-semibold">Your Cart</h1>
        {merged.length === 0 ? (
          <div>Your cart is empty.</div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className="border rounded-xl p-4 bg-white">
              <div className="font-medium mb-1">Shipping to</div>
              {addrLoading ? (
                <div className="text-slate-600 text-sm">Loading address...</div>
              ) : addresses.length ? (
                <div className="text-sm text-slate-700">
                  <div>{addresses[0].label || addresses[0].name || 'Saved Address'}</div>
                  <div>{addresses[0].addressLine1}</div>
                  {addresses[0].addressLine2 && <div>{addresses[0].addressLine2}</div>}
                  <div>{addresses[0].city}, {addresses[0].state} {addresses[0].postalCode}</div>
                  <div>India</div>
                  <a href="/checkout" className="text-[#6FAF3D] underline text-xs">Change at checkout</a>
                </div>
              ) : (
                <div className="text-sm text-slate-600">
                  No saved address. <a href="/checkout" className="text-[#6FAF3D] underline">Add one at checkout</a>.
                </div>
              )}
            </div>
            {merged.map((i: any) => (
                <div
                  key={i.id}
                  className={`border rounded-xl p-4 flex items-center justify-between ${
                    flash && flash.id === i.id && flash.mode === 'remove' ? 'row-remove' : ''
                  }`}
                >
                  <div>
                    <div className="font-medium">{i.product.name}</div>
                    {i.product.description && (
                      <div className="text-sm text-slate-600 line-clamp-2 max-w-[520px]">
                        {i.product.description}
                      </div>
                    )}
                    <div className="text-sm text-slate-700 mt-1">{String.fromCharCode(8377)}{i.product.price}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="inline-flex items-center border rounded-xl overflow-hidden">
                      <button aria-label="Decrease" className="px-3 py-1 select-none" onClick={() => dec(i.id)}>
                        -
                      </button>
                      <div className="px-3 py-1 min-w-10 text-center">{i.qty}</div>
                      <button aria-label="Increase" className="px-3 py-1 select-none" onClick={() => inc(i.id)}>
                        +
                      </button>
                    </div>
                    <button
                      aria-label="Delete item"
                      title="Delete item"
                      className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-[#6FAF3D] text-white hover:bg-[#5F9B34] shadow"
                      onClick={() => removeItem(i.id)}
                    >
                      <i className="fa-solid fa-trash-can text-[16px]"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="border rounded-xl p-4 space-y-3 h-fit">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span className="font-semibold">{String.fromCharCode(8377)}{total}</span>
              </div>
              {pricing && (
                <div className="text-sm text-slate-700 space-y-1">
                  <div className="flex items-center justify-between">
                    <span>API Subtotal</span>
                    <span>{String.fromCharCode(8377)}{pricing.subtotal}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Taxes</span>
                    <span>{String.fromCharCode(8377)}{pricing.taxes}</span>
                  </div>
                  <div className="flex items-center justify-between font-medium">
                    <span>Total</span>
                    <span>{String.fromCharCode(8377)}{pricing.total}</span>
                  </div>
                </div>
              )}
              <button className="border w-full py-2 rounded-full" onClick={priceWithApi}>
                Price with API
              </button>
              <a
                href="/checkout"
                className="bg-[#6FAF3D] hover:bg-[#5F9B34] text-white w-full py-2 rounded-full text-center block"
              >
                Checkout
              </a>
            </div>
          </div>
        )}
      </main>
      <footer>
        <div className="py-8 text-center text-sm text-slate-600">
          <div className="inline-flex items-center gap-2 justify-center">
            <img src="/media/logo.jpg" alt="Standard Paneer logo" style={{ height: 28, width: 'auto' }} />
            <span>Ac {new Date().getFullYear()} Standard Paneer. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
