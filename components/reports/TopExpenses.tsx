'use client'

import { formatCurrency } from '@/lib/formatters'
import type { Transaction } from '@/types'

interface TopExpensesProps {
  transactions: Transaction[]
}

export function TopExpenses({ transactions }: TopExpensesProps) {
  const expenses = transactions.filter((t) => t.type === 'expense')
  const sorted = [...expenses].sort((a, b) => b.amount - a.amount).slice(0, 7)

  if (sorted.length === 0) {
    return <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Nenhuma despesa no período.</p>
  }

  return (
    <div>
      {sorted.map((tx, idx) => (
        <div key={tx.id} className="top-expense-item">
          <div className="top-expense-rank">#{idx + 1}</div>
          <div
            style={{ width: 38, height: 38, borderRadius: 'var(--radius-md)', background: (tx.category?.color || '#EF4444') + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}
          >
            {tx.category?.icon || '💸'}
          </div>
          <div className="top-expense-info">
            <div className="top-expense-name">{tx.description}</div>
            <div className="top-expense-cat">{tx.category?.name || 'Sem categoria'}</div>
          </div>
          <div className="top-expense-amount">{formatCurrency(tx.amount)}</div>
        </div>
      ))}
    </div>
  )
}
