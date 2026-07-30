"use client"

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import CartIcon from '@/components/CartIcon'
import UserMenu from '@/components/UserMenu'
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { fetchProducts } from '@/lib/api'
import { getFallbackStorefrontProducts, normalizeStorefrontProducts, storefrontCategories, type StorefrontProduct } from '@/lib/storefront'

const mainNav = [
  { label: 'Shop', href: '/products' },
  { label: 'Categories', href: '/#categories' },
  { label: 'Our Quality', href: '/#quality' },
  { label: 'Shop Online', href: '/#online-shopping' }
]

export default function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isElevated, setIsElevated] = useState(false)
  const [query, setQuery] = useState('')
  const [products, setProducts] = useState<StorefrontProduct[]>(getFallbackStorefrontProducts())

  useEffect(() => {
    fetchProducts()
      .then((items) => setProducts(normalizeStorefrontProducts(items as any)))
      .catch(() => setProducts(getFallbackStorefrontProducts()))
  }, [])

  useEffect(() => {
    const onScroll = () => setIsElevated(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setIsDrawerOpen(false)
    setIsSearchOpen(false)
    setQuery('')
  }, [pathname])

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return products.slice(0, 5)
    return products
      .filter((product) => `${product.name} ${product.category} ${product.blurb}`.toLowerCase().includes(normalized))
      .slice(0, 6)
  }, [products, query])

  return (
    <>
      <div className="top-announcement border-b border-[var(--color-border)] bg-[var(--color-primary-strong)] text-[0.82rem] text-white">
        <div className="storefront-shell flex min-h-10 min-w-0 items-center justify-center px-2 text-center font-medium leading-snug">
          <span className="hidden sm:inline">Quality products. Honest information. Easy ordering.</span>
          <span className="sm:hidden">Quality products. Easy ordering.</span>
        </div>
      </div>

      <header className={`sticky top-0 z-[var(--z-header)] border-b border-[var(--color-border)] bg-[rgba(251,248,241,0.92)] backdrop-blur transition-shadow ${isElevated ? 'shadow-[0_12px_30px_rgba(29,36,31,0.08)]' : ''}`}>
        <div className="storefront-shell flex min-h-[4.75rem] items-center gap-2 py-3 sm:gap-3">
          <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] bg-white lg:hidden"
                aria-label="Open navigation menu"
              >
                <MenuIcon />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col bg-[var(--color-page)] p-5 lg:hidden">
              <SheetHeader className="mb-6 pr-12">
                <img src="/media/logo.png" alt="FreshMooz logo" className="h-12 w-auto self-start" />
                <SheetTitle className="sr-only">FreshMooz navigation</SheetTitle>
                <SheetDescription className="sr-only">Browse FreshMooz shopping and account destinations.</SheetDescription>
              </SheetHeader>
              <button type="button" className="storefront-button-secondary mb-4 w-full" onClick={() => { setIsDrawerOpen(false); setIsSearchOpen(true) }}>
                <SearchIcon />
                Search products
              </button>
              <div className="mb-6 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-3">
                <UserMenu />
              </div>
              <nav className="grid gap-2">
                {mainNav.map((item) => (
                  <SheetClose asChild key={item.label}>
                    <Link href={item.href} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 py-3 font-semibold text-[var(--color-text)]">
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}
                <SheetClose asChild>
                  <Link href="/orders" className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 py-3 font-semibold text-[var(--color-text)]">
                    Account Orders
                  </Link>
                </SheetClose>
              </nav>
            </SheetContent>
          </Sheet>

          <Link href="/" className="min-w-0 shrink">
            <img src="/media/logo.png" alt="FreshMooz logo" className="h-11 max-w-[8rem] object-contain sm:h-16 sm:max-w-none" />
          </Link>

          <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
            {mainNav.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${pathname === '/products' && item.href === '/products' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text)] hover:bg-white'}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              className="hidden h-11 w-11 shrink-0 items-center justify-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-0 text-sm font-semibold text-[var(--color-primary-strong)] transition hover:border-[var(--color-primary)] min-[430px]:inline-flex sm:w-auto sm:px-4"
              aria-label="Search products"
              onClick={() => setIsSearchOpen(true)}
            >
              <SearchIcon />
              <span className="hidden sm:inline">Search</span>
            </button>
            <div className="hidden md:block">
              <UserMenu />
            </div>
            <CartIcon size="lg" showLabel={false} />
          </div>
        </div>

        <div className="border-t border-[var(--color-border)] bg-white/75">
          <div className="hide-scrollbar storefront-shell flex gap-3 overflow-x-auto py-3 text-sm font-medium text-[var(--color-text-muted)]">
            {storefrontCategories.map((category) => (
              <Link
                key={category.name}
                href={category.href}
                className="whitespace-nowrap rounded-full border border-[var(--color-border)] bg-white px-4 py-2 transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>
      </header>

      <CommandDialog
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        title="Search FreshMooz"
        description="Find products by name, category, or description."
      >
              <CommandInput
                value={query}
                onValueChange={setQuery}
                placeholder="Search paneer, butter, khoya, and more"
                autoFocus
              />
              <CommandList>
                <CommandEmpty>No matching products. Try a simpler search.</CommandEmpty>
                <CommandGroup heading={query ? 'Matching products' : 'Popular products'}>
                  {filteredProducts.map((product) => (
                  <CommandItem
                    key={product.id}
                    value={`${product.name} ${product.category} ${product.blurb}`}
                    onSelect={() => {
                      setIsSearchOpen(false)
                      router.push(`/product/${product.slug}`)
                    }}
                    className="flex items-center gap-4 p-3"
                  >
                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)]">
                      <img src={product.image || '/media/placeholder.svg'} alt={product.name} className="h-full w-full object-contain p-2" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">{product.category}</div>
                      <div className="truncate font-semibold text-[var(--color-primary-strong)]">{product.name}</div>
                      <div className="text-sm text-[var(--color-text-muted)]">{product.size}</div>
                    </div>
                    <div className="text-sm font-semibold text-[var(--color-primary)]">{product.currency === 'INR' ? `₹${product.price}` : `$${product.price}`}</div>
                  </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
      </CommandDialog>
    </>
  )
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}
