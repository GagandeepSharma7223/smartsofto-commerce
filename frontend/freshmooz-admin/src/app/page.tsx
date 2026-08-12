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
type MetricTone = 'neutral' | 'positive' | 'warning' | 'danger'

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
      <main className="mx-auto max-w-7xl px-4 py-6 sm:py-7">
        <div className="mb-5">
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">A quick view of current sales and operations.</p>
        </div>
        {error && (
          <div className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700" role="alert">
            {error}
          </div>
        )}
        <section aria-label="Dashboard summary" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metricCard('Orders', summary?.orders ?? '-', 'Manage orders', '/orders')}
          {metricCard('Revenue (30 days)', formatCurrency(summary?.revenue30d), 'View analytics', '/analytics', 'positive')}
          {metricCard('Unpaid invoices', summary?.unpaid ?? '-', 'Review invoices', '/invoices', 'danger')}
          {metricCard('Partially paid invoices', summary?.partial ?? '-', 'Review invoices', '/invoices', 'warning')}
          {metricCard('Products', summary?.products ?? '-', 'Manage products', '/products')}
          {metricCard('Revenue (7 days)', formatCurrency(summary?.revenue7d), 'View analytics', '/analytics', 'positive')}
        </section>

        {chartPoints.length > 0 && (
          <section className="mt-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-labelledby="monthly-revenue-title">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 id="monthly-revenue-title" className="text-base font-semibold text-slate-950">Monthly revenue</h2>
                <p className="mt-0.5 text-xs text-slate-500">{new Date().getFullYear()} revenue by month</p>
              </div>
              <Link href="/analytics" className="shrink-0 text-sm font-medium text-[#2B7CBF] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6FAF3D] focus-visible:ring-offset-2">
                Full analytics <span aria-hidden>→</span>
              </Link>
            </div>
            <MiniBarChart points={chartPoints} />
          </section>
        )}
      </main>
    </div>
  )
}

function metricCard(title: string, value: string | number, cta: string, href: string, tone: MetricTone = 'neutral') {
  const toneClasses: Record<MetricTone, string> = {
    neutral: 'bg-white',
    positive: 'bg-[#f4f9ef]',
    warning: 'bg-amber-50/70',
    danger: 'bg-rose-50/70',
  }

  return (
    <Link
      href={href}
      className={`flex min-h-36 flex-col rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6FAF3D] focus-visible:ring-offset-2 ${toneClasses[tone]}`}>
      <div className="text-sm font-medium text-slate-600">{title}</div>
      <div className="mt-2 text-3xl font-extrabold leading-none tracking-tight text-slate-950 sm:text-[2rem]">{value}</div>
      <div className="mt-auto pt-4 text-sm font-medium text-[#2B7CBF]">
        {cta} <span aria-hidden>→</span>
      </div>
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
  const width = 960
  const height = 230
  const margin = { top: 18, right: 12, bottom: 32, left: 64 }
  const chartWidth = width - margin.left - margin.right
  const chartHeight = height - margin.top - margin.bottom
  const slotWidth = chartWidth / points.length
  const currency = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
    notation: 'compact',
  })
  const gridLines = [0, 0.5, 1]

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto min-w-[640px] w-full" role="img" aria-label="Monthly revenue bar chart">
        {gridLines.map((ratio) => {
          const y = margin.top + chartHeight - ratio * chartHeight
          return (
            <g key={ratio}>
              <line x1={margin.left} x2={width - margin.right} y1={y} y2={y} stroke="#e2e8f0" strokeWidth="1" />
              <text x={margin.left - 10} y={y + 4} textAnchor="end" fontSize="11" fill="#64748b">
                {currency.format(max * ratio)}
              </text>
            </g>
          )
        })}
        {points.map((p, idx) => {
          const barHeight = (p.total / max) * chartHeight
          const barWidth = Math.min(slotWidth * 0.58, 48)
          const x = margin.left + idx * slotWidth + (slotWidth - barWidth) / 2
          const y = margin.top + chartHeight - barHeight
          return (
            <g key={p.label}>
              <title>{`${p.label}: ${formatCurrency(p.total)}`}</title>
              <rect x={x} y={y} width={barWidth} height={barHeight} fill="#6FAF3D" rx="5" />
              <text x={x + barWidth / 2} y={height - 10} textAnchor="middle" fontSize="12" fontWeight="500" fill="#475569">
                {p.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

