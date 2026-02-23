"use client"
import { useState } from 'react'
import { addToCart } from '@/lib/cart'

export default function AddToCartButton({ id, label = 'Add to Cart', className = '' }: { id: string; label?: string; className?: string }) {
  const [adding, setAdding] = useState(false)
  const [flash, setFlash] = useState(false)

  const onAdd = async () => {
    setAdding(true)
    try {
      addToCart(id, 1)
      setFlash(true)
      setTimeout(() => setFlash(false), 500)
    } finally {
      setAdding(false)
    }
  }

  return (
    <button
      onClick={onAdd}
      disabled={adding}
      className={`px-3 py-2 rounded-md text-sm disabled:opacity-60 ${flash ? 'btn-add-flash' : ''} ${className}`}
      aria-label={label}
      title={label}
    >
      {adding ? 'Adding…' : label}
    </button>
  )
}
