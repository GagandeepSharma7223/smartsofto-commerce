"use client"

export type AuthUser = { id: string; username: string; email?: string; role?: string }

const KEY = 'auth_token'
const USER = 'auth_user'

export function saveAuth(token: string, user?: AuthUser) {
  localStorage.setItem(KEY, token)
  if (user) localStorage.setItem(USER, JSON.stringify(user))
  window.dispatchEvent(new CustomEvent('auth:changed'))
}

export function getToken(): string | null {
  return localStorage.getItem(KEY)
}

export function getUser(): AuthUser | null {
  try { return JSON.parse(localStorage.getItem(USER) || 'null') } catch { return null }
}

export function clearAuth() {
  localStorage.removeItem(KEY)
  localStorage.removeItem(USER)
  window.dispatchEvent(new CustomEvent('auth:changed'))
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
