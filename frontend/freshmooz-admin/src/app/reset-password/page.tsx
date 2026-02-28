"use client"
import LoadingState from '@/components/LoadingState'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { apiForgotPassword, apiResetPassword } from '@/lib/api'

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="landing"><main className="max-w-md mx-auto px-4 py-10">Loading...</main></div>}>
      <ResetPasswordContent />
    </Suspense>
  )
}

function ResetPasswordContent() {
  const params = useSearchParams()
  const router = useRouter()
  const emailParam = params.get('email') || ''
  const tokenParam = params.get('token') || ''
  const hasToken = Boolean(emailParam && tokenParam)

  const [email, setEmail] = useState(emailParam)
  const [token, setToken] = useState(tokenParam)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setEmail(emailParam)
    setToken(tokenParam)
  }, [emailParam, tokenParam])

  const onRequestLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setError(null)
    setLoading(true)
    try {
      await apiForgotPassword(email.trim())
      setMessage('If the account exists, a reset link has been sent.')
    } catch (err: any) {
      setError(err?.message || 'Failed to send reset link')
    } finally {
      setLoading(false)
    }
  }

  const onResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setError(null)

    if (!email || !token) {
      setError('Reset link is missing or invalid.')
      return
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await apiResetPassword({ email: email.trim(), token, newPassword })
      setMessage('Password reset successful. Redirecting to sign in...')
      setTimeout(() => router.push('/login'), 1200)
    } catch (err: any) {
      setError(err?.message || 'Reset failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="landing">
      <main className="max-w-md mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-6">Reset password</h1>
        {message && <div className="mb-4 text-green-700">{message}</div>}
        {error && <div className="mb-4 text-red-600">{error}</div>}

        {!hasToken ? (
          <form onSubmit={onRequestLink} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Email</label>
              <input
                type="email"
                className="w-full border rounded-md px-3 py-2"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !email}
              className="bg-[#6FAF3D] hover:bg-[#5F9B34] text-white px-4 py-2 rounded-md w-full disabled:opacity-60"
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
            <div className="text-sm">
              Back to <Link href="/login" className="text-[#2B7CBF]">sign in</Link>
            </div>
          </form>
        ) : (
          <form onSubmit={onResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Email</label>
              <input
                type="email"
                className="w-full border rounded-md px-3 py-2"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-1">New password</label>
              <input
                type="password"
                className="w-full border rounded-md px-3 py-2"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Confirm password</label>
              <input
                type="password"
                className="w-full border rounded-md px-3 py-2"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#6FAF3D] hover:bg-[#5F9B34] text-white px-4 py-2 rounded-md w-full disabled:opacity-60"
            >
              {loading ? 'Saving...' : 'Reset password'}
            </button>
            <div className="text-sm">
              Back to <Link href="/login" className="text-[#2B7CBF]">sign in</Link>
            </div>
          </form>
        )}
      </main>
    </div>
  )
}
