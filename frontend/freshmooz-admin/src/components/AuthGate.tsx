"use client"

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { clearAuth, clearAuthTransition, getToken, isJwtExpired, logout } from '@/lib/auth'

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

    if (!isJwtExpired(token)) {
      clearAuthTransition()
      return
    }

    if (isPublicPath) {
      clearAuth()
      clearAuthTransition()
      return
    }

    logout()
  }, [pathname])

  return null
}
