"use client"
import LoadingState from '@/components/LoadingState'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { apiForgotPassword, apiResetPassword } from '@/lib/api'
import { FieldError, fieldClass, isBlank, isEmail } from '@/lib/form-ui'

type RequestErrors = { email?: string }
type ResetErrors = { email?: string; newPassword?: string; confirmPassword?: string }

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="landing"><main className="max-w-md mx-auto px-4 py-10"><LoadingState /></main></div>}>
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
  const [requestErrors, setRequestErrors] = useState<RequestErrors>({})
  const [resetErrors, setResetErrors] = useState<ResetErrors>({})
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setEmail(emailParam)
    setToken(tokenParam)
  }, [emailParam, tokenParam])

  const onRequestLink = async (e: React.FormEvent) => {
    e.preventDefault()
    const nextErrors: RequestErrors = {}
    if (isBlank(email)) nextErrors.email = 'Email is required.'
    else if (!isEmail(email.trim())) nextErrors.email = 'Enter a valid email address.'
    setRequestErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

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
    const nextErrors: ResetErrors = {}
    if (isBlank(email)) nextErrors.email = 'Email is required.'
    else if (!isEmail(email.trim())) nextErrors.email = 'Enter a valid email address.'
    if (isBlank(newPassword)) nextErrors.newPassword = 'New password is required.'
    else if (newPassword.length < 6) nextErrors.newPassword = 'Password must be at least 6 characters.'
    if (isBlank(confirmPassword)) nextErrors.confirmPassword = 'Please confirm the password.'
    else if (newPassword !== confirmPassword) nextErrors.confirmPassword = 'Passwords do not match.'
    setResetErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setMessage(null)
    setError(null)

    if (!email || !token) {
      setError('Reset link is missing or invalid.')
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
          <form onSubmit={onRequestLink} noValidate className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Email</label>
              <input
                type="email"
                className={fieldClass(!!requestErrors.email)}
                value={email}
                onChange={e => { const value=e.target.value; setEmail(value); setRequestErrors(prev=>({...prev, email: isEmail(value.trim()) ? undefined : prev.email})) }}
              />
              <FieldError error={requestErrors.email} />
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
          <form onSubmit={onResetPassword} noValidate className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Email</label>
              <input
                type="email"
                className={fieldClass(!!resetErrors.email)}
                value={email}
                onChange={e => { const value=e.target.value; setEmail(value); setResetErrors(prev=>({...prev, email: isEmail(value.trim()) ? undefined : prev.email})) }}
              />
              <FieldError error={resetErrors.email} />
            </div>
            <div>
              <label className="block text-sm mb-1">New password</label>
              <input
                type="password"
                className={fieldClass(!!resetErrors.newPassword)}
                value={newPassword}
                onChange={e => { const value=e.target.value; setNewPassword(value); setResetErrors(prev=>({...prev, newPassword: value.length >= 6 ? undefined : prev.newPassword})) }}
              />
              <FieldError error={resetErrors.newPassword} />
            </div>
            <div>
              <label className="block text-sm mb-1">Confirm password</label>
              <input
                type="password"
                className={fieldClass(!!resetErrors.confirmPassword)}
                value={confirmPassword}
                onChange={e => { const value=e.target.value; setConfirmPassword(value); setResetErrors(prev=>({...prev, confirmPassword: newPassword && newPassword == value ? undefined : prev.confirmPassword})) }}
              />
              <FieldError error={resetErrors.confirmPassword} />
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
