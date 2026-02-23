"use client"

import { useState } from 'react'
import Link from 'next/link'
import { apiResetPassword } from '@/lib/api'

export default function ResetPasswordPage() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    setOk(null)
    if (password !== confirm) {
      setErr('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await apiResetPassword(identifier, password)
      setOk('Password reset successful. You can now sign in.')
      setPassword('')
      setConfirm('')
    } catch (e: any) {
      setErr(e?.message || 'Reset failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="landing">
      <main className="max-w-md mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-6">Reset password</h1>
        {err && <div className="mb-4 text-red-600">{err}</div>}
        {ok && <div className="mb-4 text-green-700">{ok}</div>}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Username or email</label>
            <input
              className="w-full border rounded-md px-3 py-2"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">New password</label>
            <input
              type="password"
              className="w-full border rounded-md px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Confirm new password</label>
            <input
              type="password"
              className="w-full border rounded-md px-3 py-2"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !identifier || password.length < 6 || password !== confirm}
            className="bg-[#d9138a] hover:bg-[#c2107c] text-white px-4 py-2 rounded-md w-full disabled:opacity-60"
          >
            {loading ? 'Resetting…' : 'Reset password'}
          </button>
        </form>
        <div className="mt-4 text-sm">
          <Link href="/login" className="text-[#d9138a]">Back to sign in</Link>
        </div>
      </main>
    </div>
  )
}
