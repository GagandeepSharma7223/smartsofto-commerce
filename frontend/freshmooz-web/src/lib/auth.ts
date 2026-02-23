"use client"

export type AuthUser = { id: string; username: string; email?: string; role?: string }

const KEY = 'auth_token'
const USER = 'auth_user'

function storage() {
  if (typeof window === 'undefined') return null
  return window.localStorage
}

export function saveAuth(token: string, user?: AuthUser) {
  const store = storage()
  if (!store) return
  store.setItem(KEY, token)
  if (user) store.setItem(USER, JSON.stringify(user))
  window.dispatchEvent(new CustomEvent('auth:changed'))
}

export function getToken(): string | null {
  const store = storage()
  if (!store) return null
  return store.getItem(KEY)
}

function decodeBase64Url(input: string): string | null {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  try {
    if (typeof globalThis.atob === 'function') {
      return globalThis.atob(padded)
    }
  } catch {}
  try {
    // eslint-disable-next-line no-undef
    if (typeof Buffer !== 'undefined') {
      // eslint-disable-next-line no-undef
      return Buffer.from(padded, 'base64').toString('utf-8')
    }
  } catch {}
  return null
}

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length < 2) return null
  const decoded = decodeBase64Url(parts[1])
  if (!decoded) return null
  try {
    return JSON.parse(decoded) as Record<string, unknown>
  } catch {
    return null
  }
}

export function isJwtExpired(token: string, clockSkewSeconds = 30): boolean {
  const payload = decodeJwtPayload(token)
  const exp = payload && typeof payload.exp === 'number' ? payload.exp : null
  if (!exp) return true
  const now = Math.floor(Date.now() / 1000)
  return now >= exp - clockSkewSeconds
}

export function getJwtExpiryMs(token: string): number | null {
  const payload = decodeJwtPayload(token)
  const exp = payload && typeof payload.exp === 'number' ? payload.exp : null
  return exp ? exp * 1000 : null
}

export function getUser(): AuthUser | null {
  const store = storage()
  if (!store) return null
  try { return JSON.parse(store.getItem(USER) || 'null') } catch { return null }
}

export function clearAuth() {
  const store = storage()
  if (!store) return
  store.removeItem(KEY)
  store.removeItem(USER)
  window.dispatchEvent(new CustomEvent('auth:changed'))
}

export function logout(redirectTo = '/login') {
  clearAuth()
  if (typeof window === 'undefined') return
  window.location.href = redirectTo
}

export function getValidTokenOrLogout(): string | null {
  const token = getToken()
  if (!token) return null
  if (isJwtExpired(token)) {
    logout()
    return null
  }
  return token
}

// Hook: returns user after client mount to avoid SSR hydration mismatches
export function useClientUser() {
  const React = require('react') as typeof import('react')
  const [u, setU] = React.useState<AuthUser | null | undefined>(undefined) // undefined = loading, null = not signed in
  React.useEffect(() => {
    const update = () => setU(getUser())
    update()
    window.addEventListener('auth:changed', update)
    return () => window.removeEventListener('auth:changed', update)
  }, [])
  return u
}
