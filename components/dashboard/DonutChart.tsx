'use client'

import { useEffect, useRef } from 'react'
import { Chart, ArcElement, Tooltip, Legend, DoughnutController } from 'chart.js'
import type { Category, Transaction } from '@/types'
import { formatCurrency } from '@/lib/formatters'
import { EmptyState } from '@/components/ui/EmptyState'

Chart.register(ArcElement, Tooltip, Legend, DoughnutController)

interface DonutChartProps {
  transactions: Transaction[]
  categories: Category[]
}

export function DonutChart({ transactions, categories }: DonutChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  const expenses = transactions.filter((t) => t.type === 'expense')

  const categoryTotals = expenses.reduce<Record<string, number>>((acc, tx) => {
    const catId = tx.category_id
    acc[catId] = (acc[catId] || 0) + tx.amount
    return acc
  }, {})

  const labels: string[] = []
  const values: number[] = []
  const colors: string[] = []

  Object.entries(categoryTotals).forEach(([catId, total]) => {
    const cat = categories.find((c) => c.id === catId) || tx_category(transactions, catId)
    if (cat) {
      labels.push(`${cat.icon || ''} ${cat.name}`)
      values.push(total)
      colors.push(cat.color || '#6366F1')
    }
  })

  useEffect(() => {
    if (!canvasRef.current || values.length === 0) return
    chartRef.current?.destroy()

    chartRef.current = new Chart(canvasRef.current, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: colors.map((c) => c + 'DD'),
          borderColor: colors,
          borderWidth: 2,
          hoverOffset: 10,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            align: 'start',
            labels: {
              font: { family: 'Inter', size: 12, weight: 'bold' },
              color: '#FFFFFF',
              padding: 12,
              usePointStyle: true,
              pointStyleWidth: 8,
            },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${formatCurrency(ctx.parsed)}`,
            },
            backgroundColor: 'rgba(17,24,39,0.9)',
            titleFont: { family: 'Inter', size: 13 },
            bodyFont: { family: 'Inter', size: 13 },
            padding: 12,
            cornerRadius: 8,
          },
        },
      },
    })

    return () => { chartRef.current?.destroy() }
  }, [labels.join(','), values.join(','), colors.join(',')])

  if (values.length === 0) {
    return (
      <EmptyState
        icon="🍩"
        title="Sem despesas no mês"
        description="Adicione transações para ver a distribuição por categoria"
      />
    )
  }

  return (
    <div className="chart-container" style={{ maxHeight: 320, display: 'flex', justifyContent: 'center', width: '100%' }}>
      <canvas ref={canvasRef} />
    </div>
  )
}

function tx_category(transactions: Transaction[], catId: string): Category | undefined {
  return transactions.find((t) => t.category_id === catId)?.category
}
