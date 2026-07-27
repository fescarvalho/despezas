'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { getInvoiceDateRange } from '@/lib/invoiceUtils'
import type { Transaction } from '@/types'

export function useInvoiceTransactions(cardId: string | undefined, closingDay: number | undefined, month: number, year: number) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<{startDate: string, endDate: string} | null>(null)

  const fetchTransactions = useCallback(async () => {
    if (!cardId || !closingDay) {
      setTransactions([])
      setDateRange(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const { startDate, endDate } = getInvoiceDateRange(closingDay, month, year)
      setDateRange({ startDate, endDate })

      const { data, error: err } = await supabase
        .from('transactions')
        .select('*, category:categories(*), account:accounts(*), invoice:invoices(*, credit_card:credit_cards(*))')
        .is('deleted_at', null)
        .eq('card_id', cardId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })

      if (err) throw err
      setTransactions(data || [])
    } catch (e: any) {
      console.error('Error fetching invoice transactions:', e)
      setError(e.message)
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }, [cardId, closingDay, month, year])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  return {
    transactions,
    loading,
    error,
    dateRange,
    refresh: fetchTransactions
  }
}
