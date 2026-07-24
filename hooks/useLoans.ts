'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Loan } from '@/types'



export function useLoans() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLoans = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('loans')
        .select('*')
        .order('name')

      if (err) throw err

      setLoans(data || [])
    } catch (e) {
      console.error('Error fetching loans:', e)
      setLoans([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLoans()
  }, [fetchLoans])

  const totalOutstanding = loans.reduce((sum, loan) => sum + (loan.outstanding_balance || 0), 0)

  const deleteLoan = async (id: string) => {
    const { error: err } = await supabase.from('loans').delete().eq('id', id)
    if (err) {
      console.error('Supabase delete failed:', err)
      return
    }
    setLoans((prev) => prev.filter((l) => l.id !== id))
  }

  return { loans, loading, error, totalOutstanding, deleteLoan, refetch: fetchLoans }
}
