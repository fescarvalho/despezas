'use client'

import { useMemo } from 'react'
import { useMonthSelector } from '@/hooks/useMonthSelector'
import { useTransactions } from '@/hooks/useTransactions'
import { useCategories } from '@/hooks/useCategories'
import { MonthSelector } from '@/components/dashboard/MonthSelector'
import { BarChart } from '@/components/reports/BarChart'
import { BudgetBar } from '@/components/reports/BudgetBar'
import { TopExpenses } from '@/components/reports/TopExpenses'
import { addMonths, getMonthName, formatCurrency } from '@/lib/formatters'
import { TrendingDown } from 'lucide-react'

export default function ReportsPage() {
  const { monthYear, goNext, goPrev } = useMonthSelector()
  const { transactions } = useTransactions(monthYear)
  const { categories } = useCategories()

  // Build 6-month data — only expenses for the horizontal chart
  const sixMonths = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => addMonths(monthYear.month, monthYear.year, -(5 - i)))
    return months.map(({ month, year }) => {
      const prefix = `${year}-${String(month).padStart(2, '0')}`
      const txs = transactions.filter((t) => t.date.startsWith(prefix))
      return {
        label: getMonthName(month).substring(0, 3),
        expense: txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      }
    })
  }, [monthYear])

  const totalSixMonthExpenses = sixMonths.reduce((s, m) => s + m.expense, 0)
  const avgExpense = totalSixMonthExpenses / 6

  // Budget bars: categories with budgets
  const budgetCategories = useMemo(() => {
    return categories
      .filter((c) => c.type === 'expense' && c.budget && c.budget > 0)
      .map((cat) => {
        const spent = transactions
          .filter((t) => t.type === 'expense' && t.category_id === cat.id)
          .reduce((s, t) => s + t.amount, 0)
        return { ...cat, spent }
      })
  }, [categories, transactions])

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Relatórios</h1>
          <p className="page-subtitle">Analise seus hábitos financeiros</p>
        </div>
        <MonthSelector month={monthYear.month} year={monthYear.year} onPrev={goPrev} onNext={goNext} />
      </div>

      {/* Horizontal expenses bar chart */}
      <div className="card card-lg" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingDown size={18} color="var(--color-expense)" />
              <h2 className="section-title" style={{ marginBottom: 0 }}>Despesas por Mês</h2>
            </div>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
              Últimos 6 meses · Média: <strong style={{ color: 'var(--color-expense)' }}>{formatCurrency(avgExpense)}</strong>
            </p>
          </div>
          <div style={{
            padding: '8px 16px',
            background: 'var(--color-expense-light)',
            borderRadius: 'var(--radius-full)',
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--color-expense)',
          }}>
            Total: {formatCurrency(totalSixMonthExpenses)}
          </div>
        </div>

        <BarChart
          labels={sixMonths.map((m) => m.label)}
          expenses={sixMonths.map((m) => m.expense)}
        />
      </div>

      <div className="charts-grid">
        {/* Budget bars */}
        <div className="card">
          <h2 className="section-title">Orçamento por Categoria</h2>
          {budgetCategories.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
              Configure orçamentos nas categorias para ver aqui.
            </p>
          ) : (
            budgetCategories.map((cat) => (
              <BudgetBar
                key={cat.id}
                name={cat.name}
                icon={cat.icon}
                spent={cat.spent}
                budget={cat.budget!}
                color={cat.color}
              />
            ))
          )}
        </div>

        {/* Top expenses */}
        <div className="card">
          <h2 className="section-title">Maiores Gastos do Mês</h2>
          <TopExpenses transactions={transactions} />
        </div>
      </div>
    </div>
  )
}
