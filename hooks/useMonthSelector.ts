'use client'

import { useState, useCallback } from 'react'
import { getCurrentMonthYear, addMonths } from '@/lib/formatters'
import type { MonthYear } from '@/types'

export function useMonthSelector() {
  const [monthYear, setMonthYear] = useState<MonthYear>(() => {
    const current = getCurrentMonthYear()
    return addMonths(current.month, current.year, 1)
  })

  const goNext = useCallback(() => {
    setMonthYear((prev) => addMonths(prev.month, prev.year, 1))
  }, [])

  const goPrev = useCallback(() => {
    setMonthYear((prev) => addMonths(prev.month, prev.year, -1))
  }, [])

  return { monthYear, goNext, goPrev }
}
