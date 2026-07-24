'use client'

import type { CreditCard, Invoice, Transaction } from '@/types'
import { formatCurrency } from '@/lib/formatters'
import { TransactionItem } from '@/components/transactions/TransactionItem'
import { EmptyState } from '@/components/ui/EmptyState'
import { Calendar, CreditCard as CreditCardIcon } from 'lucide-react'

interface InvoiceDetailsProps {
  card: CreditCard
  invoice: Invoice | undefined
  transactions: Transaction[]
  dateRange?: { startDate: string, endDate: string } | null
}

const STATUS_LABEL: Record<string, string> = {
  open: 'Aberta',
  closed: 'Fechada',
  paid: 'Paga',
}

export function InvoiceDetails({ card, invoice, transactions, dateRange }: InvoiceDetailsProps) {
  const usedAmount = invoice?.total_amount || transactions.reduce((s, t) => s + t.amount, 0)
  const usedPercent = Math.min((usedAmount / card.limit_amount) * 100, 100)
  const available = card.limit_amount - usedAmount

  const barColor = usedPercent > 80 ? '#EF4444' : usedPercent > 60 ? '#F59E0B' : '#10B981'

  return (
    <div>
      {/* Limit bar */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span className="section-title" style={{ marginBottom: 0 }}>Limite do Cartão</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {dateRange && (
              <span className="status-badge" style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-secondary)' }}>
                {dateRange.startDate.split('-').reverse().slice(0, 2).join('/')} a {dateRange.endDate.split('-').reverse().slice(0, 2).join('/')}
              </span>
            )}
            {invoice && (
              <span className={`status-badge ${invoice.status}`}>
                {STATUS_LABEL[invoice.status]}
              </span>
            )}
          </div>
        </div>

        <div className="limit-bar-container">
          <div className="limit-bar-labels">
            <span>Usado: <strong style={{ color: barColor }}>{formatCurrency(usedAmount)}</strong></span>
            <span>Disponível: <strong style={{ color: '#10B981' }}>{formatCurrency(available)}</strong></span>
          </div>
          <div className="limit-bar-track">
            <div
              className="limit-bar-fill"
              style={{ width: `${usedPercent}%`, background: barColor }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4, fontSize: 12, color: 'var(--color-text-muted)' }}>
            Limite total: {formatCurrency(card.limit_amount)}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-text-secondary)' }}>
            <Calendar size={14} />
            Fecha dia {card.closing_day}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-text-secondary)' }}>
            <CreditCardIcon size={14} />
            Vence dia {card.due_day}
          </div>
        </div>
      </div>

      {/* Invoice transactions */}
      <div className="section-title">Lançamentos da Fatura</div>
      {transactions.length === 0 ? (
        <EmptyState
          icon="🧾"
          title="Fatura sem lançamentos"
          description="Nenhuma transação vinculada a esta fatura ainda"
        />
      ) : (
        <div>
          {transactions.map((tx) => (
            <TransactionItem key={tx.id} transaction={tx} />
          ))}
          <div style={{ padding: '12px 16px', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Total da Fatura</span>
            <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--color-expense)' }}>
              {formatCurrency(usedAmount)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
