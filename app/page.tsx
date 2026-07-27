'use client'

import { useState, useMemo } from 'react'
import { useMonthSelector } from '@/hooks/useMonthSelector'
import { useAccounts } from '@/hooks/useAccounts'
import { useTransactions } from '@/hooks/useTransactions'
import { useCreditCards } from '@/hooks/useCreditCards'
import { useCategories } from '@/hooks/useCategories'
import { MonthSelector } from '@/components/dashboard/MonthSelector'
import { DashboardCard } from '@/components/dashboard/DashboardCard'
import { DonutChart } from '@/components/dashboard/DonutChart'
import { TransactionItem } from '@/components/transactions/TransactionItem'
import { TransactionModal } from '@/components/transactions/TransactionModal'
import { SkeletonCard, SkeletonList } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ToastProvider, useToast } from '@/components/ui/Toast'
import type { Transaction } from '@/types'

function DashboardContent() {
  const { monthYear, goNext, goPrev } = useMonthSelector()
  const { accounts, totalBalance, loading: accsLoading } = useAccounts()
  const { cards } = useCreditCards()
  const { transactions, monthIncome, monthExpenses, loading: txLoading, createTransaction, updateTransaction, deleteTransaction } = useTransactions(monthYear, '', [], [], cards)
  const { categories, createCategory } = useCategories()
  const { showToast } = useToast()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)

  const recentTransactions = useMemo(() => [...transactions].slice(0, 5), [transactions])

  const handleOpenEdit = (tx: Transaction) => {
    setEditingTx(tx)
    setModalOpen(true)
  }

  const handleSave = async (data: Parameters<typeof createTransaction>[0], scope: 'single' | 'future' | 'all' = 'single') => {
    try {
      if (editingTx) {
        await updateTransaction(editingTx.id, data, scope, editingTx)
        showToast('Transação atualizada com sucesso!', 'success')
      } else {
        await createTransaction(data as any)
        showToast('Transação adicionada com sucesso!', 'success')
      }
      setEditingTx(null)
    } catch (err: any) {
      showToast(`Erro ao salvar transação: ${err?.message || 'Erro desconhecido'}`, 'error')
    }
  }

  const handleDelete = async (id: string, scope: 'single' | 'future' | 'all' = 'single') => {
    try {
      await deleteTransaction(id, scope, editingTx || undefined)
      showToast('Transação excluída com sucesso!', 'success')
      setEditingTx(null)
    } catch (err: any) {
      showToast(`Erro ao excluir transação: ${err?.message || 'Erro desconhecido'}`, 'error')
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Visão Geral</h1>
          <p className="page-subtitle">Bem-vindo de volta! 👋</p>
        </div>
        <MonthSelector
          month={monthYear.month}
          year={monthYear.year}
          onPrev={goPrev}
          onNext={goNext}
        />
      </div>

      {/* Summary cards */}
      <div className="summary-grid">
        {accsLoading ? (
          <>
            <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
          </>
        ) : (
          <>
            <DashboardCard
              label="Saldo Total"
              value={totalBalance}
              icon="💼"
              variant="balance"
              sub="Todas as contas"
            />
            <DashboardCard
              label="Receitas"
              value={monthIncome}
              icon="📈"
              variant="income"
              sub="No mês"
            />
            <DashboardCard
              label="Despesas"
              value={monthExpenses}
              icon="📉"
              variant="expense"
              sub="No mês"
            />
            <DashboardCard
              label="Saldo Mensal"
              value={monthIncome - monthExpenses}
              icon="⚖️"
              variant={monthIncome - monthExpenses >= 0 ? 'income' : 'expense'}
              sub="Receitas - Despesas"
            />
          </>
        )}
      </div>

      {/* Charts + Recent */}
      <div className="charts-grid">
        <div className="card">
          <h2 className="section-title">Despesas por Categoria</h2>
          {txLoading ? (
            <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="spinner dark" style={{ width: 40, height: 40 }} />
            </div>
          ) : (
            <DonutChart transactions={transactions} categories={categories} />
          )}
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 className="section-title" style={{ marginBottom: 0 }}>Últimas Transações</h2>
            <a href="/transactions" style={{ fontSize: 13, color: 'var(--color-accent)', fontWeight: 600 }}>Ver todas →</a>
          </div>
          {txLoading ? (
            <SkeletonList count={5} />
          ) : recentTransactions.length === 0 ? (
            <EmptyState
              icon="📋"
              title="Nenhuma transação"
              description="Adicione sua primeira transação"
            />
          ) : (
            recentTransactions.map((tx) => (
              <TransactionItem key={tx.id} transaction={tx} onClick={handleOpenEdit} />
            ))
          )}
        </div>
      </div>

      {/* Balance insight */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', color: 'white', border: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 4 }}>💡 Balanço do Mês</div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1 }}>
              {monthIncome - monthExpenses >= 0 ? '+' : ''}
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthIncome - monthExpenses)}
            </div>
            <div style={{ fontSize: 13, opacity: 0.7, marginTop: 2 }}>
              {monthIncome - monthExpenses >= 0
                ? '🎉 Você está economizando!'
                : '⚠️ Despesas acima das receitas'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Receitas</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthIncome)}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Despesas</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthExpenses)}
              </div>
            </div>
          </div>
        </div>
      </div>

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
        onCreateCategory={createCategory}
      />
    </div>
  )
}

export default function DashboardPage() {
  return (
    <ToastProvider>
      <DashboardContent />
    </ToastProvider>
  )
}
