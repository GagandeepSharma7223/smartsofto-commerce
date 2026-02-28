"use client"
import LoadingState from '@/components/LoadingState'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiCreateProduct } from '@/lib/api'
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

export default function AdminNewProductPage() {
  const user = useClientUser()
  const token = getToken()
  const router = useRouter()

  const [form, setForm] = useState({
    name: '',
    description: '',
    sku: '',
    price: '',
    costPrice: '',
    quantity: '0',
    type: 3,
    unit: 1,
    imageFileName: ''
  })
  const [err, setErr] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (user === undefined) {
    return (
      <div className="landing">
        <main className="max-w-3xl mx-auto px-4 py-10">
          <h1 className="text-2xl font-bold mb-4">Admin — New Product</h1>
          <div>Loading…</div>
        </main>
      </div>
    )
  }

  if (!user || (user.role && user.role.toLowerCase() !== 'admin')) {
    return (
      <div className="landing">
        <main className="max-w-3xl mx-auto px-4 py-10">
          <h1 className="text-2xl font-bold mb-4">Admin — New Product</h1>
          <div className="text-red-600">Not authorized. Please sign in with an Admin account.</div>
        </main>
      </div>
    )
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    setOk(null)
    setLoading(true)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        sku: form.sku.trim(),
        price: Number(form.price || 0),
        costPrice: Number(form.costPrice || 0),
        quantity: parseInt(form.quantity || '0', 10),
        type: form.type,
        unit: form.unit,
        imageFileName: form.imageFileName.trim() || undefined,
      }
      const res = await apiCreateProduct(payload, token || undefined)
      const msg = `Created product #${res.id ?? res.Id} (${res.name ?? res.Name})`
      setOk(msg)
      try { sessionStorage.setItem('flash', msg) } catch {}
      router.push('/products')
      // reset form just in case navigation is blocked
      setForm({ name:'', description:'', sku:'', price:'', costPrice:'', quantity:'0', type:3, unit:1, imageFileName:'' })
    } catch (e: any) {
      setErr(e?.message || 'Failed to create product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="landing">
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">New Product</h1>
          <Link href="/products" className="text-[#2B7CBF]">Back to Products</Link>
        </div>
        {err && <div className="mb-4 text-red-600">{err}</div>}
        {ok && <div className="mb-4 text-green-700">{ok}</div>}
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
              <select className="w-full border rounded-md px-3 py-2" value={form.type} onChange={e=>setForm({...form, type: parseInt(e.target.value, 10)})}>
                {types.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Unit</label>
              <select className="w-full border rounded-md px-3 py-2" value={form.unit} onChange={e=>setForm({...form, unit: parseInt(e.target.value, 10)})}>
                {units.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1">Image File Name (optional)</label>
            <input className="w-full border rounded-md px-3 py-2" placeholder="e.g., paneer.jpg" value={form.imageFileName} onChange={e=>setForm({...form, imageFileName:e.target.value})} />
            <div className="text-xs text-slate-600 mt-1">The image should be available under your configured image base (e.g., {process.env.NEXT_PUBLIC_IMAGE_BASE}/file.jpg).</div>
          </div>
          <button type="submit" disabled={loading || !form.name || !form.sku} className="bg-[#6FAF3D] hover:bg-[#5F9B34] text-white px-4 py-2 rounded-md">
            {loading ? 'Creating…' : 'Create Product'}
          </button>
        </form>
      </main>
    </div>
  )
}


