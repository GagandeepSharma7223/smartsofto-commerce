"use client"

type LoadingStateProps = {
  label?: string
  compact?: boolean
}

export default function LoadingState({ label = 'Loading...', compact = false }: LoadingStateProps) {
  if (compact) {
    return (
      <span className="inline-flex items-center gap-2 text-current">
        <span
          className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current"
          aria-hidden
        />
        <span className="text-sm font-medium">{label}</span>
      </span>
    )
  }

  return (
    <div className="flex min-h-[160px] flex-col items-center justify-center gap-3 text-slate-600">
      <span
        className="inline-block h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-[#6FAF3D]"
        aria-hidden
      />
      <span className="text-sm font-medium">{label}</span>
    </div>
  )
}
