"use client"
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function OrderSuccessPage() {
  const sp = useSearchParams()
  const orderId = sp.get('orderId') || 'OK'
  const label = sp.get('label') || 'Saved/Entered Address'
  const total = sp.get('total')

  return (
    <div className="landing">
      <main className="max-w-3xl mx-auto px-4 py-12 space-y-6 text-center">
        <h1 className="text-3xl font-extrabold">Thank you!</h1>
        <div className="text-slate-700">Your order has been placed successfully.</div>
        <div className="inline-block text-left border rounded-xl bg-white px-6 py-4 shadow-sm">
          <div className="font-semibold">Order Details</div>
          <div className="mt-2 text-sm">
            <div><span className="text-slate-500">Order ID:</span> <span className="font-medium">{orderId}</span></div>
            {total && (
              <div><span className="text-slate-500">Total:</span> <span className="font-medium">{String.fromCharCode(8377)}{total}</span></div>
            )}
            <div><span className="text-slate-500">Shipping to:</span> <span className="font-medium">{label}</span></div>
          </div>
        </div>
        <div className="flex items-center gap-3 justify-center">
          <Link href={`/order/${encodeURIComponent(orderId)}`} className="border px-4 py-2 rounded-full">View Order</Link>
          <Link href="/products" className="bg-[#6FAF3D] hover:bg-[#5F9B34] text-white px-4 py-2 rounded-full">Continue Shopping</Link>
          <Link href="/" className="border px-4 py-2 rounded-full">Home</Link>
        </div>
      </main>
    </div>
  )
}
