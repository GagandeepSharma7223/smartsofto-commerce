"use client"
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import UserMenu from '@/components/UserMenu'
import { getUser } from '@/lib/auth'

export default function SiteHeader() {
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const active:
    | 'dashboard'
    | 'products'
    | 'orders'
    | 'invoices'
    | 'analytics'
    | 'inventory'
    | 'clients'
    | undefined =
    pathname === '/' ? 'dashboard'
    : pathname?.startsWith('/products') ? 'products'
    : pathname?.startsWith('/orders') ? 'orders'
    : pathname?.startsWith('/invoices') ? 'invoices'
    : pathname?.startsWith('/analytics') ? 'analytics'
    : pathname?.startsWith('/inventory') ? 'inventory'
    : undefined

  useEffect(() => {
    setIsSignedIn(!!getUser())
    setMounted(true)
    const onChange = () => setIsSignedIn(!!getUser())
    window.addEventListener('auth:changed', onChange)
    return () => window.removeEventListener('auth:changed', onChange)
  }, [])

  return (
    <header className="sticky top-0 z-50 bg-white/85 backdrop-blur border-b border-[#f0e9f2]">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <img src="/media/logo.png" alt="Standard Paneer logo" className="h-14 sm:h-16 md:h-20 w-auto" />
          </Link>
        <nav className="hidden sm:flex items-center gap-6 font-semibold">
          <Link className="hover:underline" href="/" aria-current={active === 'dashboard' ? 'page' : undefined}>Dashboard</Link>
          <Link className="hover:underline" href="/products" aria-current={active === 'products' ? 'page' : undefined}>Products</Link>
          <Link className="hover:underline" href="/orders" aria-current={active === 'orders' ? 'page' : undefined}>Orders</Link>
          <Link className="hover:underline" href="/invoices" aria-current={active === 'invoices' ? 'page' : undefined}>Invoices</Link>
          <Link className="hover:underline" href="/inventory" aria-current={active === 'inventory' ? 'page' : undefined}>Inventory</Link>
          <Link className="hover:underline" href="/clients" aria-current={active === 'clients' ? 'page' : undefined}>Clients</Link>
          <Link className="hover:underline" href="/analytics" aria-current={active === 'analytics' ? 'page' : undefined}>Analytics</Link>
        </nav>
        <div className="flex items-center gap-3">
          <UserMenu />
        </div>
      </div>
    </header>
  )
}

