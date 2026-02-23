import ProductCard from '@/components/ProductCard'
import { fetchProducts } from '@/lib/api'
import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import ProductsClientVariants from './ProductsClientVariants'

export const metadata = {
  title: 'Products',
  description: 'Browse fresh paneer and dairy products.'
}

export const revalidate = 60

export default async function CatalogPage() {
  const FORCE_CLIENT = true
  return (
    <div className="landing">

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Products</h1>
            <p className="text-slate-600">Fresh paneer and dairy. Add items to your cart below.</p>
          </div>
          <Link href="/cart" className="border-2 border-[#4DB6E2] text-[#4DB6E2] px-4 py-2 rounded-full font-semibold hover:bg-[#e8f6fd]">View Cart</Link>
        </div>

        <ProductsClientVariants />
      </main>

      <footer className="landing-footer">
        <div className="text-center text-sm text-slate-600 py-8">© {new Date().getFullYear()} Standard Paneer. All rights reserved.</div>
      </footer>
    </div>
  )
}
