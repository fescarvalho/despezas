'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Transaction, MonthYear } from '@/types'



export function useTransactions(monthYear: MonthYear, search = '', typeFilter: string[] = []) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const startDate = `${monthYear.year}-${String(monthYear.month).padStart(2, '0')}-01`
      const endDate = new Date(monthYear.year, monthYear.month, 0).toISOString().split('T')[0]

      let query = supabase
        .from('transactions')
        .select('*, category:categories(*), account:accounts(*), invoice:invoices(*, credit_card:credit_cards(*))')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })

      if (search) query = query.ilike('description', `%${search}%`)
      const { data, error: err } = await query
      if (err) throw err
      setTransactions(data || [])
    } catch (e) {
      console.error('Error fetching transactions:', e)
      setTransactions([])
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthYear.month, monthYear.year, search, typeFilter.join(',')])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])

  const monthIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const monthExpenses = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  const createTransaction = async (payload: any) => {
    const payloads = []
    
    if (payload.is_installment) {
      const freqMonths: Record<string, number> = {
        mensal: 1, bimestral: 2, trimestral: 3, semestral: 6, anual: 12
      }
      const step = freqMonths[payload.frequency || 'mensal'] || 1
      
      const totalOccurrences = payload.installment_total === 1 ? 24 : payload.installment_total
      const amountPerOcc = payload.is_value_per_installment 
        ? payload.amount 
        : (payload.amount / totalOccurrences)
        
      const [year, month, day] = payload.date.split('-').map(Number)
      
      for (let i = 0; i < totalOccurrences; i++) {
        const dateObj = new Date(year, month - 1 + (i * step), day)
        const dStr = dateObj.toISOString().split('T')[0]
        
        payloads.push({
          description: payload.installment_total === 1 
            ? payload.description 
            : `${payload.description} (${i + 1}/${totalOccurrences})`,
          amount: amountPerOcc,
          date: dStr,
          type: payload.type,
          category_id: payload.category_id,
          account_id: payload.account_id,
          is_installment: payload.is_installment,
          installment_total: payload.installment_total,
        })
      }
    } else {
      payloads.push({
        description: payload.description,
        amount: payload.amount,
        date: payload.date,
        type: payload.type,
        category_id: payload.category_id,
        account_id: payload.account_id,
        is_installment: false,
      })
    }

    const { data, error: err } = await supabase.from('transactions').insert(payloads).select()
    if (err) {
      console.warn('Supabase insert failed, using local state fallback', err)
      if (!localMockTransactions) localMockTransactions = [...SEED_TRANSACTIONS] as Transaction[]
      const newTxs = payloads.map((p, i) => ({ ...p, id: `tx-new-${Date.now()}-${i}` })) as Transaction[]
      localMockTransactions.push(...newTxs)
      setTransactions(filterSeed(monthYear, search, typeFilter, localMockTransactions))
      return payloads
    }
    await fetchTransactions()
    return data
  }

  const deleteTransaction = async (id: string) => {
    const { error: err } = await supabase.from('transactions').delete().eq('id', id)
    if (err) {
      console.error('Supabase delete failed:', err)
      return
    }
    setTransactions((prev) => prev.filter((t) => t.id !== id))
  }

  const updateTransaction = async (id: string, payload: any) => {
    const dbPayload = { ...payload }
    delete dbPayload.is_installment
    delete dbPayload.installment_total
    delete dbPayload.frequency
    delete dbPayload.is_value_per_installment

    const { error: err } = await supabase.from('transactions').update(dbPayload).eq('id', id)
    if (err) {
      console.error('Supabase update failed:', err)
      return
    }
    await fetchTransactions()
  }

  return { transactions, loading, error, monthIncome, monthExpenses, createTransaction, updateTransaction, deleteTransaction, refetch: fetchTransactions }
}
