"use client"

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { clearAuth, getToken, isJwtExpired, logout } from '@/lib/auth'

const PUBLIC_PATHS = new Set(['/login', '/register', '/reset-password', '/forgot-password'])

export default function AuthGate() {
  const pathname = usePathname()

  useEffect(() => {
    const token = getToken()
    if (!token) return
    if (!isJwtExpired(token)) return
    if (PUBLIC_PATHS.has(pathname)) {
      clearAuth()
      return
    }
    logout()
  }, [pathname])

  return null
}
