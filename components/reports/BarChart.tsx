'use client'

import { useEffect, useRef } from 'react'
import {
  Chart,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  BarController,
} from 'chart.js'
import { formatCurrency } from '@/lib/formatters'
import { EmptyState } from '@/components/ui/EmptyState'

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, BarController)

interface BarChartProps {
  /** Labels for each bar (ex: month names) */
  labels: string[]
  /** Expense values in the same order as labels */
  expenses: number[]
}

export function BarChart({ labels, expenses }: BarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  const hasData = expenses.some((v) => v > 0)

  useEffect(() => {
    if (!canvasRef.current || !hasData) return
    chartRef.current?.destroy()

    // Gradient fill for bars
    const ctx = canvasRef.current.getContext('2d')
    let bgColor: string | CanvasGradient = 'rgba(239,68,68,0.75)'
    if (ctx) {
      const gradient = ctx.createLinearGradient(0, 0, canvasRef.current.width || 400, 0)
      gradient.addColorStop(0, 'rgba(239,68,68,0.9)')
      gradient.addColorStop(1, 'rgba(248,113,113,0.5)')
      bgColor = gradient
    }

    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Despesas',
            data: expenses,
            backgroundColor: bgColor,
            borderColor: '#EF4444',
            borderWidth: 1.5,
            borderRadius: 8,
            borderSkipped: false,
          },
        ],
      },
      options: {
        // ← Horizontal bars
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${formatCurrency(ctx.parsed.x)}`,
            },
            backgroundColor: 'rgba(17,24,39,0.92)',
            titleFont: { family: 'Inter', size: 13, weight: 'bold' },
            bodyFont: { family: 'Inter', size: 13 },
            padding: 12,
            cornerRadius: 8,
          },
        },
        scales: {
          y: {
            grid: { display: false },
            ticks: {
              font: { family: 'Inter', size: 13, weight: '600' },
              color: '#FFFFFF',
            },
          },
          x: {
            grid: { color: 'rgba(156,163,175,0.15)' },
            ticks: {
              font: { family: 'Inter', size: 11 },
              color: '#FFFFFF',
              callback: (v) => {
                const n = Number(v)
                if (n >= 1000) return `R$ ${(n / 1000).toFixed(0)}k`
                return `R$ ${n}`
              },
            },
            border: { display: false },
          },
        },
      },
    })

    return () => { chartRef.current?.destroy() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify({ labels, expenses })])

  if (!hasData) {
    return (
      <EmptyState
        icon="📊"
        title="Sem despesas no período"
        description="Adicione transações para ver a evolução de gastos"
      />
    )
  }

  return (
    // Fixed height so horizontal chart renders correctly
    <div style={{ position: 'relative', width: '100%', height: `${Math.max(labels.length * 52, 200)}px` }}>
      <canvas ref={canvasRef} />
    </div>
  )
}
