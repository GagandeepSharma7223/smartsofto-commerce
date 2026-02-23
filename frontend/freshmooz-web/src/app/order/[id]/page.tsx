import Link from 'next/link'
import { apiGetOrder } from '@/lib/api'

export const revalidate = 0

function fmtInr(n?: number) {
  if (typeof n !== 'number') return ''
  try { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n) } catch { return `${String.fromCharCode(8377)}${n}` }
}

export default async function OrderViewPage({ params }: { params: { id: string } }) {
  const id = params.id
  let order: any = null
  let error: string | null = null
  try {
    order = await apiGetOrder(id)
  } catch (e: any) {
    error = e?.message || 'Failed to load order'
  }

  return (
    <div className="landing">
      <main className="max-w-4xl mx-auto px-4 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Order {order?.orderId || id}</h1>
          <Link href="/products" className="text-[#6FAF3D]">Continue Shopping</Link>
        </div>
        {error ? (
          <div className="text-red-600">{error}</div>
        ) : !order ? (
          <div>Loading…</div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            <section className="md:col-span-2 space-y-4">
              <div className="border rounded-xl bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-slate-500 text-sm">Status</div>
                    <div className="font-semibold">{order.status || 'Placed'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-500 text-sm">Total</div>
                    <div className="font-semibold">{fmtInr(order.total)}</div>
                  </div>
                </div>
              </div>
              <div className="border rounded-xl bg-white p-4 overflow-auto">
                <div className="font-semibold mb-2">Items</div>
                <table className="min-w-full text-sm">
                  <thead className="text-slate-600">
                    <tr>
                      <th className="text-left py-2">Product</th>
                      <th className="text-right py-2">Qty</th>
                      <th className="text-right py-2">Price</th>
                      <th className="text-right py-2">Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(order.items || []).map((l: any, idx: number) => (
                      <tr key={idx} className="border-t">
                        <td className="py-2">{l.name || l.productId}</td>
                        <td className="py-2 text-right">{l.quantity}</td>
                        <td className="py-2 text-right">{fmtInr(l.unitPrice)}</td>
                        <td className="py-2 text-right">{fmtInr(l.lineTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            <aside className="space-y-4">
              <div className="border rounded-xl bg-white p-4 text-sm">
                <div className="font-semibold mb-2">Shipping Address</div>
                <AddressView a={order.shippingAddress} />
              </div>
              <div className="border rounded-xl bg-white p-4 text-sm">
                <div className="font-semibold mb-2">Billing Address</div>
                <AddressView a={order.billingAddress || order.shippingAddress} />
              </div>
              <div className="border rounded-xl bg-white p-4 text-sm">
                <div className="flex items-center justify-between"><span>Subtotal</span><span>{fmtInr(order.subtotal)}</span></div>
                <div className="flex items-center justify-between"><span>Taxes</span><span>{fmtInr(order.taxes)}</span></div>
                <div className="flex items-center justify-between font-semibold"><span>Total</span><span>{fmtInr(order.total)}</span></div>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  )
}

function AddressView({ a }: { a: any }) {
  if (!a) return <div className="text-slate-600">Not available</div>
  const city = a.city || a.City
  const state = a.state || a.State
  const postal = a.postalCode || a.PostalCode
  const line1 = a.line1 || a.addressLine1 || a.AddressLine1
  const line2 = a.line2 || a.addressLine2 || a.AddressLine2
  const name = a.name || a.Name
  const phone = a.phone || a.Phone
  return (
    <div className="text-slate-700 space-y-1">
      {name && <div>{name}</div>}
      {line1 && <div>{line1}</div>}
      {line2 && <div>{line2}</div>}
      {(city || state || postal) && <div>{city}{city && state ? ', ' : ''}{state} {postal}</div>}
      <div>India</div>
      {phone && <div className="text-slate-500">{phone}</div>}
    </div>
  )
}

