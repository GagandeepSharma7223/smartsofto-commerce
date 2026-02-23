"use client"

import { useEffect, useMemo, useState } from 'react'
import { readCart } from '@/lib/cart'
import { priceCart, checkout as apiCheckout, fetchProducts, apiGetMyClientProfile, apiUpsertMyClientProfile, apiListMyAddresses, apiAddMyAddress, apiUpdateMyAddress, apiDeleteMyAddress, ClientAddress } from '@/lib/api'
import { useClientUser, getToken } from '@/lib/auth'
import { useRouter } from 'next/navigation'

export default function CheckoutPage() {
  const router = useRouter()
  const user = useClientUser()

  const [items, setItems] = useState<{ id: string; qty: number }[]>([])
  const [pricing, setPricing] = useState<any | null>(null)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    shipping: {
      line1: '',
      line2: '',
      city: 'Gurugram',
      state: 'Haryana',
      pincode: ''
    },
    billingSameAsShipping: true,
    billing: {
      line1: '',
      line2: '',
      city: 'Gurugram',
      state: 'Haryana',
      pincode: ''
    }
  })

  // Saved/profile helpers
  const [saveProfile, setSaveProfile] = useState(true)
  const [savedAddresses, setSavedAddresses] = useState<ClientAddress[]>([])
  const [useSaved, setUseSaved] = useState(false)
  const [selectedAddrId, setSelectedAddrId] = useState<string>('')
  const selectedAddress = useMemo(() => useSaved ? savedAddresses.find(x => String(x.id) === String(selectedAddrId)) || null : null, [useSaved, selectedAddrId, savedAddresses])
  const [editing, setEditing] = useState<ClientAddress | null>(null)

  const mark = (key: string, message?: string) => {
    setErrors(prev => {
      const next = { ...prev }
      if (!message) delete next[key]
      else next[key] = message
      return next
    })
  }
  const has = (key: string) => !!errors[key]

  // Load cart
  useEffect(() => { setItems(readCart()) }, [])

  // Prefill user and profile + saved addresses
  useEffect(() => {
    if (user && typeof user === 'object') {
      setForm(f => ({
        ...f,
        name: f.name || (user as any).username || '',
        email: f.email || (user as any).email || ''
      }))
      const token = getToken()
      if (token) {
        apiGetMyClientProfile(token)
          .then(profile => {
            if (!profile) return
            setForm(f => ({
              ...f,
              name: f.name || (profile.name || ''),
              email: f.email || (profile.email || ''),
              phone: f.phone || (profile.phone || ''),
              shipping: {
                ...f.shipping,
                line1: f.shipping.line1 || (profile.addressLine1 || ''),
                line2: f.shipping.line2 || (profile.addressLine2 || ''),
                city: profile.city || f.shipping.city,
                state: profile.state || f.shipping.state,
                pincode: profile.postalCode || f.shipping.pincode
              }
            }))
          })
          .catch(() => {})
        apiListMyAddresses(token)
          .then(list => {
            const normalized = Array.isArray(list) ? list : []
            setSavedAddresses(normalized)
            if (normalized.length) {
              const preferred = normalized.find(a => a.isDefault) || normalized[0]
              setUseSaved(true)
              setSelectedAddrId(preferred ? String(preferred.id) : '')
            }
          })
          .catch(() => setSavedAddresses([]))
      }
    }
  }, [user])

  // Price cart via API
  useEffect(() => {
    if (!items.length) { setPricing(null); return }
    priceCart(items.map(i => ({ productId: i.id, qty: i.qty })))
      .then(setPricing)
      .catch(() => setPricing(null))
  }, [items])

  // Fetch products for summary lines
  useEffect(() => {
    fetchProducts()
      .then(list => setProducts(Array.isArray(list) ? list : []))
      .catch(() => setProducts([]))
  }, [])

  const localLines = useMemo(() => {
    if (!items.length || !products.length) return [] as Array<{ productId: string; name: string; description?: string; qty: number; lineTotal: number }>
    return items
      .map(i => {
        const p = products.find((x: any) => String(x.id) === String(i.id))
        if (!p) return null
        return { productId: String(p.id), name: p.name, description: p.description, qty: i.qty, lineTotal: Number(p.price) * i.qty }
      })
      .filter(Boolean) as Array<{ productId: string; name: string; description?: string; qty: number; lineTotal: number }>
  }, [items, products])

  const totals = useMemo(() => {
    if (pricing) return { subtotal: Number(pricing.subtotal ?? 0), taxes: Number(pricing.taxes ?? 0), total: Number(pricing.total ?? 0) }
    const subtotal = localLines.reduce((s, l) => s + l.lineTotal, 0)
    return { subtotal, taxes: 0, total: subtotal }
  }, [pricing, localLines])

  const validPin = (p: string) => /^\d{6}$/.test(p.replace(/[\s-]/g, '').trim())
  const validCity = (c: string) => /^gurugram$/i.test(c.trim())

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    try {
      const errs: Record<string, string> = {}
      const emailOk = /.+@.+\..+/.test(form.email)
      const phoneOk = /^\d{10}$/.test(form.phone.trim())
      if (!form.name.trim()) errs['name'] = 'Required'
      if (!emailOk) errs['email'] = 'Invalid email'
      if (!phoneOk) errs['phone'] = '10-digit number'
      if (useSaved && !selectedAddress) errs['shipping.address'] = 'Select a saved address'
      if (!form.shipping.line1.trim() && !(useSaved && selectedAddress)) errs['shipping.line1'] = 'Required'
      if (!validCity(form.shipping.city)) errs['shipping.city'] = 'Only Gurugram'
      if (form.shipping.state.trim().toLowerCase() !== 'haryana') errs['shipping.state'] = 'Must be Haryana'
      if (!validPin(form.shipping.pincode) && !selectedAddress) errs['shipping.pincode'] = 'Enter 6-digit pincode'
      if (!form.billingSameAsShipping) {
        if (!form.billing.line1.trim()) errs['billing.line1'] = 'Required'
        if (!validCity(form.billing.city)) errs['billing.city'] = 'Only Gurugram'
        if (form.billing.state.trim().toLowerCase() !== 'haryana') errs['billing.state'] = 'Must be Haryana'
        if (!validPin(form.billing.pincode)) errs['billing.pincode'] = 'Enter 6-digit pincode'
      }
      setErrors(errs)
      if (Object.keys(errs).length) { setLoading(false); return }

      const payload = items.map(i => ({ productId: i.id, qty: i.qty }))
      const shipSrc = (useSaved && selectedAddress) ? {
        line1: selectedAddress.addressLine1,
        line2: selectedAddress.addressLine2 || '',
        city: selectedAddress.city,
        state: selectedAddress.state,
        pincode: selectedAddress.postalCode
      } : form.shipping
      const shipping = { ...shipSrc, country: 'India' }
      const billing = form.billingSameAsShipping ? shipping : { ...form.billing, country: 'India' }
      const addressText = [shipping.line1, shipping.line2, `${shipping.city}, ${shipping.state} ${shipping.pincode}`, 'India'].filter(Boolean).join(', ')

      // Optional: save profile
      try {
        const token = getToken()
        if (token && user && saveProfile) {
          await apiUpsertMyClientProfile({
            name: form.name,
            email: form.email,
            phone: form.phone,
            addressLine1: shipping.line1,
            addressLine2: shipping.line2,
            city: shipping.city,
            state: shipping.state,
            postalCode: shipping.pincode,
            country: 'India'
          }, token)
        }
      } catch {}

      const res = await apiCheckout({
        name: form.name,
        email: form.email,
        address: addressText,
        phone: form.phone,
        shippingAddressId: selectedAddress ? selectedAddress.id : undefined,
        shippingAddress: shipping,
        billingAddress: billing,
        items: payload
      } as any)

      try { localStorage.removeItem('cart'); window.dispatchEvent(new CustomEvent('cart:updated')) } catch {}
      try { router.push(`/order/success?orderId=${encodeURIComponent(res?.orderId ?? res?.OrderId ?? '')}`) } catch {}
    } catch (err) {
      setMsg('Checkout failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const shippingPreview = useMemo(() => {
    const a = selectedAddress
    const line1 = a?.addressLine1 || form.shipping.line1
    const line2 = a?.addressLine2 || form.shipping.line2
    const city = a?.city || form.shipping.city
    const state = a?.state || form.shipping.state
    const pin = a?.postalCode || form.shipping.pincode
    const parts = [form.name || (user as any)?.username || '', line1, line2, `${city}, ${state} ${pin}`, 'India'].filter(Boolean)
    return parts.join('\n')
  }, [selectedAddress, form.shipping.line1, form.shipping.line2, form.shipping.city, form.shipping.state, form.shipping.pincode, form.name, user])

  return (
    <div className="landing">
      <main className="max-w-3xl mx-auto px-4 pt-4 pb-8 grid md:grid-cols-2 gap-8">
        <div>
          <h1 className="text-2xl font-bold mb-4">{user ? 'Checkout' : 'Guest Checkout'}</h1>
          <form id="checkoutForm" onSubmit={placeOrder} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Full name</label>
                <input className={`w-full border border-[#E7E1D6] rounded-xl px-3 py-2 ${has('name') ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-[#E7E1D6]'}`} value={form.name} onChange={e => { setForm({ ...form, name: e.target.value }); mark('name', e.target.value.trim() ? undefined : 'Required') }} />
              </div>
              <div>
                <label className="block text-sm mb-1">Email</label>
                <input type="email" className={`w-full border border-[#E7E1D6] rounded-xl px-3 py-2 ${has('email') ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-[#E7E1D6]'}`} value={form.email} onChange={e => { setForm({ ...form, email: e.target.value }); mark('email', /.+@.+\..+/.test(e.target.value) ? undefined : 'Invalid email') }} />
              </div>
              <div>
                <label className="block text-sm mb-1">Phone</label>
                <input type="tel" placeholder="10-digit mobile" className={`w-full border border-[#E7E1D6] rounded-xl px-3 py-2 ${has('phone') ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-[#E7E1D6]'}`} value={form.phone} onChange={e => { setForm({ ...form, phone: e.target.value }); mark('phone', /^\d{10}$/.test(e.target.value.trim()) ? undefined : '10-digit number') }} />
              </div>
            </div>

            {savedAddresses.length > 0 && (
              <div className="space-y-2">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={useSaved} onChange={e=>setUseSaved(e.target.checked)} />
                  Use a saved address
                </label>
                {useSaved && (
                  <select
                    className="w-full border border-[#E7E1D6] rounded-xl px-3 py-2 border-[#E7E1D6]"
                    value={selectedAddrId}
                    onChange={e=>{
                      const id = e.target.value; setSelectedAddrId(id)
                      const a = savedAddresses.find(x=>String(x.id)===String(id))
                      if (a){
                        setForm(f=>({
                          ...f,
                          shipping: {
                            ...f.shipping,
                            line1: a.addressLine1 || '',
                            line2: a.addressLine2 || '',
                            city: a.city || 'Gurugram',
                            state: a.state || 'Haryana',
                            pincode: a.postalCode || ''
                          }
                        }))
                      }
                    }}
                  >
                    <option value="">Select an address…</option>
                    {savedAddresses.map(a=> (
                      <option key={a.id} value={String(a.id)}>{a.label || `${a.addressLine1}, ${a.city}`}</option>
                    ))}
                  </select>
                  {has('shipping.address') && (
                    <div className="text-xs text-red-600 mt-1">{errors['shipping.address']}</div>
                  )}
                )}
                {useSaved && selectedAddress && (
                  <div className="flex items-center gap-3 text-sm">
                    <button type="button" className="text-[#6FAF3D] underline" onClick={()=>setEditing(selectedAddress)}>Edit</button>
                    <button type="button" className="text-red-600 underline" onClick={async()=>{
                      const token = getToken(); if(!token) return; if(!confirm('Delete this address?')) return;
                      try { await apiDeleteMyAddress(selectedAddress.id, token); setSavedAddresses(list=>list.filter(x=>String(x.id)!==String(selectedAddress.id))); if(selectedAddrId===String(selectedAddress.id)){ setSelectedAddrId(''); setUseSaved(false) } } catch(e){ alert('Delete failed') }
                    }}>Delete</button>
                  </div>
                )}
                {!useSaved && (
                  <AddAddressInline onAdded={(addr)=>{ setSavedAddresses(list=>[...list, addr]); setUseSaved(true); setSelectedAddrId(String(addr.id)) }} />
                )}
              </div>
            )}

            <div className="space-y-3">
              <div className="font-semibold">Shipping Address (Gurugram only)</div>
              <input disabled={useSaved}
                className={`w-full border border-[#E7E1D6] rounded-xl px-3 py-2 ${useSaved ? 'bg-[#f2f0ea]' : has('shipping.line1') ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-[#E7E1D6]'}`}
                placeholder="Address line 1" value={form.shipping.line1} onChange={e=>{ setForm({...form, shipping: { ...form.shipping, line1: e.target.value }}); mark('shipping.line1', e.target.value.trim() ? undefined : 'Required') }} />
              <input disabled={useSaved}
                className={`w-full border border-[#E7E1D6] rounded-xl px-3 py-2 ${useSaved ? 'bg-[#f2f0ea] border-[#E7E1D6]' : 'border-[#E7E1D6]'}`}
                placeholder="Address line 2 (optional)" value={form.shipping.line2} onChange={e=>setForm({...form, shipping: { ...form.shipping, line2: e.target.value }})} />
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs mb-1">City</label>
                  <select disabled={useSaved} className={`w-full border border-[#E7E1D6] rounded-xl px-3 py-2 ${useSaved ? 'bg-[#f2f0ea] border-[#E7E1D6]' : has('shipping.city') ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-[#E7E1D6]'}`} value={form.shipping.city} onChange={e=>{ setForm({...form, shipping: { ...form.shipping, city: e.target.value }}); mark('shipping.city', /^gurugram$/i.test(e.target.value) ? undefined : 'Only Gurugram') }}>
                    <option value="Gurugram">Gurugram</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1">State</label>
                  <input disabled={useSaved} className={`w-full border border-[#E7E1D6] rounded-xl px-3 py-2 ${useSaved ? 'bg-[#f2f0ea] border-[#E7E1D6]' : has('shipping.state') ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-[#E7E1D6]'}`} value={form.shipping.state} onChange={e=>{ setForm({...form, shipping: { ...form.shipping, state: e.target.value }}); mark('shipping.state', e.target.value.trim().toLowerCase()==='haryana' ? undefined : 'Must be Haryana') }} />
                </div>
                <div>
                  <label className="block text-xs mb-1">Pincode</label>
                  <input disabled={useSaved} className={`w-full border border-[#E7E1D6] rounded-xl px-3 py-2 ${useSaved ? 'bg-[#f2f0ea] border-[#E7E1D6]' : has('shipping.pincode') ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-[#E7E1D6]'}`} placeholder="6-digit pincode" value={form.shipping.pincode} onChange={e=>{ const v = e.target.value; setForm({...form, shipping: { ...form.shipping, pincode: v }}); mark('shipping.pincode', /^\d{6}$/.test(v.replace(/[\s-]/g, '').trim()) ? undefined : 'Enter 6-digit pincode') }} />
                </div>
              </div>
              <div className="text-xs text-slate-600">Country: India (currently delivering only within Gurugram)</div>
            </div>

            <div className="space-y-3">
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.billingSameAsShipping} onChange={e=>setForm({...form, billingSameAsShipping: e.target.checked})} />
                Billing same as shipping
              </label>
              {!form.billingSameAsShipping && (
                <div className="space-y-3">
                  <div className="font-semibold">Billing Address (Gurugram only)</div>
                  <input className={`w-full border border-[#E7E1D6] rounded-xl px-3 py-2 ${has('billing.line1') ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-[#E7E1D6]'}`} placeholder="Address line 1" value={form.billing.line1} onChange={e=>{ setForm({...form, billing: { ...form.billing, line1: e.target.value }}); mark('billing.line1', e.target.value.trim() ? undefined : 'Required') }} />
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs mb-1">City</label>
                      <select className={`w-full border border-[#E7E1D6] rounded-xl px-3 py-2 ${has('billing.city') ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-[#E7E1D6]'}`} value={form.billing.city} onChange={e=>{ setForm({...form, billing: { ...form.billing, city: e.target.value }}); mark('billing.city', /^gurugram$/i.test(e.target.value) ? undefined : 'Only Gurugram') }}>
                        <option value="Gurugram">Gurugram</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs mb-1">State</label>
                      <input className={`w-full border border-[#E7E1D6] rounded-xl px-3 py-2 ${has('billing.state') ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-[#E7E1D6]'}`} value={form.billing.state} onChange={e=>{ setForm({...form, billing: { ...form.billing, state: e.target.value }}); mark('billing.state', e.target.value.trim().toLowerCase()==='haryana' ? undefined : 'Must be Haryana') }} />
                    </div>
                    <div>
                      <label className="block text-xs mb-1">Pincode</label>
                      <input className={`w-full border border-[#E7E1D6] rounded-xl px-3 py-2 ${has('billing.pincode') ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-[#E7E1D6]'}`} placeholder="6-digit pincode" value={form.billing.pincode} onChange={e=>{ const v = e.target.value; setForm({...form, billing: { ...form.billing, pincode: v }}); mark('billing.pincode', /^\d{6}$/.test(v.replace(/[\s-]/g, '').trim()) ? undefined : 'Enter 6-digit pincode') }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={saveProfile} onChange={e=>setSaveProfile(e.target.checked)} />
              Save this address to my profile
            </label>

            {msg && <div className="text-red-600 text-sm">{msg}</div>}
          </form>

          {!!editing && (
            <EditAddressInline address={editing} onSaved={(addr)=>{ setSavedAddresses(list=>list.map(x=>String(x.id)===String(addr.id)?addr:x)); setEditing(null) }} onCancel={()=>setEditing(null)} />
          )}
        </div>

        <aside>
          <div className="border border-[#E7E1D6] rounded-xl p-4 space-y-3">
            <div className="font-semibold">Summary</div>
            <textarea className="w-full text-xs bg-slate-50 border rounded p-2" rows={5} readOnly value={shippingPreview} />
            <div className="divide-y">
              {localLines.map(l => (
                <div key={l.productId} className="py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>{l.name} × {l.qty}</span>
                    <span>₹{l.lineTotal}</span>
                  </div>
                  {l.description ? <div className="text-xs text-slate-500">{l.description}</div> : null}
                </div>
              ))}
            </div>
            <div className="text-sm text-slate-700">Items: {items.reduce((s, i) => s + i.qty, 0)}</div>
            <div className="text-sm text-slate-700">Subtotal: ₹{totals.subtotal}</div>
            <div className="text-sm text-slate-700">Taxes: ₹{totals.taxes}</div>
            <div className="font-semibold">Total: ₹{totals.total}</div>
          </div>
        </aside>
        <div className="md:col-span-2 mt-6">
          <button type="submit" form="checkoutForm" disabled={loading} className="bg-[#6FAF3D] hover:bg-[#5F9B34] text-white px-4 py-2 rounded-full w-full md:w-auto">{loading ? 'Placing…' : 'Place order'}</button>
        </div>
      </main>
    </div>
  )
}

function AddAddressInline({ onAdded }: { onAdded: (addr: ClientAddress) => void }) {
  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState('')
  const [line1, setLine1] = useState('')
  const [line2, setLine2] = useState('')
  const [state, setState] = useState('Haryana')
  const [pincode, setPincode] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const token = typeof window !== 'undefined' ? (require('@/lib/auth') as any).getToken()() : null

  const valid = () => line1.trim() && /^gurugram$/i.test('Gurugram') && state.trim().toLowerCase()==='haryana' && /^\d{6}$/.test(pincode.replace(/[\s-]/g, '').trim())

  const onSave = async () => {
    setErr(null)
    if (!token) { setErr('Sign in required'); return }
    if (!valid()) { setErr('Address must be in Gurugram, Haryana with 6-digit pincode'); return }
    setSaving(true)
    try{
      const payload = { label, addressLine1: line1, addressLine2: line2, city: 'Gurugram', state, postalCode: pincode, phone, country: 'India', isDefault: true }
      const addr = await apiAddMyAddress(payload as any, token)
      onAdded(addr)
      setOpen(false)
      setLabel(''); setLine1(''); setLine2(''); setPincode(''); setPhone('')
    }catch(e:any){ setErr(e?.message||'Failed to save') }
    finally{ setSaving(false) }
  }

  if (!open) return <button type="button" className="text-[#6FAF3D] underline text-sm" onClick={()=>setOpen(true)}>+ Add new address</button>
  return (
    <div className="border border-[#E7E1D6] rounded-xl p-3 space-y-2">
      <div className="grid md:grid-cols-2 gap-2">
        <input className="border border-[#E7E1D6] rounded-xl px-3 py-2" placeholder="Label (e.g., Home, Office)" value={label} onChange={e=>setLabel(e.target.value)} />
        <input className="border border-[#E7E1D6] rounded-xl px-3 py-2" placeholder="Phone (optional)" value={phone} onChange={e=>setPhone(e.target.value)} />
      </div>
      <input className="border border-[#E7E1D6] rounded-xl px-3 py-2" placeholder="Address line 1" value={line1} onChange={e=>setLine1(e.target.value)} />
      <input className="border border-[#E7E1D6] rounded-xl px-3 py-2" placeholder="Address line 2 (optional)" value={line2} onChange={e=>setLine2(e.target.value)} />
      <div className="grid grid-cols-3 gap-2">
        <input className="border border-[#E7E1D6] rounded-xl px-3 py-2 bg-[#f2f0ea]" value={'Gurugram'} disabled />
        <input className="border border-[#E7E1D6] rounded-xl px-3 py-2" value={state} onChange={e=>setState(e.target.value)} />
        <input className="border border-[#E7E1D6] rounded-xl px-3 py-2" placeholder="6-digit pincode" value={pincode} onChange={e=>setPincode(e.target.value)} />
      </div>
      {err && <div className="text-red-600 text-sm">{err}</div>}
      <div className="flex items-center gap-2">
        <button type="button" className="bg-[#6FAF3D] text-white px-3 py-1 rounded" disabled={saving} onClick={onSave}>{saving?'Saving...':'Save address'}</button>
        <button type="button" className="border px-3 py-1 rounded" onClick={()=>{setOpen(false); setErr(null)}}>Cancel</button>
      </div>
    </div>
  )
}

function EditAddressInline({ address, onSaved, onCancel }: { address: ClientAddress, onSaved: (addr: ClientAddress)=>void, onCancel: ()=>void }) {
  const [label, setLabel] = useState(address.label || '')
  const [line1, setLine1] = useState(address.addressLine1)
  const [line2, setLine2] = useState(address.addressLine2 || '')
  const [state, setState] = useState(address.state || 'Haryana')
  const [pincode, setPincode] = useState(address.postalCode || '')
  const [phone, setPhone] = useState(address.phone || '')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const token = typeof window !== 'undefined' ? (require('@/lib/auth') as any).getToken()() : null

  const valid = () => line1.trim() && state.trim().toLowerCase()==='haryana' && /^\d{6}$/.test(pincode.replace(/[\s-]/g, '').trim())
  const onSave = async () => {
    setErr(null)
    if (!token) { setErr('Sign in required'); return }
    if (!valid()) { setErr('Address must be in Gurugram, Haryana with 6-digit pincode'); return }
    setSaving(true)
    try{
      const payload = { label, addressLine1: line1, addressLine2: line2, city: 'Gurugram', state, postalCode: pincode, phone, country: 'India', isDefault: true }
      const updated = await apiUpdateMyAddress(address.id, payload as any, token)
      onSaved(updated)
    }catch(e:any){ setErr(e?.message||'Failed to save') }
    finally{ setSaving(false) }
  }
  return (
    <div className="border border-[#E7E1D6] rounded-xl p-3 space-y-2 mt-2">
      <div className="grid md:grid-cols-2 gap-2">
        <input className="border border-[#E7E1D6] rounded-xl px-3 py-2" placeholder="Label" value={label} onChange={e=>setLabel(e.target.value)} />
        <input className="border border-[#E7E1D6] rounded-xl px-3 py-2" placeholder="Phone (optional)" value={phone} onChange={e=>setPhone(e.target.value)} />
      </div>
      <input className="border border-[#E7E1D6] rounded-xl px-3 py-2" placeholder="Address line 1" value={line1} onChange={e=>setLine1(e.target.value)} />
      <input className="border border-[#E7E1D6] rounded-xl px-3 py-2" placeholder="Address line 2 (optional)" value={line2} onChange={e=>setLine2(e.target.value)} />
      <div className="grid grid-cols-3 gap-2">
        <input className="border border-[#E7E1D6] rounded-xl px-3 py-2 bg-[#f2f0ea]" value={'Gurugram'} disabled />
        <input className="border border-[#E7E1D6] rounded-xl px-3 py-2" value={state} onChange={e=>setState(e.target.value)} />
        <input className="border border-[#E7E1D6] rounded-xl px-3 py-2" placeholder="6-digit pincode" value={pincode} onChange={e=>setPincode(e.target.value)} />
      </div>
      {err && <div className="text-red-600 text-sm">{err}</div>}
      <div className="flex items-center gap-2">
        <button type="button" className="bg-[#6FAF3D] text-white px-3 py-1 rounded" disabled={saving} onClick={onSave}>{saving?'Saving...':'Save changes'}</button>
        <button type="button" className="border px-3 py-1 rounded" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}
