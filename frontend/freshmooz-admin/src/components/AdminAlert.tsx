type AdminAlertProps = {
  children: React.ReactNode
  tone?: 'success' | 'error'
  className?: string
}

export default function AdminAlert({ children, tone = 'success', className = '' }: AdminAlertProps) {
  const toneClass =
    tone === 'success'
      ? 'border-green-200 bg-green-50 text-green-800'
      : 'border-red-200 bg-red-50 text-red-700'

  return (
    <div className={`mb-4 inline-flex max-w-xl rounded-md border px-3 py-2 text-sm font-medium ${toneClass} ${className}`}>
      {children}
    </div>
  )
}
