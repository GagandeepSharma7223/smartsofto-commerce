"use client"
import LoadingState from '@/components/LoadingState'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiAdminDashboard, apiAdminMonthlyRevenue } from '@/lib/api'
import { useClientUser } from '@/lib/auth'

type Summary = {
  products: number
  orders: number
  revenue7d: number
  revenue30d: number
  unpaid: number
  partial: number
}

type ChartPoint = { label: string; total: number }

export default function AdminDashboardPage() {
  const user = useClientUser()
  const [summary, setSummary] = useState<Summary | null>(null)
  const [chartPoints, setChartPoints] = useState<ChartPoint[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [dash, monthly] = await Promise.all([
          apiAdminDashboard(),
          apiAdminMonthlyRevenue(new Date().getFullYear())
        ])
        setSummary(mapSummary(dash))
        setChartPoints(mapMonthly(monthly))
      } catch (e: any) {
        setError(e?.message || 'Failed to load dashboard')
        setSummary(null)
      }
    }
    load()
  }, [])

  if (user === undefined) {
    return (
      <div className="landing">
        <main className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center px-4 py-10">
          <LoadingState label="Loading dashboard" />
        </main>
      </div>
    )
  }

  if (!user || user.role?.toLowerCase() !== 'admin') {
    return (
      <div className="landing">
        <main className="max-w-6xl mx-auto px-4 py-10">
          <h1 className="text-2xl font-bold mb-4">Admin — Dashboard</h1>
          <div className="text-red-600">Not authorized. Please sign in with an Admin account.</div>
        </main>
      </div>
    )
  }

  return (
    <div className="landing">
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        {error && <div className="text-red-600 mb-4">{error}</div>}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {metricCard('Products', summary?.products ?? '-', 'Manage products →', '/products')}
          {metricCard('Orders', summary?.orders ?? '-', 'Manage orders →', '/orders')}
          {metricCard('Revenue (7d)', formatCurrency(summary?.revenue7d), 'View analytics →', '/analytics')}
          {metricCard('Revenue (30d)', formatCurrency(summary?.revenue30d), 'View analytics →', '/analytics')}
          {metricCard('Unpaid invoices', summary?.unpaid ?? '-', 'Invoices →', '/invoices')}
          {metricCard('Partially paid', summary?.partial ?? '-', 'Invoices →', '/invoices')}
        </div>

        {chartPoints.length > 0 && (
          <div className="mt-8 border rounded-xl bg-white shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Revenue (monthly)</h2>
              <Link href="/analytics" className="text-[#2B7CBF] text-sm">Full analytics →</Link>
            </div>
            <MiniBarChart points={chartPoints} />
          </div>
        )}
      </main>
    </div>
  )
}

function metricCard(title: string, value: string | number, cta: string, href: string) {
  return (
    <Link
      href={href}
      className="block border rounded-xl p-5 bg-white shadow-sm transition-transform transition-shadow duration-200 ease-out hover:-translate-y-1 hover:shadow-lg hover:border-[#ffd1e8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6FAF3D]">
      <div className="text-slate-600 text-sm">{title}</div>
      <div className="text-3xl font-extrabold">{value}</div>
      <div className="text-[#2B7CBF] mt-2">{cta}</div>
    </Link>
  )
}

function mapSummary(d: any): Summary {
  return {
    products: d?.productsCount ?? 0,
    orders: d?.ordersCount ?? 0,
    revenue7d: Number(d?.revenue7d ?? 0),
    revenue30d: Number(d?.revenue30d ?? 0),
    unpaid: d?.unpaidInvoices ?? 0,
    partial: d?.partiallyPaidInvoices ?? 0,
  }
}

function mapMonthly(raw: any): ChartPoint[] {
  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return (raw || []).map((p: any) => ({
    label: labels[(Number(p?.month ?? 1) - 1 + 12) % 12],
    total: Number(p?.total ?? 0)
  }))
}

function formatCurrency(n?: number) {
  if (typeof n !== 'number' || Number.isNaN(n)) return '-'
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

function MiniBarChart({ points }: { points: ChartPoint[] }) {
  const max = Math.max(...points.map(p => p.total), 1)
  const height = 140
  const barW = 100 / points.length

  return (
    <div className="w-full">
      <svg viewBox={`0 0 100 ${height}`} className="w-full h-40">
        {points.map((p, idx) => {
          const barHeight = (p.total / max) * (height - 20)
          const x = idx * barW
          const y = height - barHeight - 20
          return (
            <g key={p.label}>
              <rect x={x + 1} y={y} width={barW - 3} height={barHeight} fill="#6FAF3D" opacity="0.8" rx="1.5" />
              <text x={x + barW / 2} y={height - 6} textAnchor="middle" fontSize="3" fill="#64748b">
                {p.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

