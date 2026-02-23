"use client"

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { clearAuth, getToken, isJwtExpired, logout } from '@/lib/auth'

const PUBLIC_PATHS = new Set(['/login', '/register', '/reset-password', '/forgot-password'])
const PROTECTED_PREFIXES = ['/orders', '/order', '/checkout', '/profile']

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'))
}

export default function AuthGate() {
  const pathname = usePathname()

  useEffect(() => {
    if (PUBLIC_PATHS.has(pathname)) return
    const token = getToken()
    if (!isProtectedPath(pathname)) {
      if (token && isJwtExpired(token)) clearAuth()
      return
    }
    if (!token) {
      logout()
      return
    }
    if (isJwtExpired(token)) {
      logout()
    }
  }, [pathname])

  return null
}
