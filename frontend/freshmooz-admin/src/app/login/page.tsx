"use client"
import LoadingState from '@/components/LoadingState'
import { useState } from 'react'
import { apiLogin } from '@/lib/api'
import { saveAuth } from '@/lib/auth'
import Link from 'next/link'
import { FieldError, fieldClass, isBlank } from '@/lib/form-ui'

type LoginErrors = {
  username?: string
  password?: string
}

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<LoginErrors>({})
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const nextErrors: LoginErrors = {}
    if (isBlank(username)) nextErrors.username = 'Username is required.'
    if (isBlank(password)) nextErrors.password = 'Password is required.'
    else if (password.length < 6) nextErrors.password = 'Password must be at least 6 characters.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setErr(null)
    setLoading(true)
    try {
      const res = await apiLogin(username, password)
      saveAuth(res.token || res.Token, res.user || res.User)
      window.location.replace('/')
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
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Username</label>
            <input
              className={fieldClass(!!errors.username)}
              value={username}
              onChange={e => {
                const value = e.target.value
                setUsername(value)
                setErrors(prev => ({ ...prev, username: isBlank(value) ? prev.username : undefined }))
              }}
            />
            <FieldError error={errors.username} />
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <input
              type="password"
              className={fieldClass(!!errors.password)}
              value={password}
              onChange={e => {
                const value = e.target.value
                setPassword(value)
                setErrors(prev => ({ ...prev, password: value.length >= 6 ? undefined : prev.password }))
              }}
            />
            <FieldError error={errors.password} />
          </div>
          <button
            type="submit"
            disabled={loading || !username || password.length < 6}
            className="bg-[#6FAF3D] hover:bg-[#5F9B34] text-white px-4 py-2 rounded-md w-full disabled:opacity-60"
          >
            {loading ? <LoadingState label="Signing in" compact /> : 'Sign in'}
          </button>
        </form>
        <div className="mt-4 text-sm">
          New here? <Link href="/register" className="text-[#2B7CBF]">Create an account</Link>
        </div>
        <div className="mt-2 text-sm">
          Forgot password? <Link href="/reset-password" className="text-[#2B7CBF]">Reset it</Link>
        </div>
      </main>
    </div>
  )
}
