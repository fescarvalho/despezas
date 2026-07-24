'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getMonthName } from '@/lib/formatters'

interface MonthSelectorProps {
  month: number
  year: number
  onPrev: () => void
  onNext: () => void
}

export function MonthSelector({ month, year, onPrev, onNext }: MonthSelectorProps) {
  return (
    <div className="month-selector">
      <span className="month-selector-label">
        {getMonthName(month)} {year}
      </span>
      <button className="month-nav-btn" onClick={onPrev} aria-label="Mês anterior">
        <ChevronLeft size={16} />
      </button>
      <button className="month-nav-btn" onClick={onNext} aria-label="Próximo mês">
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
