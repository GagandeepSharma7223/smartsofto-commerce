"use client"
import { useState } from 'react'
import { apiRegister } from '@/lib/api'
import { saveAuth } from '@/lib/auth'
import Link from 'next/link'
import { FieldError, fieldClass, isBlank, isEmail } from '@/lib/form-ui'

type RegisterErrors = {
  username?: string
  email?: string
  password?: string
}

export default function RegisterPage() {
  const [form, setForm] = useState({ firstName:'', lastName:'', username:'', email:'', password:'' })
  const [errors, setErrors] = useState<RegisterErrors>({})
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const nextErrors: RegisterErrors = {}
    if (isBlank(form.username)) nextErrors.username = 'Username is required.'
    else if (form.username.trim().length < 3) nextErrors.username = 'Username must be at least 3 characters.'
    if (isBlank(form.email)) nextErrors.email = 'Email is required.'
    else if (!isEmail(form.email.trim())) nextErrors.email = 'Enter a valid email address.'
    if (isBlank(form.password)) nextErrors.password = 'Password is required.'
    else if (form.password.length < 6) nextErrors.password = 'Password must be at least 6 characters.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

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
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">First name</label>
              <input className={fieldClass(false)} value={form.firstName} onChange={e=>setForm({...form, firstName:e.target.value})} />
            </div>
            <div>
              <label className="block text-sm mb-1">Last name</label>
              <input className={fieldClass(false)} value={form.lastName} onChange={e=>setForm({...form, lastName:e.target.value})} />
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1">Username</label>
            <input className={fieldClass(!!errors.username)} value={form.username} onChange={e=>{ const value=e.target.value; setForm({...form, username:value}); setErrors(prev=>({...prev, username: value.trim().length >= 3 ? undefined : prev.username})) }} />
            <FieldError error={errors.username} />
          </div>
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input type="email" className={fieldClass(!!errors.email)} value={form.email} onChange={e=>{ const value=e.target.value; setForm({...form, email:value}); setErrors(prev=>({...prev, email: isEmail(value.trim()) ? undefined : prev.email})) }} />
            <FieldError error={errors.email} />
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <input type="password" className={fieldClass(!!errors.password)} value={form.password} onChange={e=>{ const value=e.target.value; setForm({...form, password:value}); setErrors(prev=>({...prev, password: value.length >= 6 ? undefined : prev.password})) }} />
            <FieldError error={errors.password} />
          </div>
          <button type="submit" disabled={loading || !form.username || !form.email || form.password.length < 6} className="bg-[#6FAF3D] hover:bg-[#5F9B34] text-white px-4 py-2 rounded-md w-full disabled:opacity-60">{loading ? 'Creating?' : 'Create account'}</button>
        </form>
        <div className="mt-4 text-sm">
          Already have an account? <Link href="/login" className="text-[#2B7CBF]">Sign in</Link>
        </div>
      </main>
    </div>
  )
}
