'use client'

import type { Transaction } from '@/types'
import { formatCurrency, formatShortDate } from '@/lib/formatters'

interface TransactionItemProps {
  transaction: Transaction
  onClick?: (tx: Transaction) => void
}

export function TransactionItem({ transaction, onClick }: TransactionItemProps) {
  const { description, amount, type, date, category, account, invoice } = transaction

  const icon = category?.icon || (type === 'income' ? '💰' : type === 'expense' ? '💸' : '↔️')
  const categoryColor = category?.color || (type === 'income' ? '#10B981' : '#EF4444')

  let sub = ''
  if (account?.name) sub = account.name
  else if (invoice?.credit_card?.name) sub = invoice.credit_card.name
  else if (transaction.invoice_id) sub = 'Fatura'

  if (transaction.is_installment && transaction.installment_info) {
    sub += sub ? ` · ${transaction.installment_info.current}/${transaction.installment_info.total}x` : `${transaction.installment_info.current}/${transaction.installment_info.total}x`
  }

  return (
    <div className="transaction-item" onClick={() => onClick?.(transaction)} role={onClick ? 'button' : undefined}>
      <div
        className="transaction-icon"
        style={{ background: categoryColor + '20' }}
      >
        {icon}
      </div>
      <div className="transaction-info">
        <div className="transaction-name">{description}</div>
        {sub && <div className="transaction-sub">{sub}</div>}
      </div>
      <div className="transaction-right">
        <div className={`transaction-amount ${type}`}>
          {type === 'income' ? '+' : type === 'expense' ? '-' : ''}
          {formatCurrency(amount)}
        </div>
        <div className="transaction-date">{formatShortDate(date)}</div>
      </div>
    </div>
  )
}
