"use client"
import { useState } from 'react'
import { apiLogin } from '@/lib/api'
import { saveAuth } from '@/lib/auth'
import Link from 'next/link'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    setLoading(true)
    try {
      const res = await apiLogin(username, password)
      saveAuth(res.token || res.Token, res.user || res.User)
      window.location.href = '/products'
    } catch (e: any) {
      setErr(e?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="landing">
      <main className="max-w-md mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-6">Sign in</h1>
        {err && <div className="mb-4 text-red-600">{err}</div>}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Username</label>
            <input className="w-full border border-[#E7E1D6] rounded-xl px-3 py-2 bg-white" value={username} onChange={e=>setUsername(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <input type="password" className="w-full border border-[#E7E1D6] rounded-xl px-3 py-2 bg-white" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6} />
          </div>
          <button type="submit" disabled={loading || !username || password.length < 6} className="bg-[#6FAF3D] hover:bg-[#5F9B34] text-white px-5 py-2.5 rounded-full w-full disabled:opacity-60">{loading ? 'Signing in...' : 'Sign in'}</button>
        </form>
        <div className="mt-4 text-sm">
          New here? <Link href="/register" className="text-[#6FAF3D]">Create an account</Link>
        </div>
        <div className="mt-2 text-sm">
          Or <Link href="/checkout" className="text-[#6FAF3D]">checkout as guest</Link>
        </div>
        <div className="mt-2 text-sm">
          Forgot password? <Link href="/reset-password" className="text-[#6FAF3D]">Reset it</Link>
        </div>
      </main>
    </div>
  )
}
