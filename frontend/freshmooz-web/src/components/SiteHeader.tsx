"use client"
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import CartIcon from '@/components/CartIcon'
import UserMenu from '@/components/UserMenu'
import { getUser } from '@/lib/auth'

export default function SiteHeader() {
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const active: 'home' | 'products' | 'cart' | 'orders' | undefined =
    pathname === '/' ? 'home'
    : pathname?.startsWith('/products') || pathname?.startsWith('/product/') ? 'products'
    : pathname?.startsWith('/cart') || pathname?.startsWith('/checkout') ? 'cart'
    : pathname?.startsWith('/orders') ? 'orders' : undefined
  useEffect(() => {
    setIsSignedIn(!!getUser())
    setMounted(true)
    const onChange = () => setIsSignedIn(!!getUser())
    window.addEventListener('auth:changed', onChange)
    return () => window.removeEventListener('auth:changed', onChange)
  }, [])
  return (
    <header className="sticky top-0 z-50 bg-white/85 backdrop-blur border-b border-[#f0e9f2]">
      <div className="max-w-7xl mx-auto px-4 py-0 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <img src="/media/logo.png" alt="FreshMooz logo" className="h-16 sm:h-20 md:h-24 w-auto" />
        </Link>
        <nav className="hidden sm:flex items-center gap-6 font-semibold text-[#2B2B2B]">
          <Link className="hover:underline" href="/products" aria-current={active === 'products' ? 'page' : undefined}>Products</Link>
          {mounted && isSignedIn && (
            <Link className="hover:underline" href="/orders" aria-current={active === 'orders' ? 'page' : undefined}>My Orders</Link>
          )}
        </nav>
        <div className="flex items-center gap-3">
          <UserMenu />
          <CartIcon size="lg" showLabel={false} />
        </div>
      </div>
    </header>
  )
}
