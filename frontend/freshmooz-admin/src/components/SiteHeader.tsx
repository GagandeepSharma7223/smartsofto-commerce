"use client"
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import UserMenu from '@/components/UserMenu'
import { getUser } from '@/lib/auth'

export default function SiteHeader() {
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const showNavigation = mounted && isSignedIn
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
    : pathname?.startsWith('/clients') ? 'clients'
    : undefined

  useEffect(() => {
    setIsSignedIn(!!getUser())
    setMounted(true)
    const onChange = () => setIsSignedIn(!!getUser())
    window.addEventListener('auth:changed', onChange)
    return () => window.removeEventListener('auth:changed', onChange)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  const mobileLinkClass = 'rounded-lg px-3 py-2 text-sm font-semibold transition-colors hover:bg-slate-100'
  const mobileMenuClass = menuOpen
    ? 'max-h-96 translate-y-0 opacity-100'
    : 'pointer-events-none max-h-0 -translate-y-2 opacity-0'

  return (
    <header className="sticky top-0 z-50 bg-white/85 backdrop-blur border-b border-[#f0e9f2]">
      <div className="max-w-7xl mx-auto px-4 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2">
            <img src="/media/logo.png" alt="Standard Paneer logo" className="h-14 sm:h-16 md:h-20 w-auto" />
          </Link>
          {showNavigation ? (
            <>
              <nav className="hidden sm:flex items-center gap-6 font-semibold">
                <Link className="hover:underline" href="/" aria-current={active === 'dashboard' ? 'page' : undefined}>Dashboard</Link>
                <Link className="hover:underline" href="/products" aria-current={active === 'products' ? 'page' : undefined}>Products</Link>
                <Link className="hover:underline" href="/orders" aria-current={active === 'orders' ? 'page' : undefined}>Orders</Link>
                <Link className="hover:underline" href="/invoices" aria-current={active === 'invoices' ? 'page' : undefined}>Invoices</Link>
                <Link className="hover:underline" href="/inventory" aria-current={active === 'inventory' ? 'page' : undefined}>Inventory</Link>
                <Link className="hover:underline" href="/clients" aria-current={active === 'clients' ? 'page' : undefined}>Clients</Link>
                <Link className="hover:underline" href="/analytics" aria-current={active === 'analytics' ? 'page' : undefined}>Analytics</Link>
              </nav>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition-colors hover:bg-slate-50 sm:hidden"
                  aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((open) => !open)}
                >
                  <svg viewBox="0 0 24 24" className={`h-5 w-5 transition-transform duration-200 ${menuOpen ? 'rotate-90' : 'rotate-0'}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    {menuOpen ? (
                      <>
                        <path d="M6 6l12 12" />
                        <path d="M18 6L6 18" />
                      </>
                    ) : (
                      <>
                        <path d="M4 7h16" />
                        <path d="M4 12h16" />
                        <path d="M4 17h16" />
                      </>
                    )}
                  </svg>
                </button>
                <UserMenu />
              </div>
            </>
          ) : (
            <div />
          )}
        </div>
        {showNavigation && (
          <div className={`overflow-hidden transition-all duration-200 ease-out sm:hidden ${mobileMenuClass}`}>
            <nav className="mt-3 grid gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
              <Link className={mobileLinkClass} href="/" aria-current={active === 'dashboard' ? 'page' : undefined}>Dashboard</Link>
              <Link className={mobileLinkClass} href="/products" aria-current={active === 'products' ? 'page' : undefined}>Products</Link>
              <Link className={mobileLinkClass} href="/orders" aria-current={active === 'orders' ? 'page' : undefined}>Orders</Link>
              <Link className={mobileLinkClass} href="/invoices" aria-current={active === 'invoices' ? 'page' : undefined}>Invoices</Link>
              <Link className={mobileLinkClass} href="/inventory" aria-current={active === 'inventory' ? 'page' : undefined}>Inventory</Link>
              <Link className={mobileLinkClass} href="/clients" aria-current={active === 'clients' ? 'page' : undefined}>Clients</Link>
              <Link className={mobileLinkClass} href="/analytics" aria-current={active === 'analytics' ? 'page' : undefined}>Analytics</Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
