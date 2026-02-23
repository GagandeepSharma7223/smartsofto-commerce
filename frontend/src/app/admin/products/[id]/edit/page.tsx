"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiGetProduct, apiUpdateProduct } from '@/lib/api'
import { getToken, useClientUser } from '@/lib/auth'
import Link from 'next/link'

const types = [
  { value: 3, label: 'Finished Good' },
  { value: 1, label: 'Raw Material' },
  { value: 2, label: 'Packaging' },
  { value: 4, label: 'Other' },
]
const units = [
  { value: 1, label: 'Piece' },
  { value: 2, label: 'Kilogram' },
  { value: 3, label: 'Gram' },
  { value: 4, label: 'Liter' },
  { value: 5, label: 'Other' },
]

export default function AdminEditProductPage({ params }: { params: { id: string } }) {
  const user = useClientUser()
  const token = getToken()
  const router = useRouter()
  const id = params.id
  const [form, setForm] = useState<any>(null)
  const [err, setErr] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const p = await apiGetProduct(id)
        setForm({
          id: p.id ?? p.Id,
          name: p.name ?? p.Name ?? '',
          description: p.description ?? p.Description ?? '',
          sku: p.sku ?? p.SKU ?? '',
          price: String(p.price ?? p.Price ?? ''),
          costPrice: String(p.costPrice ?? p.CostPrice ?? ''),
          quantity: String(p.quantity ?? p.Quantity ?? ''),
          type: p.type ?? p.Type ?? 3,
          unit: p.unit ?? p.Unit ?? 1,
          imageFileName: p.imageFileName ?? p.ImageFileName ?? ''
        })
      } catch (e: any) { setErr(e?.message || 'Failed to load product') }
      finally { setLoading(false) }
    }
    load()
  }, [id])

  if (user === null) {
    return (
      <div className="landing"><main className="max-w-3xl mx-auto px-4 py-10"><h1 className="text-2xl font-bold mb-4">Admin — Edit Product</h1><div>Loading…</div></main></div>
    )
  }

  if (!user || user.role?.toLowerCase() !== 'admin') {
    return (
      <div className="landing"><main className="max-w-3xl mx-auto px-4 py-10"><div className="text-red-600">Not authorized.</div></main></div>
    )
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    setOk(null)
    try {
      const payload = {
        id: Number(form.id),
        name: form.name,
        description: form.description,
        sku: form.sku,
        price: Number(form.price || 0),
        costPrice: Number(form.costPrice || 0),
        quantity: parseInt(form.quantity || '0', 10),
        type: parseInt(form.type, 10),
        unit: parseInt(form.unit, 10),
        imageFileName: form.imageFileName || null
      }
      await apiUpdateProduct(id, payload, token || undefined)
      const msg = 'Product updated successfully'
      setOk(msg)
      try { sessionStorage.setItem('flash', msg) } catch {}
      router.push('/admin/products')
    } catch (e: any) {
      setErr(e?.message || 'Update failed')
    }
  }

  return (
    <div className="landing">
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Edit Product</h1>
          <Link href="/admin/products" className="text-[#d9138a]">Back</Link>
        </div>
        {loading && <div>Loading…</div>}
        {err && <div className="text-red-600 mb-4">{err}</div>}
        {ok && <div className="text-green-700 mb-4">{ok}</div>}
        {form && (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Name</label>
                <input className="w-full border rounded-md px-3 py-2" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm mb-1">SKU</label>
                <input className="w-full border rounded-md px-3 py-2" value={form.sku} onChange={e=>setForm({...form, sku:e.target.value})} required />
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1">Description</label>
              <textarea className="w-full border rounded-md px-3 py-2" rows={3} value={form.description} onChange={e=>setForm({...form, description:e.target.value})} />
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm mb-1">Price (₹)</label>
                <input type="number" step="0.01" className="w-full border rounded-md px-3 py-2" value={form.price} onChange={e=>setForm({...form, price:e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm mb-1">Cost Price (₹)</label>
                <input type="number" step="0.01" className="w-full border rounded-md px-3 py-2" value={form.costPrice} onChange={e=>setForm({...form, costPrice:e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm mb-1">Quantity</label>
                <input type="number" className="w-full border rounded-md px-3 py-2" value={form.quantity} onChange={e=>setForm({...form, quantity:e.target.value})} required />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Type</label>
                <select
                  className="w-full border rounded-md px-3 py-2"
                  value={form.type}
                  onChange={e=>setForm({...form, type: parseInt(e.target.value, 10)})}
                >
                  {types.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Unit</label>
                <select
                  className="w-full border rounded-md px-3 py-2"
                  value={form.unit}
                  onChange={e=>setForm({...form, unit: parseInt(e.target.value, 10)})}
                >
                  {units.map(u => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1">Image File Name</label>
              <input className="w-full border rounded-md px-3 py-2" value={form.imageFileName} onChange={e=>setForm({...form, imageFileName:e.target.value})} />
            </div>
            <button className="bg-[#d9138a] hover:bg-[#c2107c] text-white px-4 py-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#d9138a]">Save Changes</button>
          </form>
        )}
      </main>
    </div>
  )
}
