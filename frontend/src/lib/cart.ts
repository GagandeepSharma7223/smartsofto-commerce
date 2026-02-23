"use client"

export type CartItem = { id: string; qty: number }

const KEY = 'cart'

export function readCart(): CartItem[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

export function writeCart(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items))
  window.dispatchEvent(new CustomEvent('cart:updated'))
}

export function addToCart(id: string | number, qty = 1) {
  const key = String(id)
  const items = readCart()
  const existing = items.find(i => i.id === key)
  if (existing) existing.qty += qty
  else items.push({ id: key, qty })
  writeCart(items)
}

export function setQty(id: string | number, qty: number) {
  const key = String(id)
  const items = readCart().map(i => i.id === key ? { ...i, qty } : i)
  writeCart(items)
}

export function removeFromCart(id: string | number) {
  const key = String(id)
  const items = readCart().filter(i => i.id !== key)
  writeCart(items)
}
