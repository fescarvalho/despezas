'use client'

import { formatCurrency } from '@/lib/formatters'

interface DashboardCardProps {
  label: string
  value: number
  icon: string
  variant: 'balance' | 'income' | 'expense' | 'invoice'
  sub?: string
}

const VARIANT_MAP = {
  balance: { valueClass: 'accent', prefix: '' },
  income: { valueClass: 'positive', prefix: '+' },
  expense: { valueClass: 'negative', prefix: '-' },
  invoice: { valueClass: 'warning', prefix: '' },
}

export function DashboardCard({ label, value, icon, variant, sub }: DashboardCardProps) {
  const { valueClass, prefix } = VARIANT_MAP[variant]
  const isNegative = variant === 'expense'

  return (
    <div className={`summary-card ${variant}`}>
      <div className="summary-label">
        <span>{icon}</span>
        {label}
      </div>
      <div className={`summary-value ${valueClass}`}>
        {isNegative ? '-' : prefix}{formatCurrency(Math.abs(value))}
      </div>
      {sub && <div className="summary-sub">{sub}</div>}
    </div>
  )
}
