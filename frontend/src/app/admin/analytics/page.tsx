"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { apiAdminMonthlyRevenue, apiAdminTotalForRange } from '@/lib/api'
import { useClientUser } from '@/lib/auth'

export default function AdminAnalyticsPage() {
  const user = useClientUser()
  const [monthly, setMonthly] = useState<{ label: string; total: number }[]>([])
  const [kpi, setKpi] = useState<{ last7: number; last30: number } | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setErr(null)
      try {
        const year = new Date().getFullYear()
        const [m, seven, thirty] = await Promise.all([
          apiAdminMonthlyRevenue(year),
          apiAdminTotalForRange(dateNDaysAgo(7), todayIso()),
          apiAdminTotalForRange(dateNDaysAgo(30), todayIso())
        ])
        setMonthly(mapMonthly(m))
        setKpi({ last7: seven, last30: thirty })
      } catch (e: any) {
        setErr(e?.message || 'Failed to load analytics')
      }
    }
    load()
  }, [])

  if (user === null) {
    return <Shell title="Admin — Analytics"><div>Loading…</div></Shell>
  }
  if (!user || user.role?.toLowerCase() !== 'admin') {
    return <Shell title="Admin — Analytics"><div className="text-red-600">Not authorized.</div></Shell>
  }

  const max = useMemo(() => Math.max(...monthly.map(p => p.total), 1), [monthly])

  return (
    <Shell title="Analytics">
      {err && <div className="text-red-600 mb-3">{err}</div>}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <KpiCard label="Revenue (last 7 days)" value={kpi ? formatCurrency(kpi.last7) : '—'} />
        <KpiCard label="Revenue (last 30 days)" value={kpi ? formatCurrency(kpi.last30) : '—'} />
      </div>

      <div className="border rounded-xl bg-white shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Monthly revenue</h2>
        </div>
        {monthly.length === 0 ? (
          <div className="text-slate-600">No data yet.</div>
        ) : (
          <svg viewBox={`0 0 100 60`} className="w-full h-48">
            {monthly.map((p, idx) => {
              const barW = 100 / monthly.length
              const barH = (p.total / max) * 50
              const x = idx * barW
              const y = 55 - barH
              return (
                <g key={p.label}>
                  <rect x={x + 1} y={y} width={barW - 3} height={barH} fill="#d9138a" opacity="0.85" rx="1.5" />
                  <text x={x + barW / 2} y={59} textAnchor="middle" fontSize="3" fill="#64748b">
                    {p.label}
                  </text>
                </g>
              )
            })}
          </svg>
        )}
      </div>
    </Shell>
  )
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="landing">
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{title}</h1>
          <Link href="/admin" className="text-[#d9138a]">Back to dashboard</Link>
        </div>
        {children}
      </main>
    </div>
  )
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border rounded-xl bg-white shadow-sm p-4">
      <div className="text-sm text-slate-600">{label}</div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  )
}

function mapMonthly(raw: any): { label: string; total: number }[] {
  const labels = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
  return (raw || []).map((p: any) => ({
    label: labels[(Number(p.month ?? 1) - 1 + 12) % 12],
    total: Number(p.total ?? 0)
  }))
}

function formatCurrency(n?: number) {
  if (typeof n !== 'number' || isNaN(n)) return '—'
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

function dateNDaysAgo(days: number) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

function todayIso() {
  return new Date().toISOString()
}
