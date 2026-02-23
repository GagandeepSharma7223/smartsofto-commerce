"use client"
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { getUser, clearAuth } from '@/lib/auth'

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

  // Signed-out (or before mount): compact button with submenu
  if (!user) {
    return (
      <div className="relative" ref={ref}>
        <button onClick={() => setOpen(v => !v)} className="px-3 py-1.5 text-sm rounded-md border hover:bg-[#f6eef4] text-[#d9138a]">Sign in</button>
        {open && (
          <div className="absolute right-0 mt-2 w-40 bg-white border rounded-md shadow-lg p-2 text-sm z-50">
            <Link href="/login" className="block px-2 py-1 hover:bg-[#fff0f7] rounded">Login</Link>
            <Link href="/register" className="block px-2 py-1 hover:bg-[#fff0f7] rounded">Register</Link>
          </div>
        )}
      </div>
    )
  }

  const initials = (user.username || user.email || 'U').slice(0,1).toUpperCase()
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="h-9 w-9 inline-flex items-center justify-center rounded-full bg-[#fff0f7] border border-[#f0e6ee] text-sm font-bold text-[#d9138a] overflow-hidden"
        title={user.username}
        aria-label={`Account: ${user.username}`}
      >
        <span aria-hidden className="leading-none select-none">{initials}</span>
        <span className="sr-only">{user.username}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white border rounded-md shadow-lg p-2 text-sm z-50">
          <div className="px-2 py-1 text-slate-600">Signed in as <span className="font-medium">{user.username}</span></div>
          <div className="my-1 border-t" />
          <Link href="/orders" className="block px-2 py-1 hover:bg-[#fff0f7] rounded">My Orders</Link>
          <div className="my-1 border-t" />
          <button onClick={() => { clearAuth(); window.location.href = '/' }} className="w-full text-left px-2 py-1 hover:bg-[#fff0f7] rounded text-[#d9138a]">Logout</button>
        </div>
      )}
    </div>
  )
}
