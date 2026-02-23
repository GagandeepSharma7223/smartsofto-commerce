"use client"
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { readCart } from '@/lib/cart'

function getQtyTotal() {
  const items = readCart()
  return items.reduce((sum, i) => sum + (i.qty || 0), 0)
}

type Props = {
  className?: string
  size?: 'sm' | 'lg'
  showLabel?: boolean
}

export default function CartIcon({ className = '', size = 'lg', showLabel = true }: Props) {
  const [count, setCount] = useState<number>(0)
  const [bump, setBump] = useState(false)

  useEffect(() => {
    const update = () => setCount(getQtyTotal())
    update()
    window.addEventListener('cart:updated', update as any)
    window.addEventListener('storage', update)
    return () => {
      window.removeEventListener('cart:updated', update as any)
      window.removeEventListener('storage', update)
    }
  }, [])

  // Bump animation on count change
  useEffect(() => {
    if (!count) return
    setBump(true)
    const t = setTimeout(() => setBump(false), 450)
    return () => clearTimeout(t)
  }, [count])

  const dim = size === 'lg' ? 'h-12 w-12' : 'h-9 w-9'
  const icon = size === 'lg' ? { w: 24, h: 24 } : { w: 18, h: 18 }

  return (
    <Link href="/cart" aria-label={`Cart`}
      className={`inline-flex items-center gap-2 ${className}`}>
      <span className={`relative inline-flex items-center justify-center rounded-full border border-[#E7E1D6] hover:bg-[#F1F7EC] ${dim}`}>
        <svg viewBox="0 0 24 24" width={icon.w} height={icon.h} aria-hidden="true">
          <path d="M7 4h-2m2 0h12l-1.5 9h-10.5m0 0l-1 6h11m-10 -6l-2 -9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {count > 0 && (
          <span className={`absolute -top-2 -right-2 bg-[#6FAF3D] text-white text-[10px] leading-none px-1.5 py-1 rounded-full font-bold shadow cart-badge ${bump ? 'bump' : ''}`}>
            {count}
          </span>
        )}
      </span>
      {showLabel && <span className="text-base font-medium">Cart</span>}
    </Link>
  )
}
