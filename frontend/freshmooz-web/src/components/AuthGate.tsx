"use client"

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { clearAuth, getJwtExpiryMs, getToken, logout } from '@/lib/auth'

const PUBLIC_PATHS = new Set(['/login', '/register', '/reset-password', '/forgot-password'])
const PROTECTED_PREFIXES = ['/orders', '/order', '/checkout', '/profile']

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'))
}

export default function AuthGate() {
  const pathname = usePathname()

  useEffect(() => {
    const token = getToken()
    const protectedPath = isProtectedPath(pathname)
    const publicPath = PUBLIC_PATHS.has(pathname)

    if (!token) {
      if (protectedPath) logout()
      return
    }

    const expiryMs = getJwtExpiryMs(token)
    if (!expiryMs) {
      if (protectedPath) {
        logout()
        return
      }
      clearAuth()
      return
    }

    const delay = Math.max(expiryMs - Date.now(), 0)
    const timeoutId = window.setTimeout(() => {
      if (PUBLIC_PATHS.has(window.location.pathname) || !isProtectedPath(window.location.pathname)) {
        clearAuth()
        return
      }
      logout()
    }, delay)

    if (publicPath || !protectedPath) {
      return () => window.clearTimeout(timeoutId)
    }

    return () => window.clearTimeout(timeoutId)
  }, [pathname])

  return null
}
