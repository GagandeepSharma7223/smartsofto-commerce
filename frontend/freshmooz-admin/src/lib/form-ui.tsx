import type { ReactNode } from "react"

export function fieldClass(hasError: boolean, base = "w-full border rounded-md px-3 py-2") {
  return `${base} ${hasError ? "border-red-500 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200" : "border-slate-300"}`
}

export function FieldError({ error }: { error?: string | null }) {
  if (!error) return null
  return <div className="mt-1 text-xs text-red-600">{error}</div>
}

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function isBlank(value: string | null | undefined) {
  return !value || !value.trim()
}

export function hasNonNegativeNumber(value: string | number) {
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) && parsed >= 0
}
