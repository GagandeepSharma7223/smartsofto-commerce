"use client"
import { useEffect, useRef, useState } from 'react'
import { addToCart } from '@/lib/cart'

export default function AddToCartButton({ id, label = 'Add to cart', className = '', disabled = false }: { id: string; label?: string; className?: string; disabled?: boolean }) {
  const [added, setAdded] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  const onAdd = () => {
    if (disabled) return
    addToCart(id, 1)
    setAdded(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setAdded(false), 1500)
  }

  return (
    <button
      type="button"
      onClick={onAdd}
      disabled={disabled}
      className={`inline-flex min-h-12 items-center justify-center rounded-full px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-55 ${added ? 'btn-add-flash' : ''} ${className}`}
      aria-label={added ? `${label}: added` : label}
    >
      <span aria-live="polite">{added ? 'Added' : label}</span>
    </button>
  )
}
