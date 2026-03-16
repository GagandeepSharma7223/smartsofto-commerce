"use client"

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { clearAuth, clearAuthTransition, getJwtExpiryMs, getToken, logout } from '@/lib/auth'

const PUBLIC_PATHS = new Set(['/login', '/register', '/reset-password', '/forgot-password'])

export default function AuthGate() {
  const pathname = usePathname()

  useEffect(() => {
    const isPublicPath = PUBLIC_PATHS.has(pathname)
    const token = getToken()

    if (!token) {
      if (isPublicPath) {
        clearAuthTransition()
        return
      }
      window.location.replace('/login')
      return
    }

    clearAuthTransition()

    const expiryMs = getJwtExpiryMs(token)
    if (!expiryMs) {
      if (isPublicPath) {
        clearAuth()
        clearAuthTransition()
        return
      }
      logout()
      return
    }

    const delay = Math.max(expiryMs - Date.now(), 0)
    const timeoutId = window.setTimeout(() => {
      if (PUBLIC_PATHS.has(window.location.pathname)) {
        clearAuth()
        clearAuthTransition()
        return
      }
      logout()
    }, delay)

    return () => window.clearTimeout(timeoutId)
  }, [pathname])

  return null
}
