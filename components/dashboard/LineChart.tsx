'use client'

import { useEffect, useRef, useState } from 'react'
import { Chart, LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Filler } from 'chart.js'
import { supabase } from '@/lib/supabase'
import type { CreditCard, Transaction } from '@/types'
import { formatCurrency } from '@/lib/formatters'

Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Filler)

interface LineChartProps {
  year: number
  cards: CreditCard[]
}

function getInvoiceMonth(purchaseDate: string, closingDay: number): { month: number; year: number } {
  const [y, m, d] = purchaseDate.split('-').map(Number)
  if (d >= closingDay) {
    const next = new Date(y, m, 1)
    return { month: next.getMonth() + 1, year: next.getFullYear() }
  }
  return { month: m, year: y }
}

export function LineChart({ year, cards }: LineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)
  const [data, setData] = useState<number[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const fetchStart = `${year - 1}-12-01` // Include December for credit card lag
        const endDateStr = `${year}-12-31`

        const { data: txs, error } = await supabase
          .from('transactions')
          .select('*, invoice:invoices(*)')
          .is('deleted_at', null)
          .gte('date', fetchStart)
          .lte('date', endDateStr)
          .eq('type', 'expense')

        if (error) throw error

        const monthlyTotals = Array(12).fill(0)

        ;(txs || []).forEach((tx: any) => {
          let txMonth = -1
          let txYear = -1

          if (tx.card_id) {
            if (tx.invoice?.month != null && tx.invoice?.year != null) {
              txMonth = tx.invoice.month
              txYear = tx.invoice.year
            } else {
              const card = cards.find(c => c.id === tx.card_id)
              if (card?.closing_day) {
                const inv = getInvoiceMonth(tx.date, card.closing_day)
                txMonth = inv.month
                txYear = inv.year
              } else {
                const [y, m] = tx.date.split('-').map(Number)
                txMonth = m
                txYear = y
              }
            }
          } else {
            const [y, m] = tx.date.split('-').map(Number)
            txMonth = m
            txYear = y
          }

          if (txYear === year && txMonth >= 1 && txMonth <= 12) {
            monthlyTotals[txMonth - 1] += tx.amount
          }
        })

        setData(monthlyTotals)
      } catch (e) {
        console.error('Error fetching yearly data:', e)
        setData(Array(12).fill(0))
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [year, cards])

  useEffect(() => {
    if (!canvasRef.current || loading) return
    chartRef.current?.destroy()

    const monthLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    
    // Calcula um gradiente para a área abaixo da linha
    const ctx = canvasRef.current.getContext('2d')
    let gradient: any = 'rgba(99, 102, 241, 0.2)'
    if (ctx) {
      gradient = ctx.createLinearGradient(0, 0, 0, 300)
      gradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)')
      gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)')
    }

    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels: monthLabels,
        datasets: [{
          data,
          borderColor: '#6366F1',
          backgroundColor: gradient,
          borderWidth: 3,
          pointBackgroundColor: '#111827',
          pointBorderColor: '#6366F1',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.4 // Linha suave
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` Despesas: ${formatCurrency(ctx.parsed.y)}`,
            },
            backgroundColor: 'rgba(17,24,39,0.9)',
            titleFont: { family: 'Inter', size: 13 },
            bodyFont: { family: 'Inter', size: 13 },
            padding: 12,
            cornerRadius: 8,
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { family: 'Inter', size: 11 }, color: '#9CA3AF' }
          },
          y: {
            border: { display: false },
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { 
              font: { family: 'Inter', size: 11 }, 
              color: '#9CA3AF',
              callback: (val) => {
                const num = Number(val)
                return num >= 1000 ? `R$ ${(num / 1000).toFixed(1)}k` : `R$ ${num}`
              }
            }
          }
        }
      },
    })

    return () => { chartRef.current?.destroy() }
  }, [data, loading])

  return (
    <div className="chart-container" style={{ height: 280, width: '100%', position: 'relative' }}>
      {loading ? (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="spinner dark" style={{ width: 40, height: 40 }} />
        </div>
      ) : (
        <canvas ref={canvasRef} />
      )}
    </div>
  )
}
