"use client"
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { getUser, clearAuth } from '@/lib/auth'
import { clearCart } from '@/lib/cart'

export default function UserMenu() {
  const [user, setUser] = useState<ReturnType<typeof getUser> | null>(null)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setUser(getUser())
    const onChange = () => setUser(getUser())
    window.addEventListener('auth:changed', onChange)
    return () => window.removeEventListener('auth:changed', onChange)
  }, [])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return
      if (!ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [])

  if (!user) {
    return (
      <div className="relative" ref={ref}>
        <button onClick={() => setOpen(v => !v)} className="inline-flex min-h-11 items-center rounded-full border border-[var(--color-border)] bg-white px-4 text-sm font-semibold text-[var(--color-primary-strong)] transition hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]">Account</button>
        {open && (
          <div className="absolute right-0 z-50 mt-2 w-48 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-2 text-sm shadow-[var(--shadow-card)]">
            <Link href="/login" className="block rounded-[var(--radius-sm)] px-3 py-2 hover:bg-[var(--color-primary-soft)]">Login</Link>
            <Link href="/register" className="block rounded-[var(--radius-sm)] px-3 py-2 hover:bg-[var(--color-primary-soft)]">Register</Link>
          </div>
        )}
      </div>
    )
  }

  const initials = (user.username || user.email || 'U').slice(0, 1).toUpperCase()
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="inline-flex h-11 min-w-11 items-center justify-center overflow-hidden rounded-full border border-[var(--color-border)] bg-white px-3 text-sm font-bold text-[var(--color-primary)] transition hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]"
        title={user.username}
        aria-label={`Account: ${user.username}`}
      >
        <span aria-hidden className="leading-none select-none">{initials}</span>
        <span className="sr-only">{user.username}</span>
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-2 text-sm shadow-[var(--shadow-card)]">
          <div className="px-3 py-2 text-[var(--color-text-muted)]">Signed in as <span className="font-medium text-[var(--color-primary-strong)]">{user.username}</span></div>
          <div className="my-1 border-t border-[var(--color-border)]" />
          <Link href="/orders" className="block rounded-[var(--radius-sm)] px-3 py-2 hover:bg-[var(--color-primary-soft)]">My Orders</Link>
          <div className="my-1 border-t border-[var(--color-border)]" />
          <button onClick={() => { clearAuth(); clearCart(); window.location.href = '/' }} className="w-full rounded-[var(--radius-sm)] px-3 py-2 text-left text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]">Logout</button>
        </div>
      )}
    </div>
  )
}
