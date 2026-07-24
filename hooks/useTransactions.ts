'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Transaction, MonthYear } from '@/types'

const today = new Date()
const thisMonth = today.toISOString().split('T')[0].substring(0, 7)
const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0].substring(0, 7)

const SEED_TRANSACTIONS: Transaction[] = [
  { id: 'tx-1', account_id: 'acc-1', invoice_id: null, category_id: 'cat-8', amount: 6500, date: `${thisMonth}-05`, description: 'Salário', type: 'income', is_installment: false, category: { id: 'cat-8', name: 'Salário', color: '#10B981', icon: '💼', type: 'income' } },
  { id: 'tx-2', account_id: 'acc-1', invoice_id: null, category_id: 'cat-1', amount: 245.80, date: `${thisMonth}-08`, description: 'Supermercado Extra', type: 'expense', is_installment: false, category: { id: 'cat-1', name: 'Alimentação', color: '#F97316', icon: '🍔', type: 'expense' } },
  { id: 'tx-3', account_id: null, invoice_id: 'inv-1', category_id: 'cat-2', amount: 89.90, date: `${thisMonth}-10`, description: 'Uber', type: 'expense', is_installment: false, category: { id: 'cat-2', name: 'Transporte', color: '#3B82F6', icon: '🚗', type: 'expense' } },
  { id: 'tx-4', account_id: 'acc-1', invoice_id: null, category_id: 'cat-3', amount: 1500, date: `${thisMonth}-05`, description: 'Aluguel', type: 'expense', is_installment: false, category: { id: 'cat-3', name: 'Moradia', color: '#8B5CF6', icon: '🏠', type: 'expense' } },
  { id: 'tx-5', account_id: null, invoice_id: 'inv-1', category_id: 'cat-5', amount: 149.90, date: `${thisMonth}-12`, description: 'Netflix + Spotify', type: 'expense', is_installment: false, category: { id: 'cat-5', name: 'Lazer', color: '#EC4899', icon: '🎮', type: 'expense' } },
  { id: 'tx-6', account_id: null, invoice_id: 'inv-1', category_id: 'cat-6', amount: 450, date: `${thisMonth}-15`, description: 'Curso React', type: 'expense', is_installment: true, installment_info: { current: 3, total: 6 }, category: { id: 'cat-6', name: 'Educação', color: '#14B8A6', icon: '📚', type: 'expense' } },
  { id: 'tx-7', account_id: 'acc-1', invoice_id: null, category_id: 'cat-9', amount: 1200, date: `${thisMonth}-18`, description: 'Freelance – Projeto Web', type: 'income', is_installment: false, category: { id: 'cat-9', name: 'Freelance', color: '#6366F1', icon: '💻', type: 'income' } },
  { id: 'tx-8', account_id: null, invoice_id: 'inv-1', category_id: 'cat-4', amount: 180, date: `${thisMonth}-20`, description: 'Farmácia', type: 'expense', is_installment: false, category: { id: 'cat-4', name: 'Saúde', color: '#10B981', icon: '💊', type: 'expense' } },
  { id: 'tx-9', account_id: null, invoice_id: 'inv-1', category_id: 'cat-7', amount: 329.90, date: `${thisMonth}-22`, description: 'Tênis Nike', type: 'expense', is_installment: false, category: { id: 'cat-7', name: 'Vestuário', color: '#F59E0B', icon: '👔', type: 'expense' } },
  { id: 'tx-10', account_id: 'acc-1', invoice_id: null, category_id: 'cat-1', amount: 68.50, date: `${thisMonth}-23`, description: 'iFood', type: 'expense', is_installment: false, category: { id: 'cat-1', name: 'Alimentação', color: '#F97316', icon: '🍔', type: 'expense' } },
  // Last month
  { id: 'tx-11', account_id: 'acc-1', invoice_id: null, category_id: 'cat-8', amount: 6500, date: `${lastMonth}-05`, description: 'Salário', type: 'income', is_installment: false, category: { id: 'cat-8', name: 'Salário', color: '#10B981', icon: '💼', type: 'income' } },
  { id: 'tx-12', account_id: 'acc-1', invoice_id: null, category_id: 'cat-1', amount: 310, date: `${lastMonth}-10`, description: 'Supermercado', type: 'expense', is_installment: false, category: { id: 'cat-1', name: 'Alimentação', color: '#F97316', icon: '🍔', type: 'expense' } },
  { id: 'tx-13', account_id: 'acc-1', invoice_id: null, category_id: 'cat-3', amount: 1500, date: `${lastMonth}-05`, description: 'Aluguel', type: 'expense', is_installment: false, category: { id: 'cat-3', name: 'Moradia', color: '#8B5CF6', icon: '🏠', type: 'expense' } },
]

let localMockTransactions: Transaction[] | null = null

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
      if (typeFilter.length > 0) query = query.in('type', typeFilter)

      const { data, error: err } = await query
      if (err || !data || data.length === 0) {
        if (!localMockTransactions) localMockTransactions = [...SEED_TRANSACTIONS] as Transaction[]
        setTransactions(filterSeed(monthYear, search, typeFilter, localMockTransactions))
        return
      }

      setTransactions(data)
    } catch {
      if (!localMockTransactions) localMockTransactions = [...SEED_TRANSACTIONS] as Transaction[]
      setTransactions(filterSeed(monthYear, search, typeFilter, localMockTransactions))
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
      console.warn('Supabase delete failed, using local state fallback', err)
      if (!localMockTransactions) localMockTransactions = [...SEED_TRANSACTIONS] as Transaction[]
      localMockTransactions = localMockTransactions.filter(t => t.id !== id)
      setTransactions(filterSeed(monthYear, search, typeFilter, localMockTransactions))
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
      console.warn('Supabase update failed, using local state fallback', err)
      if (!localMockTransactions) localMockTransactions = [...SEED_TRANSACTIONS] as Transaction[]
      localMockTransactions = localMockTransactions.map(t => t.id === id ? { ...t, ...dbPayload } as Transaction : t)
      setTransactions(filterSeed(monthYear, search, typeFilter, localMockTransactions))
      return
    }
    await fetchTransactions()
  }

  return { transactions, loading, error, monthIncome, monthExpenses, createTransaction, updateTransaction, deleteTransaction, refetch: fetchTransactions }
}

function filterSeed(monthYear: MonthYear, search: string, typeFilter: string[], mockData: Transaction[]): Transaction[] {
  const prefix = `${monthYear.year}-${String(monthYear.month).padStart(2, '0')}`
  let result = mockData.filter((t) => t.date.startsWith(prefix))

  if (search) {
    const lower = search.toLowerCase()
    result = result.filter((t) => t.description.toLowerCase().includes(lower))
  }

  if (typeFilter.length > 0) {
    result = result.filter((t) => typeFilter.includes(t.type))
  }

  return result.sort((a, b) => b.date.localeCompare(a.date))
}

export { SEED_TRANSACTIONS }
