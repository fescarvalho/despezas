'use client'

import { useState, useMemo } from 'react'
import { useMonthSelector } from '@/hooks/useMonthSelector'
import { useTransactions } from '@/hooks/useTransactions'
import { useCategories } from '@/hooks/useCategories'
import { useAccounts } from '@/hooks/useAccounts'
import { useCreditCards } from '@/hooks/useCreditCards'
import { MonthSelector } from '@/components/dashboard/MonthSelector'
import { TransactionItem } from '@/components/transactions/TransactionItem'
import { FilterChips } from '@/components/transactions/FilterChips'
import { TransactionModal } from '@/components/transactions/TransactionModal'
import { FAB } from '@/components/ui/FAB'
import { SkeletonList } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ToastProvider, useToast } from '@/components/ui/Toast'
import { formatDateLabel, formatCurrency } from '@/lib/formatters'
import type { Transaction } from '@/types'

function TransactionsContent() {
  const { monthYear, goNext, goPrev } = useMonthSelector()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const { showToast } = useToast()

  const { transactions, loading, monthIncome, monthExpenses, createTransaction, updateTransaction, deleteTransaction } = useTransactions(monthYear, search, typeFilter)
  const { categories } = useCategories()
  const { accounts } = useAccounts()
  const { cards } = useCreditCards()

  const toggleType = (type: string) => {
    setTypeFilter((prev) => prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type])
  }

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, Transaction[]>()
    transactions.forEach((tx) => {
      const key = tx.date
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(tx)
    })
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [transactions])

  const handleSave = async (data: Parameters<typeof createTransaction>[0]) => {
    try {
      if (editingTx) {
        await updateTransaction(editingTx.id, data)
        showToast('Transação atualizada com sucesso!', 'success')
      } else {
        await createTransaction(data as any)
        showToast('Transação adicionada com sucesso!', 'success')
      }
      setEditingTx(null)
    } catch {
      showToast('Erro ao salvar transação.', 'error')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteTransaction(id)
      showToast('Transação excluída com sucesso!', 'success')
      setEditingTx(null)
    } catch {
      showToast('Erro ao excluir transação.', 'error')
    }
  }

  const handleOpenNew = () => {
    setEditingTx(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (tx: Transaction) => {
    setEditingTx(tx)
    setModalOpen(true)
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Extrato</h1>
          <p className="page-subtitle">Veja todas as movimentações do mês</p>
        </div>
        <MonthSelector month={monthYear.month} year={monthYear.year} onPrev={goPrev} onNext={goNext} />
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--color-surface-2)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 20px',
        marginBottom: 24,
        border: '1px solid var(--color-border)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
      }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>Receitas</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-income)' }}>{formatCurrency(monthIncome)}</div>
        </div>
        <div style={{ width: 1, height: 40, background: 'var(--color-border)' }} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>Despesas</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-expense)' }}>{formatCurrency(monthExpenses)}</div>
        </div>
        <div style={{ width: 1, height: 40, background: 'var(--color-border)' }} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>Saldo</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: (monthIncome - monthExpenses) >= 0 ? 'var(--color-income)' : 'var(--color-expense)' }}>
            {formatCurrency(monthIncome - monthExpenses)}
          </div>
        </div>
      </div>

      <FilterChips
        search={search}
        onSearchChange={setSearch}
        activeTypes={typeFilter}
        onTypeToggle={toggleType}
      />

      {loading ? (
        <SkeletonList count={8} />
      ) : grouped.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="Nenhuma transação encontrada"
          description={search ? 'Tente outro termo de busca' : 'Clique no botão + para adicionar uma transação'}
        />
      ) : (
        grouped.map(([date, txs]) => (
          <div key={date} className="transaction-group">
            <div className="transaction-group-header">{formatDateLabel(date)}</div>
            {txs.map((tx) => (
              <TransactionItem 
                key={tx.id} 
                transaction={tx} 
                onClick={handleOpenEdit} 
              />
            ))}
          </div>
        ))
      )}

      <FAB onClick={handleOpenNew} label="Nova transação" />

      <TransactionModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingTx(null)
        }}
        onSave={handleSave}
        onDelete={handleDelete}
        categories={categories}
        accounts={accounts}
        cards={cards}
        initialData={editingTx}
      />
    </div>
  )
}

export default function TransactionsPage() {
  return (
    <ToastProvider>
      <TransactionsContent />
    </ToastProvider>
  )
}
