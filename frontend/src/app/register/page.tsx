"use client"
import { useState } from 'react'
import { apiRegister } from '@/lib/api'
import { saveAuth } from '@/lib/auth'
import Link from 'next/link'

export default function RegisterPage() {
  const [form, setForm] = useState({ firstName:'', lastName:'', username:'', email:'', password:'' })
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    setLoading(true)
    try {
      const res = await apiRegister(form)
      saveAuth(res.token || res.Token, res.user || res.User)
      window.location.href = '/products'
    } catch (e: any) {
      setErr(e?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="landing">
      <main className="max-w-md mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-6">Create account</h1>
        {err && <div className="mb-4 text-red-600">{err}</div>}
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">First name</label>
              <input className="w-full border rounded-md px-3 py-2" value={form.firstName} onChange={e=>setForm({...form, firstName:e.target.value})} />
            </div>
            <div>
              <label className="block text-sm mb-1">Last name</label>
              <input className="w-full border rounded-md px-3 py-2" value={form.lastName} onChange={e=>setForm({...form, lastName:e.target.value})} />
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1">Username</label>
            <input required className="w-full border rounded-md px-3 py-2" value={form.username} onChange={e=>setForm({...form, username:e.target.value})} minLength={3} />
          </div>
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input type="email" required className="w-full border rounded-md px-3 py-2" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <input type="password" required className="w-full border rounded-md px-3 py-2" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} minLength={6} />
          </div>
          <button type="submit" disabled={loading || !form.username || !form.email || form.password.length < 6} className="bg-[#d9138a] hover:bg-[#c2107c] text-white px-4 py-2 rounded-md w-full disabled:opacity-60">{loading ? 'Creating…' : 'Create account'}</button>
        </form>
        <div className="mt-4 text-sm">
          Already have an account? <Link href="/login" className="text-[#d9138a]">Sign in</Link>
        </div>
      </main>
    </div>
  )
}
