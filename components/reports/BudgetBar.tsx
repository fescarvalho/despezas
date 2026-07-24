'use client'

import { formatCurrency } from '@/lib/formatters'

interface BudgetBarProps {
  name: string
  icon: string
  spent: number
  budget: number
  color: string
}

export function BudgetBar({ name, icon, spent, budget, color }: BudgetBarProps) {
  const percent = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0
  const isOver = spent > budget
  const barColor = isOver ? '#EF4444' : percent > 80 ? '#F59E0B' : color

  return (
    <div className="budget-bar">
      <div className="budget-bar-header">
        <span className="budget-bar-name">
          <span>{icon}</span>
          {name}
        </span>
        <span className="budget-bar-values">
          <span style={{ color: isOver ? 'var(--color-expense)' : 'var(--color-text-primary)', fontWeight: 600 }}>
            {formatCurrency(spent)}
          </span>
          <span style={{ color: 'var(--color-text-muted)' }}> / {formatCurrency(budget)}</span>
        </span>
      </div>
      <div className="budget-track">
        <div
          className="budget-fill"
          style={{ width: `${percent}%`, background: barColor }}
        />
      </div>
      {isOver && (
        <div style={{ fontSize: 11, color: 'var(--color-expense)', marginTop: 4, fontWeight: 600 }}>
          ⚠️ Orçamento excedido em {formatCurrency(spent - budget)}
        </div>
      )}
    </div>
  )
}
